const express = require('express');
const router = express.Router();
const dbSingleton = require('../dbSingleton');
const db = dbSingleton.getConnection();

// Add to cart
router.post('/add', (req, res) => {
  const user_id = req.session.user_id;
  const { book_id, amount } = req.body;

  if (!user_id) return res.status(401).json({ message: 'Not logged in' });
  if (!book_id || !amount || amount < 1) return res.status(400).json({ message: 'Book and amount required.' });


  // 1. Check stock for this book
  db.query('SELECT count FROM book WHERE book_id = ?', [book_id], (err, bookRows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!bookRows.length) return res.status(404).json({ message: 'Book not found' });

    const maxStock = bookRows[0].count;

    // 2. Check how many are already in the cart
    db.query('SELECT amount FROM shoppingcart WHERE user_id = ? AND book_id = ?', [user_id, book_id], (err, cartRows) => {
      if (err) return res.status(500).json({ message: 'Server error' });

      const currentAmount = cartRows.length > 0 ? cartRows[0].amount : 0;
      const newAmount = currentAmount + amount;

      // 3. If new total exceeds stock, don't allow
      if (newAmount > maxStock) {
        return res.status(400).json({ message: `Cannot add more than ${maxStock} in stock to cart.` });
      }

      // 4. Update or insert as usual
      if (cartRows.length > 0) {
        db.query(
          'UPDATE shoppingcart SET amount = ? WHERE user_id = ? AND book_id = ?',
          [newAmount, user_id, book_id],
          (err) => {
            if (err) return res.status(500).json({ message: 'Server error' });
            res.json({ message: 'Cart updated' });
          }
        );
      } else {
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
});


// Get cart by user
router.get('/', (req, res) => {
  const user_id = req.session.user_id;
  console.log("Fetching cart for user:", user_id);
  if (!user_id) return res.status(401).json({ message: 'Not logged in' });

  const sql = `
    SELECT sc.id, sc.book_id, sc.amount, b.title, b.price, b.img AS image, b.count
    FROM shoppingcart sc
    JOIN book b ON sc.book_id = b.book_id
    WHERE sc.user_id = ?
  `;
  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("Cart SQL error:", err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.json(results);
  });
});


// Remove entire book from cart
router.post('/remove', (req, res) => {
  const user_id = req.session.user_id;
  const { book_id } = req.body;
  if (!user_id) return res.status(401).json({ message: 'Not logged in' });

  db.query(
    'DELETE FROM shoppingcart WHERE user_id = ? AND book_id = ?',
    [user_id, book_id],
    err => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json({ message: 'Removed from cart' });
    }
  );
});

// Decrease amount by 1, remove if zero
router.post('/decrease', (req, res) => {
  const user_id = req.session.user_id;
  const { book_id } = req.body;
  if (!user_id) return res.status(401).json({ message: 'Not logged in' });

  db.query(
    'SELECT amount FROM shoppingcart WHERE user_id = ? AND book_id = ?',
    [user_id, book_id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (!rows.length) return res.status(404).json({ message: 'Not in cart' });

      const newAmount = rows[0].amount - 1;
      if (newAmount <= 0) {
        db.query(
          'DELETE FROM shoppingcart WHERE user_id = ? AND book_id = ?',
          [user_id, book_id],
          err => {
            if (err) return res.status(500).json({ message: 'Server error' });
            res.json({ message: 'Removed from cart' });
          }
        );
      } else {
        db.query(
          'UPDATE shoppingcart SET amount = ? WHERE user_id = ? AND book_id = ?',
          [newAmount, user_id, book_id],
          err => {
            if (err) return res.status(500).json({ message: 'Server error' });
            res.json({ message: 'Quantity decreased' });
          }
        );
      }
    }
  );
});

router.post('/update', (req, res) => {
  const user_id = req.session.user_id;
  const { book_id, amount } = req.body;
  if (!user_id) return res.status(401).json({ message: 'Not logged in' });
  if (!book_id || !amount || amount < 1) return res.status(400).json({ message: 'Book and valid amount required.' });

  // Optionally: Check book stock here

  db.query(
    'UPDATE shoppingcart SET amount = ? WHERE user_id = ? AND book_id = ?',
    [amount, user_id, book_id],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Not in cart' });
      res.json({ message: 'Quantity updated' });
    }
  );
});


module.exports = router;
