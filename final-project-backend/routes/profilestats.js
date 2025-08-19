// routes/profilestats.js
const express = require('express');
const router = express.Router();
const dbSingleton = require('../dbSingleton');
const db = dbSingleton.getConnection();
const { isAuthenticated } = require('./authMiddleware');

// Adjust if your success statuses differ
const SUCCESS_STATUSES = ['Completed', 'Paid'];

router.get('/', isAuthenticated, (req, res) => {
  const userId = req.session.user_id;

  // Favorite Book (buy+rent)
  const topBookSQL = `
    SELECT t.book_id, b.title, b.author, b.img, t.qty
    FROM (
      SELECT oi.book_id,
             SUM(COALESCE(oi.quantity, 1)) AS qty
      FROM \`order_items\` oi
      JOIN \`order\` o ON o.order_id = oi.order_id
      WHERE o.user_id = ?
        AND o.status IN (${SUCCESS_STATUSES.map(() => '?').join(',')})
        AND oi.type IN ('buy','rent')
      GROUP BY oi.book_id
      ORDER BY qty DESC
      LIMIT 1
    ) AS t
    JOIN book b ON b.book_id = t.book_id
  `;
  const topBookParams = [userId, ...SUCCESS_STATUSES];

  // Favorite Category (buy only)
  const topCatSQL = `
    SELECT t.category_name, t.qty
    FROM (
      SELECT b.category AS category_name,
             SUM(COALESCE(oi.quantity, 1)) AS qty
      FROM \`order_items\` oi
      JOIN \`order\` o ON o.order_id = oi.order_id
      JOIN book b ON b.book_id = oi.book_id
      WHERE o.user_id = ?
        AND o.status IN (${SUCCESS_STATUSES.map(() => '?').join(',')})
        AND oi.type = 'buy'
        AND b.category IS NOT NULL AND b.category <> ''
      GROUP BY b.category
      ORDER BY qty DESC
      LIMIT 1
    ) AS t
  `;
  const topCatParams = [userId, ...SUCCESS_STATUSES];

  // Sitewide popular books (buy+rent)
  const popularBooksSQL = `
    SELECT b.book_id, b.title, b.author, b.img,
           SUM(COALESCE(oi.quantity, 1)) AS qty
    FROM \`order_items\` oi
    JOIN \`order\` o ON o.order_id = oi.order_id
    JOIN book b ON b.book_id = oi.book_id
    WHERE o.status IN (${SUCCESS_STATUSES.map(() => '?').join(',')})
      AND oi.type IN ('buy','rent')
    GROUP BY b.book_id
    ORDER BY qty DESC
    LIMIT 8
  `;
  const popularBooksParams = [...SUCCESS_STATUSES];

  // Sitewide popular categories (buy only)
  const popularCatsSQL = `
    SELECT b.category AS name,
           SUM(COALESCE(oi.quantity, 1)) AS qty
    FROM \`order_items\` oi
    JOIN \`order\` o ON o.order_id = oi.order_id
    JOIN book b ON b.book_id = oi.book_id
    WHERE o.status IN (${SUCCESS_STATUSES.map(() => '?').join(',')})
      AND oi.type = 'buy'
      AND b.category IS NOT NULL AND b.category <> ''
    GROUP BY b.category
    ORDER BY qty DESC
    LIMIT 8
  `;
  const popularCatsParams = [...SUCCESS_STATUSES];

  db.query(topBookSQL, topBookParams, (e1, bookRows) => {
    if (e1) { console.error('topBookSQL error:', e1); return res.status(500).json({ message: 'Server error' }); }

    db.query(topCatSQL, topCatParams, (e2, catRows) => {
      if (e2) { console.error('topCatSQL error:', e2); return res.status(500).json({ message: 'Server error' }); }

      db.query(popularBooksSQL, popularBooksParams, (e3, popBookRows) => {
        if (e3) { console.error('popularBooksSQL error:', e3); return res.status(500).json({ message: 'Server error' }); }

        db.query(popularCatsSQL, popularCatsParams, (e4, popCatRows) => {
          if (e4) { console.error('popularCatsSQL error:', e4); return res.status(500).json({ message: 'Server error' }); }

          const favoriteBook = bookRows?.[0]
            ? {
                book_id: bookRows[0].book_id,
                title: bookRows[0].title,
                author: bookRows[0].author,
                image_url: bookRows[0].image_url,
                total_orders: bookRows[0].qty
              }
            : null;

          const favoriteCategory = catRows?.[0]
            ? {
                name: catRows[0].category_name,
                total_bought: catRows[0].qty
              }
            : null;

          const popularBooks = (popBookRows || []).map(r => ({
            book_id: r.book_id,
            title: r.title,
            author: r.author,
            image_url: r.image_url
          }));

          const popularCategories = (popCatRows || []).map(r => r.name);

          res.json({ favoriteBook, favoriteCategory, popularBooks, popularCategories });
        });
      });
    });
  });
});

module.exports = router;
