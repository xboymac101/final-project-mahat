const express = require('express');
const router = express.Router();
const db = require('../dbSingleton').getConnection();

// Helpers
function isYmd(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function buildDateFilter(q) {
  const { fromDate, toDate } = q;
  const range = parseInt(q.range, 10) || 30;

  if (fromDate && toDate && isYmd(fromDate) && isYmd(toDate)) {
    // include full "to" day: [fromDate, toDate+1)
    return {
      whereSql:
        "o.order_date >= ? AND o.order_date < DATE_ADD(?, INTERVAL 1 DAY)",
      params: [fromDate, toDate],
    };
  }

  return {
    whereSql: "o.order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)",
    params: [range],
  };
}

// GET /api/admin/stats  
router.get('/stats', async (req, res) => {
  try {
    const stats = {};
    const conn = db.promise();
    const { whereSql, params } = buildDateFilter(req.query);

    // Total Orders
    const [totalOrders] = await conn.query(
      `SELECT COUNT(*) AS count
       FROM \`order\` o
       WHERE ${whereSql}`,
      params
    );
    stats.totalOrders = totalOrders[0]?.count || 0;

    // Completed Orders
    const [completedOrders] = await conn.query(
      `SELECT COUNT(*) AS count
       FROM \`order\` o
       WHERE o.status = 'Completed' AND ${whereSql}`,
      params
    );
    stats.completedOrders = completedOrders[0]?.count || 0;

    // Pending Orders  
    const [pendingOrders] = await conn.query(
      `SELECT COUNT(*) AS count
       FROM \`order\` o
       WHERE o.status = 'Pending' AND ${whereSql}`,
      params
    );
    stats.pendingOrders = pendingOrders[0]?.count || 0;

    // Canceled Orders
    const [canceledOrders] = await conn.query(
      `SELECT COUNT(*) AS count
       FROM \`order\` o
       WHERE o.status = 'Canceled' AND ${whereSql}`,
      params
    );
    stats.canceledOrders = canceledOrders[0]?.count || 0;

    // Total Revenue (uses oi.price)
    const [revenue] = await conn.query(
      `SELECT SUM(oi.price * oi.quantity) AS total
       FROM order_items oi
       JOIN \`order\` o ON o.order_id = oi.order_id
       WHERE o.status = 'Completed' AND ${whereSql}`,
      params
    );
    stats.revenue = Number(revenue[0]?.total) || 0;

    // Top Book (by quantity)
    const [topBook] = await conn.query(
      `SELECT b.title, SUM(oi.quantity) AS total_sold
       FROM order_items oi
       JOIN book b ON b.book_id = oi.book_id
       JOIN \`order\` o ON o.order_id = oi.order_id
       WHERE ${whereSql}
       GROUP BY b.book_id, b.title
       ORDER BY total_sold DESC
       LIMIT 1`,
      params
    );
    stats.topBook = topBook[0] || null;

    // Top Customer (by number of orders)
    const [topCustomer] = await conn.query(
      `SELECT u.name, COUNT(*) AS total_orders
       FROM \`order\` o
       JOIN users u ON o.user_id = u.user_id
       WHERE ${whereSql}
       GROUP BY o.user_id, u.name
       ORDER BY total_orders DESC
       LIMIT 1`,
      params
    );
    stats.topCustomer = topCustomer[0] || null;

// Out-of-stock books (inventory snapshot)
const [oos] = await conn.query(
  `SELECT COUNT(*) AS total
   FROM book
   WHERE COALESCE(\`count\`, 0) <= 0`
);
stats.outOfStockBooks = Number(oos[0]?.total) || 0;

    res.json(stats);
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

// Optional helper to randomize dates for testing
router.post('/fake-dates', async (req, res) => {
  const conn = require('../dbSingleton').getConnection().promise();
  await conn.query(`
    UPDATE \`order\`
    SET order_date = DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 30) DAY)
  `);
  res.json({ message: "Fake dates set!" });
});

module.exports = router;
