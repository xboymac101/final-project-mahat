const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('./adminauth');
const dbSingleton = require('../dbSingleton');
const db = dbSingleton.getConnection();

router.get('/orders', isAuthenticated, isAdmin, (req, res) => {
  const db = require('../dbSingleton').getConnection();

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;
  const search = req.query.search || "";
  const status = req.query.status || "";

  // WHERE clause
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

  const dataQuery = `
    SELECT 
      o.order_id, o.status, o.due_date, o.type,
      u.name AS customer_name, u.email, u.phone_number,
      b.title AS book_title
    FROM \`order\` o
    JOIN users u ON o.user_id = u.user_id
    JOIN book b ON o.book_id = b.book_id
    ${whereSQL}
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM \`order\` o
    JOIN users u ON o.user_id = u.user_id
    ${whereSQL}
  `;

  db.query(countQuery, params, (countErr, countResult) => {
    if (countErr) return res.status(500).json({ message: "Failed to count orders" });

    const totalPages = Math.ceil(countResult[0].total / limit);

    db.query(dataQuery, [...params, limit, offset], (err, results) => {
      if (err) return res.status(500).json({ message: "Failed to fetch orders" });

      res.json({ orders: results, totalPages });
    });
  });
});



router.put('/orders/:id', isAuthenticated, isAdmin, (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  const query = `
    UPDATE \`order\` SET status = ? WHERE order_id = ?
  `;
  db.query(query, [status, orderId], (err) => {
    if (err) {
      console.error("Update error:", err);
      return res.status(500).json({ message: "Failed to update order" });
    }
    res.json({ message: "Order updated" });
  });
});

module.exports = router;
