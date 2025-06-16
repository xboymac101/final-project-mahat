const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('./adminauth');
const db = require('../dbSingleton').getConnection();

router.get('/stats', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [totalOrders] = await db.promise().query(
      `SELECT COUNT(*) AS count FROM \`order\``
    );

    const [completedOrders] = await db.promise().query(
      `SELECT COUNT(*) AS count FROM \`order\` WHERE status = 'Completed'`
    );

    const [canceledOrders] = await db.promise().query(
      `SELECT COUNT(*) AS count FROM \`order\` WHERE status = 'Canceled'`
    );

    const [revenue] = await db.promise().query(
      `SELECT SUM(total_price) AS total FROM \`order\` WHERE status = 'Completed'`
    );

    const [topBook] = await db.promise().query(
      `SELECT b.title, COUNT(*) AS count 
       FROM \`order\` o 
       JOIN order_items oi ON o.order_id = oi.order_id
       JOIN book b ON b.book_id = oi.book_id
       GROUP BY oi.book_id 
       ORDER BY count DESC LIMIT 1`
    );

    const [topCustomer] = await db.promise().query(
      `SELECT u.name, COUNT(*) AS orders 
       FROM \`order\` o 
       JOIN users u ON u.user_id = o.user_id
       GROUP BY o.user_id 
       ORDER BY orders DESC LIMIT 1`
    );

    res.json({
      totalOrders: totalOrders[0].count,
      completedOrders: completedOrders[0].count,
      canceledOrders: canceledOrders[0].count,
      revenue: revenue[0].total ?? 0,
      topBook: topBook[0] || null,
      topCustomer: topCustomer[0] || null,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

module.exports = router;
