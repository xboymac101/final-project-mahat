const express = require('express');
const router = express.Router();
const dbSingleton = require('../dbSingleton');
const db = dbSingleton.getConnection();
const { isAdminOrStaff } = require('./auth');

//  GET all books with discount-aware pricing
router.get('/', (req, res) => {
  const search = req.query.search;
  const isDiscounted = req.query.discounted === 'true';
  const params = [];

  let sql = `
    SELECT 
      b.*, 
      d.discount_percent,
      ROUND(
        CASE 
          WHEN d.discount_percent IS NOT NULL THEN b.price * (1 - d.discount_percent / 100)
          ELSE b.price 
        END, 2
      ) AS final_price
    FROM book b
    LEFT JOIN discounts d 
      ON b.book_id = d.book_id 
      OR b.category = d.category
  `;

  // Conditions for WHERE clause
  const conditions = [];

  if (isDiscounted) {
    conditions.push('d.discount_percent IS NOT NULL');
  }

  if (search) {
    conditions.push('(b.title LIKE ? OR b.author LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching books:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});


// ✅ GET single book by ID (already updated)
router.get('/:id', (req, res) => {
  const bookId = req.params.id;
  const sql = `
    SELECT 
  b.*, 
  COALESCE(db.discount_percent, dc.discount_percent) AS discount_percent,
  ROUND(
    CASE 
      WHEN db.discount_percent IS NOT NULL THEN b.price * (1 - db.discount_percent / 100)
      WHEN dc.discount_percent IS NOT NULL THEN b.price * (1 - dc.discount_percent / 100)
      ELSE b.price
    END, 
    2
  ) AS final_price
FROM book b
LEFT JOIN discounts db ON b.book_id = db.book_id
LEFT JOIN discounts dc ON b.category = dc.category
WHERE b.book_id = ?`;
  db.query(sql, [bookId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'Book not found' });
    res.json(results[0]);
  });
});

// ✅ PUT update book (staff/admin only)
router.put('/:id', isAdminOrStaff, (req, res) => {
  const bookId = req.params.id;
  const { title, author, price, count } = req.body;

  const sql = `
    UPDATE book SET title = ?, author = ?, price = ?, count = ?
    WHERE book_id = ?
  `;
  db.query(sql, [title, author, price, count, bookId], (err) => {
    if (err) {
      console.error('Error updating book:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Book updated successfully' });
  });
});

// ✅ GET reviews for a book
router.get('/:id/reviews', (req, res) => {
  const bookId = req.params.id;
  const sql = `
    SELECT f.*, u.name AS username
    FROM feedback f
    JOIN users u ON f.user_id = u.user_id
    WHERE f.book_id = ?
    ORDER BY f.date DESC
  `;
  db.query(sql, [bookId], (err, results) => {
    if (err) {
      console.error('Error fetching reviews:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// ✅ POST add a review
router.post('/:id/reviews', (req, res) => {
  const bookId = req.params.id;
  const { user_id, rating, comment } = req.body;
  const sql = `
    INSERT INTO feedback (user_id, book_id, rating, comment, date)
    VALUES (?, ?, ?, ?, CURDATE())
  `;
  db.query(sql, [user_id, bookId, rating, comment], (err) => {
    if (err) {
      console.error('Error adding review:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Review added successfully' });
  });
});

// ✅ GET related books (same category, exclude current book)
router.get('/:id/related', (req, res) => {
  const bookId = req.params.id;
  const getCategory = 'SELECT category FROM book WHERE book_id = ?';
  db.query(getCategory, [bookId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ error: 'Book not found or database error' });
    }
    const category = results[0].category;
    const sql = 'SELECT * FROM book WHERE category = ? AND book_id != ? LIMIT 6';
    db.query(sql, [category, bookId], (err2, relatedBooks) => {
      if (err2) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(relatedBooks);
    });
  });
});

module.exports = router;