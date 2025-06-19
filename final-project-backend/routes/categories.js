const express = require('express');
const router = express.Router();
const db = require('../dbSingleton').getConnection();

router.get('/', (req, res) => {
  const sql = 'SELECT DISTINCT category FROM book';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    const categories = results.map(row => row.category);
    res.json(categories);
  });
});

module.exports = router;