const express = require('express');
const router = express.Router();
const db = require('../dbSingleton').getConnection();

router.get('/random', (req, res) => {
  const sql = 'SELECT fact_text FROM facts ORDER BY RAND() LIMIT 1';
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error fetching fact:', err);
      return res.status(500).json({ error: 'Failed to fetch fact' });
    }
    res.json({ fact: result[0]?.fact_text || "Fun fact coming soon!" });
  });
});

module.exports = router;
