const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const db = dbSingleton.getConnection();

router.get("/history", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) return res.status(401).json({ message: "Not logged in" });

  db.query(
    `SELECT o.order_id, o.status, oi.item_id, oi.book_id, b.title, oi.quantity, oi.price, oi.type
     FROM \`order\` o
     JOIN order_items oi ON o.order_id = oi.order_id
     JOIN book b ON oi.book_id = b.book_id
     WHERE o.user_id = ?
     ORDER BY o.order_id DESC`,
    [user_id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err });

      const grouped = {};
      for (const row of rows) {
        if (!grouped[row.order_id]) {
          grouped[row.order_id] = { order_id: row.order_id, status: row.status, items: [] };
        }
        grouped[row.order_id].items.push(row);
      }

      res.json(Object.values(grouped));
    }
  );
});

module.exports = router;
