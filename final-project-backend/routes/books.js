const express = require('express');
const router = express.Router();
const dbSingleton = require('../dbSingleton');
const db = dbSingleton.getConnection();

// GET all books
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM book';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching books:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

module.exports = router;