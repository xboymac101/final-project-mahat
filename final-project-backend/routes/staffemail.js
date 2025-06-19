const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const db = dbSingleton.getConnection();
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Get all contact messages
router.get("/emails", (req, res) => {
  db.query("SELECT * FROM contact_messages ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

// Reply to a contact message
router.post("/reply/:id", (req, res) => {
  const messageId = req.params.id;
  const { replyText, staffId } = req.body;

  const getMessageQuery = "SELECT * FROM contact_messages WHERE id = ?";
  db.query(getMessageQuery, [messageId], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: "Message not found" });

    const message = results[0];

    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: message.email,
      subject: "Re: Your message to BookHaven",
      text: replyText,
    }, (err, info) => {
      if (err) return res.status(500).json({ message: "Failed to send email" });

      const updateQuery = `
        UPDATE contact_messages
        SET reply = ?, replied_by = ?, replied_at = NOW(), is_replied = true
        WHERE id = ?
      `;

      db.query(updateQuery, [replyText, staffId, messageId], (err2) => {
        if (err2) return res.status(500).json({ message: "Failed to update message" });
        res.json({ message: "Reply sent and saved successfully" });
      });
    });
  });
});

module.exports = router;