const express = require('express');
const router = express.Router();
const dbSingleton = require('../dbSingleton');
const db = dbSingleton.getConnection();
const bcrypt = require('bcrypt');

// רישום משתמש חדש
router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  // Hash the password first
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Hashing error:', err);
      return res.status(500).json({ message: 'Encryption error' });
    }
    const query = `
      INSERT INTO users (name, email, password, registration_date, role)
      VALUES (?, ?, ?, CURDATE(), ?)
    `;
    db.query(query, [name, email, hashedPassword, role], (err, result) => {
      if (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
  });
});
// התחברות
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const query = `SELECT * FROM users WHERE email = ?`;

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const hashedPassword = results[0].password;
    // Compare the provided password to the hashed password
    bcrypt.compare(password, hashedPassword, (err, isMatch) => {
      if (err) {
        console.error('Bcrypt compare error:', err);
        return res.status(500).json({ message: 'Encryption error' });
      }
      if (isMatch) {
        req.session.user_id = results[0].user_id;
        res.status(200).json({
          message: "Login successful",
          user: {
            id: results[0].user_id,
            name: results[0].name,
            email: results[0].email,
            role: results[0].role,
          },
        });
      } else {
        res.status(401).json({ message: "Invalid email or password" });
      }
    });
  });
});

router.get("/me", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).json({ message: "Not logged in" });
  }
  res.json({ user_id: req.session.user_id });
});

// Get user profile info (for the popup)
router.get("/info", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) return res.status(401).json({ message: "Not logged in" });

  const query = "SELECT phone_number, address FROM users WHERE user_id = ?";
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (!results.length) return res.status(404).json({ message: "User not found" });
    res.json(results[0]);
  });
});

// Update phone/address for user (called once from popup)
router.post("/complete-profile", (req, res) => {
  const userId = req.session.user_id;
  const { phone, address } = req.body;

  if (!userId) return res.status(401).json({ message: "Not logged in" });
  if (!phone || !address) return res.status(400).json({ message: "Missing phone or address" });

  const query = "UPDATE users SET phone_number = ?, address = ? WHERE user_id = ?";
  db.query(query, [phone, address, userId], (err) => {
    if (err) return res.status(500).json({ message: "Update failed" });
    res.json({ message: "Info updated successfully" });
  });
});
module.exports = router;
