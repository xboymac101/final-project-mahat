const express = require("express");
const db = require("../config"); // Connects to your MySQL config
const router = express.Router();

// --- Register ---
router.post("/register", (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  // SQL query to insert a new user
  const query = "INSERT INTO users (username, password) VALUES (?, ?)";
  db.query(query, [username, password], (err, result) => {
    if (err) {
      console.error("❌ Registration error:", err);
      return res.status(500).json({ error: "Database error during registration." });
    }

    return res.status(201).json({ message: "User registered successfully!" });
  });
});

// --- Login ---
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  // SQL query to check credentials
  const query = "SELECT * FROM users WHERE username = ? AND password = ?";
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error("❌ Login error:", err);
      return res.status(500).json({ error: "Database error during login." });
    }

    if (results.length > 0) {
      return res.status(200).json({ message: "Login successful!" });
    } else {
      return res.status(401).json({ error: "Invalid username or password." });
    }
  });
});

module.exports = router;
