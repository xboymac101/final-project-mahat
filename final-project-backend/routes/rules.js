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

router.post('/', (req, res) => {
  const { rule_text } = req.body;
  const sql = 'INSERT INTO rules (rule_text) VALUES (?)';
  db.query(sql, [rule_text], (err) => {
    if (err) {
      console.error('Error adding rule:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Rule added' });
  });
});

router.delete('/:id', (req, res) => {
  const ruleId = req.params.id;
  const sql = 'DELETE FROM rules WHERE rule_id = ?';
  db.query(sql, [ruleId], (err) => {
    if (err) {
      console.error('Error deleting rule:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Rule deleted' });
  });
});
module.exports = router;