// routes/email.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const dbSingleton = require("../dbSingleton");
const db = dbSingleton.getConnection();
require("dotenv").config();

const cron = require("node-cron");
const { DateTime } = require("luxon");
const ZONE = "Asia/Jerusalem";

/* =========================
   Transporter (SMTP)
   ========================= */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587", 10),
  secure: String(process.env.EMAIL_SECURE).toLowerCase() === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) console.log("Transporter error:", error);
  else console.log("✅ SMTP ready");
});

/* =========================
   Small helpers
   ========================= */
function q(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function formatILS(amount) {
  try {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `₪${Number(amount).toFixed(2)}`;
  }
}

function r2(x) {
  return Math.round((Number(x) + Number.EPSILON) * 100) / 100;
}

/* =========================================================
   RECEIPT: load order + items (per-item due_date)
   ========================================================= */
async function getOrderForEmail(orderId) {
  const orderSql = `
    SELECT o.order_id, o.user_id, o.status, u.email, u.name
    FROM \`order\` o
    JOIN users u ON u.user_id = o.user_id
    WHERE o.order_id = ? LIMIT 1
  `;
  const itemsSql = `
  SELECT
    oi.book_id,
    b.title,
    oi.quantity AS quantity,
    oi.type,
    COALESCE(oi.price, b.price) AS unit_price,
    oi.due_date
  FROM order_items oi
  JOIN book b ON b.book_id = oi.book_id
  WHERE oi.order_id = ?
  `;


  const [order] = await q(orderSql, [orderId]);
  if (!order) throw new Error("Order not found");

  const items = await q(itemsSql, [orderId]);
  const itemsWithTotals = items.map((it) => ({
  ...it,
  quantity: Number(it.quantity || 1),
  unit_price: Number(it.unit_price),
  line_total: r2(Number(it.unit_price) * Number(it.quantity || 1)),
  }));

  const subtotal = r2(itemsWithTotals.reduce((s, it) => s + it.line_total, 0));
  const vat = r2(subtotal * 0.18); // your 18% VAT
  const grand = r2(subtotal + vat);

  return { order, items: itemsWithTotals, totals: { subtotal, vat, grand } };
}

/* =========================================================
   RECEIPT: HTML
   ========================================================= */
function renderReceiptEmail({ order, items, totals }) {
  const rows = items
    .map((it) => {
      const due =
        it.type === "rent" && it.due_date
          ? `<div style="font-size:12px;color:#666">Due: ${new Date(it.due_date).toLocaleDateString(
              "he-IL"
            )}</div>`
          : "";
      return `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">
          ${it.title}
          ${due}
        </td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${it.type}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${it.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${formatILS(it.unit_price)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${formatILS(it.line_total)}</td>
      </tr>`;
    })
    .join("");

  const html = `
  <div style="font-family:system-ui,Segoe UI,Arial;max-width:640px;margin:auto">
    <h2>Receipt – Order #${order.order_id}</h2>
    <p>Hi ${order.name || "Customer"}, thanks for your order!</p>
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:12px 0">
      <thead>
        <tr>
          <th align="left">Book</th>
          <th align="left">Type</th>
          <th align="left">Qty</th>
          <th align="left">Unit</th>
          <th align="left">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="4" align="right" style="padding:8px 0">Subtotal:</td><td>${formatILS(
          totals.subtotal
        )}</td></tr>
        <tr><td colspan="4" align="right" style="padding:2px 0">VAT (18%):</td><td>${formatILS(
          totals.vat
        )}</td></tr>
        <tr><td colspan="4" align="right" style="padding:8px 0;font-weight:700">Grand Total:</td><td><strong>${formatILS(
          totals.grand
        )}</strong></td></tr>
      </tfoot>
    </table>
    <p>Need help? Reply to this email.</p>
  </div>`;

  return {
    subject: `Your receipt – Order #${order.order_id}`,
    html,
    text: `Receipt for order #${order.order_id}. Total: ${formatILS(totals.grand)}`,
  };
}

/* =========================================================
   PUBLIC: sendReceipt(orderId)
   ========================================================= */
async function sendReceipt(orderId) {
  const { order, items, totals } = await getOrderForEmail(orderId);
  const { subject, html, text } = renderReceiptEmail({ order, items, totals });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: order.email,
    subject,
    html,
    text,
  });

  // Optional: log if you created email_log
  try {
    await q(
      "INSERT INTO email_log (order_id, user_id, email_type) VALUES (?, ?, 'receipt')",
      [order.order_id, order.user_id]
    );
  } catch {}
}

/* =========================================================
   REMINDERS: fetch active rental items by order
   - type='rent', due_date not null, not returned
   ========================================================= */
async function fetchActiveRentalItems() {
    const sql = `
  SELECT
    o.order_id, o.user_id, u.email, u.name,
    oi.book_id, b.title,
    oi.quantity AS quantity,
    oi.due_date, oi.returned_at,
    DATEDIFF(oi.due_date, CURDATE()) AS days_until_due
  FROM \`order\` o
  JOIN users u ON u.user_id = o.user_id
  JOIN order_items oi ON oi.order_id = o.order_id
  JOIN book b ON b.book_id = oi.book_id
  WHERE oi.type = 'rent'
    AND oi.due_date IS NOT NULL
    AND (oi.returned_at IS NULL OR oi.returned_at = '0000-00-00 00:00:00')
    AND o.status NOT IN ('Completed','Cancelled')   
  `;
  return q(sql);
}

function groupByOrder(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.order_id)) {
      map.set(r.order_id, {
        order_id: r.order_id,
        user_id: r.user_id,
        email: r.email,
        name: r.name,
        items: [],
      });
    }
    map.get(r.order_id).items.push(r);
  }
  return Array.from(map.values());
}

