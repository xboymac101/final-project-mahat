const express = require('express');
const router = express.Router();
const db = require('../dbSingleton').getConnection();

router.get('/stats', async (req, res) => {
  try {
    const stats = {};
    const range = parseInt(req.query.range) || 30;

    // Total Orders (within range)
    const [totalOrders] = await db.promise().query(`
      SELECT COUNT(*) AS count FROM \`order\`
      WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [range]);
    stats.totalOrders = totalOrders[0].count;

    // Completed Orders (within range)
    const [completedOrders] = await db.promise().query(`
      SELECT COUNT(*) AS count FROM \`order\`
      WHERE status = 'Completed' AND order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [range]);
    stats.completedOrders = completedOrders[0].count;

    // Canceled Orders (within range)
    const [canceledOrders] = await db.promise().query(`
      SELECT COUNT(*) AS count FROM \`order\`
      WHERE status = 'Canceled' AND order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [range]);
    stats.canceledOrders = canceledOrders[0].count;

    // Total Revenue (within range)
    const [revenue] = await db.promise().query(`
      SELECT SUM(price * quantity) AS total FROM order_items oi
      JOIN \`order\` o ON o.order_id = oi.order_id
      WHERE o.status = 'Completed' AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [range]);
    stats.revenue = revenue[0].total || 0;

    // Top Book (within range)
    const [topBook] = await db.promise().query(`
      SELECT b.title, SUM(oi.quantity) AS total_sold
      FROM order_items oi
      JOIN book b ON b.book_id = oi.book_id
      JOIN \`order\` o ON o.order_id = oi.order_id
      WHERE o.order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY b.book_id
      ORDER BY total_sold DESC
      LIMIT 1
    `, [range]);
    stats.topBook = topBook[0] || null;

    // Top Customer (within range)
    const [topCustomer] = await db.promise().query(`
      SELECT u.name, COUNT(*) AS total_orders
      FROM \`order\` o
      JOIN users u ON o.user_id = u.user_id
      WHERE o.order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY o.user_id
      ORDER BY total_orders DESC
      LIMIT 1
    `, [range]);
    stats.topCustomer = topCustomer[0] || null;

    res.json(stats);
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

//For Testing the Dates(7,30,90 days)
router.post('/fake-dates', async (req, res) => {
  const db = require('../dbSingleton').getConnection().promise();
  await db.query(`
    UPDATE \`order\`
    SET order_date = DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 30) DAY)
  `);
  res.json({ message: "Fake dates set!" });
});

module.exports = router;
