const express = require('express');
const router = express.Router();
const db = require('../dbSingleton').getConnection();
const { isAuthenticated, isAdmin } = require('./authMiddleware');

// GET all discounts
router.get('/', isAuthenticated, isAdmin, (req, res) => {
  db.query(`
    SELECT d.*, b.title 
    FROM discounts d 
    LEFT JOIN book b ON d.book_id = b.book_id
  `, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch discounts' });
    res.json(results);
  });
});

// ADD a discount
router.post('/', isAuthenticated, isAdmin, (req, res) => {
  const { book_id, category, discount_percent, end_date } = req.body;
  if (!discount_percent || (!book_id && !category))
    return res.status(400).json({ error: 'Invalid data' });

  const sql = `
    INSERT INTO discounts (book_id, category, discount_percent, end_date)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE discount_percent = VALUES(discount_percent), end_date = VALUES(end_date)
  `;
  db.query(sql, [book_id || null, category || null, discount_percent, end_date || null], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to save discount' });
    res.json({ message: 'Discount saved' });
  });
});

// Remove a discount
router.post('/remove', isAuthenticated, isAdmin, (req, res) => {
  const { type, target } = req.body;
  if (type === 'book') {
    db.query('DELETE FROM discounts WHERE book_id = ?', [target], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to remove discount' });
      res.json({ message: 'Discount removed for book' });
    });
  } else if (type === 'category') {
    db.query('DELETE FROM discounts WHERE category = ?', [target], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to remove discount' });
      res.json({ message: 'Discount removed for category' });
    });
  } else {
    res.status(400).json({ error: 'Invalid type' });
  }
});

module.exports = router;
