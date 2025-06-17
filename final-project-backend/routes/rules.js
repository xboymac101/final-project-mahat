const express = require('express');
const router = express.Router();
const db = require('../dbSingleton').getConnection();

router.get('/', (req, res) => {
  const sql = 'SELECT * FROM rules ORDER BY rule_id ASC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching rules:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

module.exports = router;