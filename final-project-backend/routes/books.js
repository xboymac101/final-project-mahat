const express = require('express');
const router = express.Router();
const dbSingleton = require('../dbSingleton');
const db = dbSingleton.getConnection();
const { isAdminOrStaff } = require('./auth'); // Add this line

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

// GET single book by ID
router.get('/:id', (req, res) => {
  const bookId = req.params.id;
  const sql = 'SELECT * FROM book WHERE book_id = ?';
  db.query(sql, [bookId], (err, results) => {
    if (err) {
      console.error('Error fetching book:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(results[0]);
  });
});

// PUT update book (staff/admin only)
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

// GET reviews for a book
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

// POST add a review for a book
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

// GET related books (same category, exclude current book)
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
