const express = require('express');
const router = express.Router();
const db = require('../db'); // Adjust path if needed

// Add to cart
router.post('/add', (req, res) => {
  const user_id = req.session.user_id;   // <-- Use session!
  const { book_id, amount } = req.body;

  if (!user_id) return res.status(401).json({ message: 'Not logged in' });

  const checkSql = 'SELECT * FROM shoppingcart WHERE user_id = ? AND book_id = ?';
  db.query(checkSql, [user_id, book_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    if (results.length > 0) {
      // Update amount
      const newAmount = results[0].amount + amount;
      db.query(
        'UPDATE shoppingcart SET amount = ? WHERE user_id = ? AND book_id = ?',
        [newAmount, user_id, book_id],
        (err) => {
          if (err) return res.status(500).json({ message: 'Server error' });
          res.json({ message: 'Cart updated' });
        }
      );
    } else {
      // Insert new
      db.query(
        'INSERT INTO shoppingcart (user_id, book_id, amount) VALUES (?, ?, ?)',
        [user_id, book_id, amount],
        (err) => {
          if (err) return res.status(500).json({ message: 'Server error' });
          res.json({ message: 'Added to cart' });
        }
      );
    }
  });
});


// Get cart by user
router.get('/', (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) return res.status(401).json({ message: 'Not logged in' });

  const sql = `
    SELECT sc.id, sc.book_id, sc.amount, b.title, b.price, b.image
    FROM shoppingcart sc
    JOIN books b ON sc.book_id = b.book_id
    WHERE sc.user_id = ?
  `;
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(results);
  });
});


module.exports = router;
