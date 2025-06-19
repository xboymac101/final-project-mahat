const express = require('express');
const router = express.Router();
const dbSingleton = require('../dbSingleton');
const db = dbSingleton.getConnection();

// Middleware to block Admins and Staff
function blockNonRegularUsers(req, res, next) {
  const user_id = req.session.user_id;
  if (!user_id) return res.status(401).json({ message: 'Not logged in' });

  db.query('SELECT role FROM users WHERE user_id = ?', [user_id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (rows[0]?.role !== 'Regular') {
      return res.status(403).json({ message: 'Only regular users can perform this action.' });
    }
    next();
  });
}

// Add to cart
router.post('/add', blockNonRegularUsers, (req, res) => {
  const user_id = req.session.user_id;
  const { book_id, amount, type } = req.body;

  if (!book_id || !amount || amount < 1) return res.status(400).json({ message: 'Book and amount required.' });
  if (!type || !["buy", "rent"].includes(type)) return res.status(400).json({ message: 'Invalid type.' });

  // Step 1: Get current amount of this item
  db.query(
    'SELECT amount FROM shoppingcart WHERE user_id = ? AND book_id = ? AND type = ?',
    [user_id, book_id, type],
    (err, itemRows) => {
      if (err) return res.status(500).json({ message: 'Server error' });

      const currentAmount = itemRows.length > 0 ? itemRows[0].amount : 0;

      // Step 2: Get total rentals EXCLUDING this item's current amount
      db.query(
        'SELECT SUM(amount) AS total_rented FROM shoppingcart WHERE user_id = ? AND type = "rent"',
        [user_id],
        (err, sumRows) => {
          if (err) return res.status(500).json({ message: 'Server error' });

          const totalRented = (sumRows[0].total_rented || 0) - (type === "rent" ? currentAmount : 0);
          const newTotal = totalRented + (type === "rent" ? amount : 0);
          const MAX_RENTALS = 5;

          if (newTotal > MAX_RENTALS) {
            return res.status(400).json({
              message: `You can only rent up to ${MAX_RENTALS} books. You already have ${totalRented} in your cart.`
            });
          }

          // Step 3: Stock check
          db.query('SELECT count FROM book WHERE book_id = ?', [book_id], (err, bookRows) => {
            if (err) return res.status(500).json({ message: 'Server error' });
            if (!bookRows.length) return res.status(404).json({ message: 'Book not found' });

            const maxStock = bookRows[0].count;
            const newAmount = currentAmount + amount;

            db.query(
              'SELECT SUM(amount) AS totalAmount FROM shoppingcart WHERE user_id = ? AND book_id = ?',
              [user_id, book_id],
              (err, sumRows) => {
                if (err) return res.status(500).json({ message: 'Server error' });

                const otherTypeAmount = sumRows[0].totalAmount - currentAmount;
                if (newAmount + otherTypeAmount > maxStock) {
                  return res.status(400).json({ message: `Cannot add more than ${maxStock} in stock to cart.` });
                }

                if (itemRows.length > 0) {
                  db.query(
                    'UPDATE shoppingcart SET amount = ? WHERE user_id = ? AND book_id = ? AND type = ?',
                    [newAmount, user_id, book_id, type],
                    (err) => {
                      if (err) return res.status(500).json({ message: 'Server error' });
                      res.json({ message: 'Cart updated' });
                    }
                  );
                } else {
                  db.query(
                    'INSERT INTO shoppingcart (user_id, book_id, amount, type) VALUES (?, ?, ?, ?)',
                    [user_id, book_id, amount, type],
                    (err) => {
                      if (err) return res.status(500).json({ message: 'Server error' });
                      res.json({ message: 'Added to cart' });
                    }
                  );
                }
              }
            );
          });
        }
      );
    }
  );
});

// Get cart by user
router.get('/', (req, res) => {
  const user_id = req.session.user_id;
  console.log("Fetching cart for user:", user_id);
  if (!user_id) return res.status(401).json({ message: 'Not logged in' });

  const sql = `
   SELECT 
  sc.id, sc.book_id, sc.amount, b.title, b.img AS image, b.count, sc.type,
  ROUND(
    CASE 
      WHEN db.discount_percent IS NOT NULL THEN b.price * (1 - db.discount_percent / 100)
      WHEN dc.discount_percent IS NOT NULL THEN b.price * (1 - dc.discount_percent / 100)
      ELSE b.price
    END, 
    2
  ) AS price
FROM shoppingcart sc
JOIN book b ON sc.book_id = b.book_id
LEFT JOIN discounts db ON b.book_id = db.book_id
LEFT JOIN discounts dc ON b.category = dc.category
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
router.post('/remove', blockNonRegularUsers, (req, res) => {
  const user_id = req.session.user_id;
  const { book_id, type } = req.body;
  if (!book_id || !type) return res.status(400).json({ message: 'Book and type required.' });

  db.query(
    'DELETE FROM shoppingcart WHERE user_id = ? AND book_id = ? AND type = ?',
    [user_id, book_id, type],
    err => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json({ message: 'Removed from cart' });
    }
  );
});

// Decrease amount by 1, remove if zero
router.post('/decrease', blockNonRegularUsers, (req, res) => {
  const user_id = req.session.user_id;
  const { book_id, type } = req.body;
  if (!book_id || !type) return res.status(400).json({ message: 'Book and type required.' });

  db.query(
    'SELECT amount FROM shoppingcart WHERE user_id = ? AND book_id = ? AND type = ?',
    [user_id, book_id, type],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (!rows.length) return res.status(404).json({ message: 'Not in cart' });

      const newAmount = rows[0].amount - 1;
      if (newAmount <= 0) {
        db.query(
          'DELETE FROM shoppingcart WHERE user_id = ? AND book_id = ? AND type = ?',
          [user_id, book_id, type],
          err => {
            if (err) return res.status(500).json({ message: 'Server error' });
            res.json({ message: 'Removed from cart' });
          }
        );
      } else {
        db.query(
          'UPDATE shoppingcart SET amount = ? WHERE user_id = ? AND book_id = ? AND type = ?',
          [newAmount, user_id, book_id, type],
          err => {
            if (err) return res.status(500).json({ message: 'Server error' });
            res.json({ message: 'Quantity decreased' });
          }
        );
      }
    }
  );
});

router.post('/update', blockNonRegularUsers, (req, res) => {
  const user_id = req.session.user_id;
  const { book_id, amount, type } = req.body;
  if (!book_id || !amount || amount < 1) return res.status(400).json({ message: 'Book and valid amount required.' });

  db.query(
    'UPDATE shoppingcart SET amount = ? WHERE user_id = ? AND book_id = ? AND type = ?',
    [amount, user_id, book_id, type],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Not in cart' });
      res.json({ message: 'Quantity updated' });
    }
  );
});

module.exports = router;
