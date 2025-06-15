const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('./adminauth');

router.get('/orders', isAuthenticated, isAdmin, (req, res) => {
  res.json({ message: 'Here are the orders' });
});

router.get('/stats', isAuthenticated, isAdmin, (req, res) => {
  res.json({
    totalOrders: 120,
    totalRevenue: 8450.75,
    totalUsers: 87,
    totalBooks: 203,
    topBooks: [
      { title: 'Atomic Habits', sales: 24 },
      { title: '1984', sales: 18 },
      { title: 'Sapiens', sales: 16 },
      { title: 'Harry Potter', sales: 14 },
      { title: 'The Hobbit', sales: 11 }
    ]
  });
});

module.exports = router;
