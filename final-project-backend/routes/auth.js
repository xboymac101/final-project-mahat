const express = require('express');
const router = express.Router();
const dbSingleton = require('../dbSingleton');
const db = dbSingleton.getConnection();


// רישום משתמש חדש
router.post('/register', (req, res) => {
  const { name, email, password ,role} = req.body;

  const query = `
    INSERT INTO users (name, email, password, registration_date,role)
    VALUES (?, ?, ?, CURDATE(),?)
  `;

  db.query(query, [name, email, password,role], (err, result) => {
    if (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    res.status(201).json({ message: 'User registered successfully' });
  });
})
// התחברות
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const query = `SELECT * FROM users WHERE email = ? AND password = ? `;

  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length > 0) {
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

module.exports = router;