function classifyUrgencyForOrder(order) {
  // Highest urgency wins: overdue > today > soon(2 days)
  let hasOverdue = false,
    hasToday = false,
    hasSoon = false;
  for (const it of order.items) {
    const d = Number(it.days_until_due);
    if (d < 0) hasOverdue = true;
    else if (d === 0) hasToday = true;
    else if (d === 2) hasSoon = true;
  }
  if (hasOverdue) return "overdue_daily";
  if (hasToday) return "due_today";
  if (hasSoon) return "due_soon";
  return null;
}

function renderSummaryEmail(order, type) {
  const rows = order.items
    .filter((it) => {
      const d = Number(it.days_until_due);
      if (type === "overdue_daily") return d < 0;
      if (type === "due_today") return d === 0;
      if (type === "due_soon") return d === 2;
      return false;
    })
    .map((it) => {
      const daysLate = Math.max(0, -Number(it.days_until_due || 0));
      // fee is per copy: ₪5/day * quantity
      const fee = r2(daysLate * 5 * Number(it.quantity || 1));
      const feeText = daysLate > 0 ? ` — Fee so far: ${formatILS(fee)}` : "";
      const dateStr = new Date(it.due_date).toLocaleDateString("he-IL");
      return `<li>${it.title} (x${it.quantity}) — due ${dateStr}${feeText}</li>`;
    })
    .join("");

  let subject, intro;
  if (type === "overdue_daily") {
    subject = `Overdue items – Order #${order.order_id}`;
    intro =
      "The following rental items are overdue. Fees accrue at ₪5/day per copy (paid in person):";
  } else if (type === "due_today") {
    subject = `Due today – Order #${order.order_id}`;
    intro = "These rental items are due today:";
  } else {
    subject = `Due in 2 days – Order #${order.order_id}`;
    intro = "Reminder: these rental items are due in 2 days:";
  }

  return {
    subject,
    html: `
      <div style="font-family:system-ui;max-width:640px;margin:auto">
        <h2>Hi ${order.name || "there"} 👋</h2>
        <p>${intro}</p>
        <ul>${rows}</ul>
        <p>Please return on time. Late fees are <strong>₪5/day per copy</strong>, payable <em>in person</em>.</p>
      </div>
    `,
  };
}

/* =========================================================
   email_log duplicate checks (safe if table exists)
   ========================================================= */
async function alreadySentToday(orderId, emailType) {
  try {
    const rows = await q(
      "SELECT 1 FROM email_log WHERE order_id=? AND email_type=? AND DATE(sent_at)=CURDATE() LIMIT 1",
      [orderId, emailType]
    );
    return rows.length > 0;
  } catch {
    return false; // if table doesn't exist, don't block sending
  }
}
async function insertLog(orderId, userId, emailType) {
  try {
    await q(
      "INSERT INTO email_log (order_id, user_id, email_type) VALUES (?, ?, ?)",
      [orderId, userId, emailType]
    );
  } catch {}
}

/* =========================================================
   PUBLIC: runRemindersOnce (can be called manually)
   ========================================================= */
async function runRemindersOnce() {
  const rows = await fetchActiveRentalItems();
  const grouped = groupByOrder(rows);

  for (const ord of grouped) {
    const type = classifyUrgencyForOrder(ord);
    if (!type) continue;
    if (await alreadySentToday(ord.order_id, type)) continue;

    const { subject, html } = renderSummaryEmail(ord, type);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: ord.email,
      subject,
      html,
    });
    await insertLog(ord.order_id, ord.user_id, type);
  }
}

/* =========================================================
   CRON: start daily reminders at 09:00 Asia/Jerusalem
   ========================================================= */
function startCron() {
  cron.schedule(
    "0 9 * * *",
    () => {
      runRemindersOnce().catch(console.error);
    },
    { timezone: ZONE }
  );
  console.log("⏰ Reminder cron scheduled for 09:00 Asia/Jerusalem");
}

/* =========================================================
   EXISTING: Contact endpoint (kept for StaffEmailReplies)
   ========================================================= */
router.post("/contact", async (req, res) => {
  const { firstName, lastName, email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ message: "Email and message required." });
  }

  try {
    await transporter.sendMail({
      from: `"${firstName || ""} ${lastName || ""}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: "📩 New Contact Message from BookHaven",
      text: `${message}\n\nFrom: ${firstName || ""} ${lastName || ""} (${email})`,
      html: `
        <p><strong>From:</strong> ${firstName || ""} ${lastName || ""} (${email})</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    const sql = `
      INSERT INTO contact_messages (first_name, last_name, email, message)
      VALUES (?, ?, ?, ?)
    `;
    db.query(sql, [firstName || "", lastName || "", email, message], (err) => {
      if (err) console.error("❌ Failed to save message to DB:", err);
      else console.log("✅ Message saved to database.");
    });

    res.status(200).json({ message: "Message sent successfully." });
  } catch (err) {
    console.error("❌ Email error:", err);
    res.status(500).json({ message: "Failed to send message." });
  }
});

/* =========================================================
   OPTIONAL: admin test endpoints
   ========================================================= */
router.post("/admin/email/test/receipt/:orderId", async (req, res) => {
  try {
    await sendReceipt(req.params.orderId);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

router.post("/admin/email/test/run-reminders", async (_req, res) => {
  try {
    await runRemindersOnce();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

/* =========================================================
   EXPORTS
   ========================================================= */
module.exports = {
  router,
  transporter,
  sendReceipt,
  startCron,
  runRemindersOnce,
};
