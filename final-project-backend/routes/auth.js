const express = require('express');
const router = express.Router();
const dbSingleton = require('../dbSingleton');
const db = dbSingleton.getConnection();
const bcrypt = require('bcrypt');
const {
  isAuthenticated,
  isAdmin,
  isStaff,
  isAdminOrStaff
} = require('./authMiddleware');

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*._-])[A-Za-z\d!@#$%^&*._-]{8,}$/;

// Sign-Up 
router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;

  // 1) Validate password pattern
  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long and include: 1 uppercase, 1 lowercase, 1 number, and 1 special character (!@#$%^&*._-)."
    });
  }

  // 2) Hash the password if valid
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Hashing error:', err);
      return res.status(500).json({ message: 'Encryption error' });
    }

    const query = `
      INSERT INTO users (name, email, password, registration_date, role)
      VALUES (?, ?, ?, CURDATE(), ?)
    `;
    db.query(query, [name, email, hashedPassword, role], (err) => {
      if (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
  });
});

// Login (3 tries per day)
router.post("/login", (req, res) => {
  const rawEmail = req.body.email || "";
  const email = rawEmail.toLowerCase().trim();
  const { password } = req.body;

  // 1) check attempts for today
  const getAttemptsQ = `
    SELECT attempts, locked_until
    FROM auth_login_attempts
    WHERE email = ? AND attempt_date = CURDATE()
    LIMIT 1
  `;

  db.query(getAttemptsQ, [email], (err, rows) => {
    if (err) {
      console.error("Login attempts read error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    const nowLock = rows[0]?.locked_until && new Date(rows[0].locked_until) > new Date();
    const attemptsSoFar = rows[0]?.attempts || 0;

    if (nowLock || attemptsSoFar >= 3) {
      // already locked for today
      return res.status(429).json({
        message:
          "Too many login attempts. Please try again after midnight (local time)."
      });
    }

    // 2) proceed to find user by email
    const userQ = `SELECT * FROM users WHERE email = ?`;
    db.query(userQ, [email], (err, results) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Server error" });
      }

      const user = results[0];

      // helper to record a failed attempt (and possibly lock until midnight)
      const recordFailure = () => {
        const newAttempts = attemptsSoFar + 1;
        const upsertQ = `
          INSERT INTO auth_login_attempts (email, attempt_date, attempts, locked_until, last_attempt_at)
          VALUES (?, CURDATE(), 1, NULL, NOW())
          ON DUPLICATE KEY UPDATE
            attempts = attempts + 1,
            last_attempt_at = NOW(),
            locked_until = CASE
              WHEN attempts + 1 >= 3 THEN DATE_ADD(CURDATE(), INTERVAL 1 DAY)
              ELSE NULL
            END
        `;
        db.query(upsertQ, [email], (err2) => {
          if (err2) console.error("Login attempts write error:", err2);
          // If after this failure we hit 3, tell the user they're locked
          if (newAttempts >= 3) {
            return res.status(429).json({
              message:
                "Too many login attempts. Please try again after midnight (local time)."
            });
          } else {
            return res.status(401).json({
              message: `Invalid email or password. (${3 - newAttempts} attempts left today)`
            });
          }
        });
      };

      if (!user) {
        // email not found counts as a failed attempt
        return recordFailure();
      }

      // 3) compare password
      bcrypt.compare(password, user.password, (err2, isMatch) => {
        if (err2) {
          console.error("Bcrypt compare error:", err2);
          return res.status(500).json({ message: "Encryption error" });
        }

        if (!isMatch) {
          return recordFailure();
        }

        // 4) success: clear today’s attempts for this email
        const clearQ = `DELETE FROM auth_login_attempts WHERE email = ? AND attempt_date = CURDATE()`;
        db.query(clearQ, [email], (clearErr) => {
          if (clearErr) console.error("Clear attempts error:", clearErr);
          // set session
          req.session.user_id = user.user_id;
          req.session.role = user.role;

          return res.status(200).json({
            message: "Login successful",
            user: {
              id: user.user_id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
          });
        });
      });
    });
  });
});


router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid"); // or your session cookie name
    res.json({ message: "Logged out successfully" });
  });
});

router.get('/me', (req, res) => {

  if (!req.session.user_id) {
    return res.status(401).json({ message: 'Not logged in' });
  }
  res.json({
    user_id: req.session.user_id,
    role: req.session.role
  });
});


// Get user profile info
router.get("/info", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) return res.status(401).json({ message: "Not logged in" });

  const query = "SELECT name, email, phone_number, address FROM users WHERE user_id = ?";
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

router.put('/update-profile', isAuthenticated, (req, res) => {
  const user_id = req.session.user_id;
  const { name, email, phone_number, address } = req.body;

  const sql = `UPDATE users SET name = ?, email = ?, phone_number = ?, address = ? WHERE user_id = ?`;
  db.query(sql, [name, email, phone_number, address, user_id], (err) => {
    if (err) return res.status(500).json({ message: 'Failed to update profile' });
    res.json({ message: 'Profile updated successfully' });
  });
});

module.exports = {
  router,
  isAuthenticated,
  isAdmin,
  isStaff,
  isAdminOrStaff
};