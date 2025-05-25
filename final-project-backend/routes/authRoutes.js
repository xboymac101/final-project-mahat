const express = require("express");
const db = require("../config"); // Your DB connection
const router = express.Router();

// --- Register ---
router.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const query = "INSERT INTO users (username, password) VALUES (?, ?)";
  db.query(query, [username, password], (err, result) => {
    if (err) {
      console.error("❌ Error during registration:", err);
      return res.status(500).json({ error: "Registration failed." });
    }
    return res.status(201).json({ message: "User registered successfully!" });
  });
});

// --- Login ---
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const query = "SELECT * FROM users WHERE username = ? AND password = ?";
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error("❌ Error during login:", err);
      return res.status(500).json({ error: "Login failed." });
    }

    if (results.length > 0) {
      return res.status(200).json({
        message: "Login successful!",
        user: {
          id: results[0].user_id,
          username: results[0].username
        }
      });
    } else {
      return res.status(401).json({ error: "Invalid username or password." });
    }
  });
});

module.exports = router;
