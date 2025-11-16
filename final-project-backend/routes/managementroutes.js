const express = require('express');
const router = express.Router();
const dbSingleton = require('../dbSingleton');
const {
  isAuthenticated,
  isAdminOrStaff
} = require('./authMiddleware');

// GET /api/admin/orders
router.get('/orders', isAuthenticated, isAdminOrStaff, async (req, res) => {
  const db = require('../dbSingleton').getConnection().promise();

  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  const search = (req.query.search || "").trim();
  const status = (req.query.status || "").trim();

  const where = [];
  const params = [];

  // Filters applied ONLY on order + user (not items), so count/pagination are stable
  if (search) {
    where.push(`(u.name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) {
    where.push(`o.status = ?`);
    params.push(status);
  }

  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    // 1) Count DISTINCT orders (no item/book joins here)
    const [cnt] = await db.query(
      `
      SELECT COUNT(DISTINCT o.order_id) AS total
      FROM \`order\` o
      JOIN users u ON u.user_id = o.user_id
      ${whereSQL}
      `,
      params
    );
    const total = cnt[0]?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    if (total === 0) {
      return res.json({ orders: [], totalPages });
    }

    // 2) Get one row per order (the "headers") for the requested page
    const [headers] = await db.query(
      `
      SELECT
        o.order_id,
        o.status,
        o.extensions_used,
        u.name  AS customer_name,
        u.email AS email,
        u.phone_number
      FROM \`order\` o
      JOIN users u ON u.user_id = o.user_id
      ${whereSQL}
      ORDER BY (o.status='Pending') DESC, o.order_id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    const ids = headers.map(h => h.order_id);
    if (!ids.length) {
      return res.json({ orders: [], totalPages });
    }

    // 3) Fetch items just for these orders (LEFT JOIN so missing books/items won't hide orders)
    const placeholders = ids.map(() => '?').join(',');
    const [items] = await db.query(
      `
      SELECT 
        oi.order_id,
        oi.due_date,
        oi.type,
        oi.quantity,
        b.title AS book_title
      FROM order_items oi
      LEFT JOIN book b ON b.book_id = oi.book_id
      WHERE oi.order_id IN (${placeholders})
      `,
      ids
    );

    // 4) Flatten back to "rows" that your frontend groups
    const headerById = Object.fromEntries(headers.map(h => [h.order_id, h]));
    const rows = [];
    for (const id of ids) {
      const h = headerById[id];
      const its = items.filter(i => i.order_id === id);
      if (its.length === 0) {
        rows.push({
          order_id: h.order_id,
          status: h.status,
          extensions_used: h.extensions_used,
          customer_name: h.customer_name,
          email: h.email,
          phone_number: h.phone_number,
          due_date: null,
          type: null,
          quantity: null,
          book_title: null
        });
      } else {
        for (const it of its) {
          rows.push({
            order_id: h.order_id,
            status: h.status,
            extensions_used: h.extensions_used,
            customer_name: h.customer_name,
            email: h.email,
            phone_number: h.phone_number,
            due_date: it.due_date,
            type: it.type,
            quantity: it.quantity,
            book_title: it.book_title
          });
        }
      }
    }

    res.json({ orders: rows, totalPages });
  } catch (err) {
    console.error("Admin/Staff orders fetch error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// PUT /api/admin/orders/:id  
router.put('/orders/:id', isAuthenticated, isAdminOrStaff, async (req, res) => {
  const db = require('../dbSingleton').getConnection().promise();
  const orderId = req.params.id;
  const { status, due_date } = req.body;

  try {
    await db.query('START TRANSACTION');

    const [[{ due_date: currentDue } = {}] = []] = await db.query(
      `SELECT due_date FROM order_items WHERE order_id = ? AND type = 'rent' LIMIT 1`,
      [orderId]
    );

    const [[{ extensions_used } = {}] = []] = await db.query(
      `SELECT extensions_used FROM \`order\` WHERE order_id = ?`,
      [orderId]
    );

    if (currentDue === undefined && extensions_used === undefined) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: "Order not found." });
    }

    let isExtension = false;
    if (due_date && currentDue) {
      const oldDue = new Date(currentDue);
      const newDue = new Date(due_date);
      const now = new Date();

      const tryingToExtend = newDue > oldDue;
      const isOverdue = oldDue < now;
      const exceedsMaxPeriod = (newDue - oldDue) / (1000 * 60 * 60 * 24) > 30;

      if (tryingToExtend) {
        if (isOverdue) {
          await db.query('ROLLBACK');
          return res.status(400).json({ message: "Cannot extend: rental is already overdue." });
        }
        if (extensions_used >= 2) {
          await db.query('ROLLBACK');
          return res.status(400).json({ message: "Maximum of 2 extensions reached." });
        }
        if (exceedsMaxPeriod) {
          await db.query('ROLLBACK');
          return res.status(400).json({ message: "Cannot extend beyond 30 days from original date." });
        }
        isExtension = true;
      }
    }

    if (status) {
      await db.query(
        `UPDATE \`order\` SET status = ?, extensions_used = extensions_used + ? WHERE order_id = ?`,
        [status, isExtension ? 1 : 0, orderId]
      );

      if (['Completed', 'Returned', 'Canceled'].includes(status)) {
        await db.query(
          `UPDATE order_items
             SET returned_at = COALESCE(returned_at, NOW())
           WHERE order_id = ? AND type = 'rent'`,
          [orderId]
        );
      }
    }

    if (due_date) {
      await db.query(
        `UPDATE order_items
           SET due_date = ?
         WHERE order_id = ?
           AND type = 'rent'
           AND (returned_at IS NULL OR returned_at = '0000-00-00 00:00:00')`,
        [due_date, orderId]
      );
    }

    await db.query('COMMIT');
    res.json({ message: "Order updated successfully." });
  } catch (err) {
    try { await db.query('ROLLBACK'); } catch {}
    console.error("Admin order update error:", err);
    res.status(500).json({ message: "Failed to update order" });
  }
});

module.exports = router;
