// routes/createorder.js
const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const db = dbSingleton.getConnection();

// ---- helpers ----
function q(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

// compute discounted unit price (book discount > category discount; rent = half)
function computeUnitPriceFor(row, type) {
  const base =
    row.book_discount_percent != null
      ? Number(row.price) * (1 - Number(row.book_discount_percent) / 100)
      : row.cat_discount_percent != null
      ? Number(row.price) * (1 - Number(row.cat_discount_percent) / 100)
      : Number(row.price);
  const unit = type === "rent" ? base / 2 : base;
  return Math.round((unit + Number.EPSILON) * 100) / 100;
}

// require login
function isLoggedIn(req, res, next) {
  if (!req.session?.user_id) return res.status(401).json({ message: "Not logged in" });
  next();
}

/**
 * POST /api/order/create
 * Body may include { paymentDetails }, but we ignore client cart and read cart from DB.
 */
router.post("/create", isLoggedIn, async (req, res) => {
  const user_id = req.session.user_id;

  try {
    // 1) Load server-side cart with pricing/discounts
    const cartRows = await q(
      `SELECT
         sc.book_id,
         sc.amount AS quantity,
         sc.type,
         b.title,
         b.price,
         b.count AS stock,
         db.discount_percent AS book_discount_percent,
         dc.discount_percent AS cat_discount_percent
       FROM shoppingcart sc
       JOIN book b ON b.book_id = sc.book_id
       LEFT JOIN discounts db ON b.book_id = db.book_id
       LEFT JOIN discounts dc ON b.category = dc.category
       WHERE sc.user_id = ?`,
      [user_id]
    );

    if (!cartRows.length) return res.status(400).json({ message: "Your cart is empty." });

    // 2) Compute item prices & validate stock
    const items = cartRows.map((r) => ({
      book_id: Number(r.book_id),
      title: r.title,
      quantity: Number(r.quantity),
      type: r.type === "rent" ? "rent" : "buy",
      stock: Number(r.stock),
      price: computeUnitPriceFor(r, r.type), // NOTE: uses column name "price" in order_items
    }));

    for (const it of items) {
      if (it.quantity > it.stock) {
        return res.status(409).json({
          message: `Not enough stock for "${it.title}". Available: ${it.stock}.`,
        });
      }
    }

    // 3) Transaction: create order -> insert items -> decrement stock -> clear cart
    await q("START TRANSACTION");

    // Your `order` columns: user_id, status, extensions_used, order_date, original_date
    const orderRes = await q(
      `INSERT INTO \`order\` (user_id, status, extensions_used, order_date, original_date)
       VALUES (?, 'Pending', 0, NOW(), NULL)`,
      [user_id]
    );
    const order_id = orderRes.insertId;

    // Insert items: order_items(order_id, book_id, quantity, type, price, due_date, returned_at)
    const RENT_DAYS = 14;
    await q(
      `INSERT INTO order_items
         (order_id, book_id, quantity, type, price, due_date, returned_at)
       VALUES
         ${items
           .map(
             () =>
               "(?, ?, ?, ?, ?, " +
               // rent -> DATE_ADD(...), buy -> NULL
               "IF(? = 'rent', DATE_ADD(CURDATE(), INTERVAL ? DAY), NULL), " +
               "NULL)"
           )
           .join(", ")}`,
      items.flatMap((it) => [order_id, it.book_id, it.quantity, it.type, it.price, it.type, RENT_DAYS])
    );

    // Decrement stock
    for (const it of items) {
      const upd = await q(
        `UPDATE book SET count = count - ? WHERE book_id = ? AND count >= ?`,
        [it.quantity, it.book_id, it.quantity]
      );
      if (!upd.affectedRows) throw new Error(`Stock update failed for book_id=${it.book_id}`);
    }

    // Clear cart
    await q(`DELETE FROM shoppingcart WHERE user_id = ?`, [user_id]);

    await q("COMMIT");
    res.json({ message: "Order created successfully", order_id, status: "Pending" });
  } catch (err) {
    console.error("[/api/order/create]", err);
    try { await q("ROLLBACK"); } catch (e) { console.error("ROLLBACK failed", e); }

    // Helpful hint for schema mismatches
    const m = String(err.message || "").toLowerCase();
    if (m.includes("unknown column") || m.includes("column") || m.includes("field list")) {
      return res.status(500).json({
        message:
          "Order failed: column name mismatch (align to: order(user_id,status,extensions_used,order_date,original_date) and order_items(..., price, due_date, returned_at)).",
      });
    }
    res.status(500).json({ message: "Failed to create order." });
  }
});

module.exports = router;
