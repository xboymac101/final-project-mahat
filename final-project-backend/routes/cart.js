// routes/cart.js
const express = require('express');
const router = express.Router();
const dbSingleton = require('../dbSingleton');
const db = dbSingleton.getConnection();

const TAX_RATE = 0.18; // 18% VAT
const MAX_RENTALS = 5; // matches your rule "A maximum of 5 books may be borrowed at one time"

function r2(x) { return Math.round((Number(x) + Number.EPSILON) * 100) / 100; }

// ---------------------------------------------------------------------
// Middleware: only Regular users can modify cart
// ---------------------------------------------------------------------
function blockNonRegularUsers(req, res, next) {
  const user_id = req.session.user_id;
  if (!user_id) return res.status(401).json({ message: 'Not logged in' });

  db.query('SELECT role FROM users WHERE user_id = ?', [user_id], (err, rows) => {
    if (err) { console.error('[auth role check]', err); return res.status(500).json({ message: 'Server error' }); }
    if (rows[0]?.role !== 'Regular') {
      return res.status(403).json({ message: 'Only regular users can perform this action.' });
    }
    next();
  });
}

// ---------------------------------------------------------------------
// POST /api/cart/add
// Rental rules (DB-aware):
//  - Active rental = order.status = 'Pending' AND (returned_at IS NULL OR due_date >= CURDATE())
//  - Block renting the SAME book if active rental exists
//  - Cap total active rentals across all orders to MAX_RENTALS
//  - Then stock-check + upsert in shoppingcart
// ---------------------------------------------------------------------
router.post('/add', blockNonRegularUsers, (req, res) => {
  const user_id = req.session.user_id;
  const { book_id, amount, type } = req.body;

  if (!book_id || !amount || amount < 1) {
    return res.status(400).json({ message: 'Book and amount required.' });
  }
  if (!type || !['buy', 'rent'].includes(type)) {
    return res.status(400).json({ message: 'Invalid type.' });
  }

  // If BUY → skip rental checks
  if (type !== 'rent') return proceedToCartUpsert();

  // Build the active predicate using your real columns (order.status, order_items.due_date / returned_at)
  const activePredicate = `
    o.status = 'Pending'
    AND (
      oi.returned_at IS NULL
      OR oi.due_date >= CURDATE()
    )
  `;

  // A) Block renting the SAME BOOK while active
  const dupSql = `
    SELECT COUNT(*) AS active
    FROM order_items oi
    JOIN \`order\` o ON o.order_id = oi.order_id
    WHERE o.user_id = ?
      AND oi.book_id = ?
      AND oi.type = 'rent'
      AND ${activePredicate}
  `;

  db.query(dupSql, [user_id, book_id], (e1, dupRows) => {
    if (e1) { console.error('[dupSql]', e1); return res.status(500).json({ message: 'Database error while checking active rentals.' }); }

    if (Number(dupRows?.[0]?.active || 0) > 0) {
      return res.status(409).json({
        code: 'RENT_LIMIT_SAME_BOOK',
        message: 'You are already renting this book. Return/finish it before renting again.'
      });
    }

    // B) Cap total active rentals across ORDERS (sum quantities)
    const capSql = `
      SELECT COALESCE(SUM(oi.quantity), 0) AS active_rentals
      FROM order_items oi
      JOIN \`order\` o ON o.order_id = oi.order_id
      WHERE o.user_id = ?
        AND oi.type = 'rent'
        AND ${activePredicate}
    `;

    db.query(capSql, [user_id], (e2, capRows) => {
      if (e2) { console.error('[capSql]', e2); return res.status(500).json({ message: 'Database error while checking rental cap.' }); }

      const activeRentals = Number(capRows?.[0]?.active_rentals || 0);
      if (activeRentals + Number(amount) > MAX_RENTALS) {
        return res.status(409).json({
          code: 'RENT_LIMIT_TOTAL',
          message: `You can only rent up to ${MAX_RENTALS} books. You currently have ${activeRentals} active rentals.`
        });
      }

      // Passed both rental checks → continue
      proceedToCartUpsert();
    });
  });

  // --- Upsert into shoppingcart with stock checks (works for buy+rent) ---
  function proceedToCartUpsert() {
    // 1) current line amount (user+book+type)
    db.query(
      'SELECT amount FROM shoppingcart WHERE user_id = ? AND book_id = ? AND type = ?',
      [user_id, book_id, type],
      (err, itemRows) => {
        if (err) { console.error('[cart upsert: select item]', err); return res.status(500).json({ message: 'Database error in cart upsert.' }); }

        const currentAmount = itemRows.length > 0 ? Number(itemRows[0].amount) : 0;

        // 2) UX guard: limit rentals IN CART (orders are checked above)
        db.query(
          'SELECT COALESCE(SUM(amount),0) AS total_rented FROM shoppingcart WHERE user_id = ? AND type = "rent"',
          [user_id],
          (err2, sumRows) => {
            if (err2) { console.error('[cart upsert: sum rented]', err2); return res.status(500).json({ message: 'Database error in cart upsert.' }); }

            const totalRented = (Number(sumRows[0].total_rented || 0)) - (type === 'rent' ? currentAmount : 0);
            const newTotal = totalRented + (type === 'rent' ? Number(amount) : 0);

            if (type === 'rent' && newTotal > MAX_RENTALS) {
              return res.status(409).json({
                code: 'RENT_LIMIT_TOTAL_CART',
                message: `You can only rent up to ${MAX_RENTALS} books. You already have ${totalRented} rentals in your cart.`
              });
            }

            // 3) stock check across buy+rent
            db.query('SELECT count FROM book WHERE book_id = ?', [book_id], (err3, bookRows) => {
              if (err3) { console.error('[cart upsert: select book]', err3); return res.status(500).json({ message: 'Database error in cart upsert.' }); }
              if (!bookRows.length) return res.status(404).json({ message: 'Book not found' });

              const maxStock = Number(bookRows[0].count);
              const newAmountForThisType = currentAmount + Number(amount);

              db.query(
                'SELECT COALESCE(SUM(amount),0) AS totalAmount FROM shoppingcart WHERE user_id = ? AND book_id = ?',
                [user_id, book_id],
                (err4, sumRows2) => {
                  if (err4) { console.error('[cart upsert: sum for book]', err4); return res.status(500).json({ message: 'Database error in cart upsert.' }); }

                  const totalForBookAllTypes = Number(sumRows2[0].totalAmount || 0) - currentAmount;
                  if (newAmountForThisType + totalForBookAllTypes > maxStock) {
                    return res.status(409).json({ message: `Cannot add more than ${maxStock} in stock to cart.` });
                  }

                  if (itemRows.length > 0) {
                    db.query(
                      'UPDATE shoppingcart SET amount = ? WHERE user_id = ? AND book_id = ? AND type = ?',
                      [newAmountForThisType, user_id, book_id, type],
                      (err5) => {
                        if (err5) { console.error('[cart upsert: update]', err5); return res.status(500).json({ message: 'Database error in cart upsert.' }); }
                        return res.json({ message: 'Cart updated' });
                      }
                    );
                  } else {
                    db.query(
                      'INSERT INTO shoppingcart (user_id, book_id, amount, type) VALUES (?, ?, ?, ?)',
                      [user_id, book_id, amount, type],
                      (err6) => {
                        if (err6) { console.error('[cart upsert: insert]', err6); return res.status(500).json({ message: 'Database error in cart upsert.' }); }
                        return res.json({ message: 'Added to cart' });
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
  }
});

// ---------------------------------------------------------------------
// GET /api/cart  — items + subtotal + tax + total (rent = price/2)
// Discounts: prefer book-specific discount over category discount
// ---------------------------------------------------------------------
router.get('/', (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) return res.status(401).json({ message: 'Not logged in' });

  const sql = `
    SELECT 
      sc.id,
      sc.book_id,
      sc.amount,
      sc.type,                          -- 'buy' | 'rent'
      b.title,
      b.img AS image,
      b.count,
      -- Base price after discount (book discount has priority over category)
      (
        CASE 
          WHEN db.discount_percent IS NOT NULL THEN b.price * (1 - db.discount_percent / 100)
          WHEN dc.discount_percent IS NOT NULL THEN b.price * (1 - dc.discount_percent / 100)
          ELSE b.price
        END
      ) AS base_discounted_price,
      -- Final unit price: rent => half, buy => same
      ROUND(
        CASE 
          WHEN sc.type = 'rent' THEN 
            (
              CASE 
                WHEN db.discount_percent IS NOT NULL THEN b.price * (1 - db.discount_percent / 100)
                WHEN dc.discount_percent IS NOT NULL THEN b.price * (1 - dc.discount_percent / 100)
                ELSE b.price
              END
            ) / 2
          ELSE
            (
              CASE 
                WHEN db.discount_percent IS NOT NULL THEN b.price * (1 - db.discount_percent / 100)
                WHEN dc.discount_percent IS NOT NULL THEN b.price * (1 - dc.discount_percent / 100)
                ELSE b.price
              END
            )
        END
      ,2) AS unit_price
    FROM shoppingcart sc
    JOIN book b ON sc.book_id = b.book_id
    LEFT JOIN discounts db ON b.book_id = db.book_id
    LEFT JOIN discounts dc ON b.category = dc.category
    WHERE sc.user_id = ?
    ORDER BY sc.type, b.title
  `;

  db.query(sql, [user_id], (err, rows) => {
    if (err) { console.error('[cart get]', err); return res.status(500).json({ message: 'Server error' }); }

    const items = rows.map(r => {
      const line_total = r2(Number(r.unit_price) * Number(r.amount));
      return {
        id: r.id,
        book_id: r.book_id,
        title: r.title,
        image: r.image,
        count: r.count,
        type: r.type,
        amount: Number(r.amount),
        unit_price: Number(r.unit_price),
        line_total
      };
    });

    const subtotal = r2(items.reduce((s, it) => s + it.line_total, 0));
    const tax = r2(subtotal * TAX_RATE);
    const total = r2(subtotal + tax);

    res.json({ items, subtotal, tax_rate: TAX_RATE, tax, total });
  });
});

// ---------------------------------------------------------------------
// POST /api/cart/remove  — remove a specific line
// ---------------------------------------------------------------------
router.post('/remove', blockNonRegularUsers, (req, res) => {
  const user_id = req.session.user_id;
  const { book_id, type } = req.body;

  if (!book_id || !type) return res.status(400).json({ message: 'Book and type required.' });

  db.query(
    'DELETE FROM shoppingcart WHERE user_id = ? AND book_id = ? AND type = ?',
    [user_id, book_id, type],
    (err) => {
      if (err) { console.error('[cart remove]', err); return res.status(500).json({ message: 'Server error' }); }
      res.json({ message: 'Removed from cart' });
    }
  );
});

// ---------------------------------------------------------------------
// POST /api/cart/decrease  — decrease qty by 1 (delete if zero)
// ---------------------------------------------------------------------
router.post('/decrease', blockNonRegularUsers, (req, res) => {
  const user_id = req.session.user_id;
  const { book_id, type } = req.body;

  if (!book_id || !type) return res.status(400).json({ message: 'Book and type required.' });

  db.query(
    'SELECT amount FROM shoppingcart WHERE user_id = ? AND book_id = ? AND type = ?',
    [user_id, book_id, type],
    (err, rows) => {
      if (err) { console.error('[cart decrease: select]', err); return res.status(500).json({ message: 'Server error' }); }
      if (!rows.length) return res.status(404).json({ message: 'Not in cart' });

      const newAmount = Number(rows[0].amount) - 1;

      if (newAmount <= 0) {
        db.query(
          'DELETE FROM shoppingcart WHERE user_id = ? AND book_id = ? AND type = ?',
          [user_id, book_id, type],
          (err2) => {
            if (err2) { console.error('[cart decrease: delete]', err2); return res.status(500).json({ message: 'Server error' }); }
            res.json({ message: 'Removed from cart' });
          }
        );
      } else {
        db.query(
          'UPDATE shoppingcart SET amount = ? WHERE user_id = ? AND book_id = ? AND type = ?',
          [newAmount, user_id, book_id, type],
          (err3) => {
            if (err3) { console.error('[cart decrease: update]', err3); return res.status(500).json({ message: 'Server error' }); }
            res.json({ message: 'Quantity decreased' });
          }
        );
      }
    }
  );
});

// ---------------------------------------------------------------------
// POST /api/cart/update  — set qty directly
// ---------------------------------------------------------------------
router.post('/update', blockNonRegularUsers, (req, res) => {
  const user_id = req.session.user_id;
  const { book_id, amount, type } = req.body;

  if (!book_id || !amount || amount < 1) {
    return res.status(400).json({ message: 'Book and valid amount required.' });
  }

  db.query(
    'UPDATE shoppingcart SET amount = ? WHERE user_id = ? AND book_id = ? AND type = ?',
    [Number(amount), user_id, book_id, type],
    (err, result) => {
      if (err) { console.error('[cart update]', err); return res.status(500).json({ message: 'Server error' }); }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Not in cart' });
      res.json({ message: 'Quantity updated' });
    }
  );
});

module.exports = router;
