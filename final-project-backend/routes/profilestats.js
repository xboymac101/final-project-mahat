const express = require('express');
const router = express.Router();
const dbSingleton = require('../dbSingleton');
const db = dbSingleton.getConnection();
const { isAuthenticated } = require('./authMiddleware');

const SUCCESS_STATUSES = ['Completed', 'Paid'];

router.get('/', isAuthenticated, (req, res) => {
  const role =
    req.user?.role ??
    req.session?.role ??
    req.session?.user?.role ??
    null;

  const userId =
    req.user?.user_id ??
    req.user?.id ??
    req.session?.user_id ??
    req.session?.user?.user_id ??
    req.session?.user?.id ??
    null;

  const isRegular = role === 'Regular';

  // --- SQLs ---
  // Popular books (buy+rent) — always fetched
  const popularBooksSQL = `
    SELECT b.book_id, b.title, b.author, b.img AS image_url,
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

  // Popular categories (buy only) — always fetched
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

  // Favorites (only if Regular + we have userId)
  const topBookSQL = `
    SELECT t.book_id, b.title, b.author, b.img AS image_url, t.qty
    FROM (
      SELECT oi.book_id, SUM(COALESCE(oi.quantity, 1)) AS qty
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

  const topCatSQL = `
    SELECT t.category_name, t.qty
    FROM (
      SELECT b.category AS category_name, SUM(COALESCE(oi.quantity, 1)) AS qty
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

  // Always fetch popular first
  db.query(popularBooksSQL, popularBooksParams, (e3, popBookRows) => {
    if (e3) {
      console.error('popularBooksSQL error:', e3);
      return res.status(500).json({ message: 'Server error' });
    }

    db.query(popularCatsSQL, popularCatsParams, (e4, popCatRows) => {
      if (e4) {
        console.error('popularCatsSQL error:', e4);
        return res.status(500).json({ message: 'Server error' });
      }

      const popularBooks = (popBookRows || []).map(r => ({
        book_id: r.book_id,
        title: r.title,
        author: r.author,
        image_url: r.image_url,           
        total_orders: Number(r.qty) || 0
      }));

      const popularCategories = (popCatRows || []).map(r => ({
        name: r.name,
        total_bought: Number(r.qty) || 0
      }));

      // If not eligible for favorites, return popular only
      if (!isRegular || !userId) {
        return res.json({
          favoriteBook: null,
          favoriteCategory: null,
          popularBooks,
          popularCategories
        });
      }

      // Regular user → also fetch favorites
      db.query(topBookSQL, topBookParams, (e1, bookRows) => {
        if (e1) {
          console.error('topBookSQL error:', e1);
          return res.status(500).json({ message: 'Server error' });
        }

        db.query(topCatSQL, topCatParams, (e2, catRows) => {
          if (e2) {
            console.error('topCatSQL error:', e2);
            return res.status(500).json({ message: 'Server error' });
          }

          const favoriteBook = bookRows?.[0]
            ? {
                book_id: bookRows[0].book_id,
                title: bookRows[0].title,
                author: bookRows[0].author,
                image_url: bookRows[0].image_url,
                total_orders: Number(bookRows[0].qty) || 0
              }
            : null;

          const favoriteCategory = catRows?.[0]
            ? {
                name: catRows[0].category_name,
                total_bought: Number(catRows[0].qty) || 0
              }
            : null;

          res.json({ favoriteBook, favoriteCategory, popularBooks, popularCategories });
        });
      });
    });
  });
});

module.exports = router;
