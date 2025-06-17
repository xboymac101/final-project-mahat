const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const db = dbSingleton.getConnection();

router.post("/create", (req, res) => {
  const user_id = req.session.user_id;
  const { cart } = req.body;

  if (!user_id || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ message: "Invalid user or cart" });
  }

  const status = "pending";
  const rentItems = cart.filter(item => item.type === "rent");
  const due_date = rentItems.length > 0
    ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    : null;

  db.beginTransaction((err) => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ message: "Transaction error", error: err });
    }

    db.query(
      "INSERT INTO `order` (user_id, status) VALUES (?, ?)",
      [user_id, status, due_date],
      (err, result) => {
        if (err) {
          console.error("Insert order failed:", err);
          return db.rollback(() => res.status(500).json({ message: "Insert order failed", error: err }));
        }

        const orderId = result.insertId;

        const itemValues = cart.map(item => [
          orderId,
          item.book_id,
          item.amount,
          item.type,
          parseFloat(item.price),
          item.type === 'rent' 
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) 
            : null // only for rent
        ]);

        db.query(
          "INSERT INTO order_items (order_id, book_id, quantity, type, price, due_date) VALUES ?",
          [itemValues],
          (err2) => {
            if (err2) {
              console.error("Insert order_items failed:", err2);
              return db.rollback(() => res.status(500).json({ message: "Insert order items failed", error: err2 }));
            }

            db.query(
              "DELETE FROM shoppingcart WHERE user_id = ?",
              [user_id],
              (err3) => {
                if (err3) {
                  console.error("Cart cleanup failed:", err3);
                  return db.rollback(() => res.status(500).json({ message: "Cart cleanup failed", error: err3 }));
                }

                db.commit((err4) => {
                  if (err4) {
                    console.error("Commit failed:", err4);
                    return db.rollback(() => res.status(500).json({ message: "Commit failed", error: err4 }));
                  }

                  res.json({ message: "Order created successfully", orderId });
                });
              }
            );
          }
        );
      }
    );
  });
});

module.exports = router;
