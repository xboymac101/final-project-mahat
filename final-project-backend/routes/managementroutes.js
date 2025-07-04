const express = require('express');
const router = express.Router();
const dbSingleton = require('../dbSingleton');
const db = dbSingleton.getConnection();
const {
  isAuthenticated,
  isAdmin,
  isAdminOrStaff
} = require('./authMiddleware'); 

// GET orders
router.get('/orders', isAuthenticated, isAdminOrStaff, async (req, res) => {
  const db = require('../dbSingleton').getConnection().promise();

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;
  const search = req.query.search || "";
  const status = req.query.status || "";

  const whereClauses = [];
  const params = [];

  if (search) {
    whereClauses.push(`(u.name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status) {
    whereClauses.push(`o.status = ?`);
    params.push(status);
  }

  const whereSQL = whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : "";

  try {
    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total
       FROM \`order\` o
       JOIN users u ON o.user_id = u.user_id
       JOIN order_items oi ON o.order_id = oi.order_id
       JOIN book b ON oi.book_id = b.book_id
       ${whereSQL}`,
      params
    );

    const totalPages = Math.ceil(countResult[0].total / limit);

    const [results] = await db.query(
      `SELECT 
         o.order_id,
         o.status,
         o.extensions_used,
         oi.due_date,
         u.name AS customer_name,
         u.email,
         u.phone_number,
         oi.type,
         oi.quantity,
         b.title AS book_title
       FROM \`order\` o
       JOIN users u ON o.user_id = u.user_id
       JOIN order_items oi ON o.order_id = oi.order_id
       JOIN book b ON oi.book_id = b.book_id
       ${whereSQL}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ orders: results, totalPages });
  } catch (err) {
    console.error("Admin/Staff orders fetch error:", err);
    res.status(500).json({ message: "Failed to fetch orders", error: err });
  }
});

// PUT update order 
router.put('/orders/:id', isAuthenticated, isAdminOrStaff, async (req, res) => {
  const db = require('../dbSingleton').getConnection().promise();
  const orderId = req.params.id;
  const { status, due_date } = req.body;

  try {
    const [[{ due_date: currentDue } = {}] = []] = await db.query(
      `SELECT due_date FROM order_items WHERE order_id = ? AND type = 'rent'`,
      [orderId]
    );

    const [[{ extensions_used } = {}] = []] = await db.query(
      `SELECT extensions_used FROM \`order\` WHERE order_id = ?`,
      [orderId]
    );

    if (!currentDue && extensions_used === undefined) {
      return res.status(404).json({ message: "Order not found." });
    }

    const oldDue = new Date(currentDue);
    const newDue = new Date(due_date);
    const now = new Date();

    const isExtension = newDue > oldDue;
    const isOverdue = oldDue < now;
    const exceedsMaxPeriod = (newDue - oldDue) / (1000 * 60 * 60 * 24) > 30;

    if (isExtension && isOverdue) {
      return res.status(400).json({ message: "Cannot extend: rental is already overdue." });
    }

    if (isExtension && extensions_used >= 2) {
      return res.status(400).json({ message: "Maximum of 2 extensions reached." });
    }

    if (isExtension && exceedsMaxPeriod) {
      return res.status(400).json({ message: "Cannot extend beyond 30 days from original date." });
    }

    await db.query(
      `UPDATE \`order\` SET status = ?, extensions_used = extensions_used + ? WHERE order_id = ?`,
      [status, isExtension ? 1 : 0, orderId]
    );

    if (isExtension) {
      await db.query(
        `UPDATE order_items SET due_date = ? WHERE order_id = ? AND type = 'rent'`,
        [due_date, orderId]
      );
    }

    res.json({ message: "Order updated successfully." });
  } catch (err) {
    console.error("Admin order update error:", err);
    res.status(500).json({ message: "Failed to update order", error: err });
  }
});

module.exports = router;
