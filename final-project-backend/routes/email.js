const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const dbSingleton = require("../dbSingleton");
const db = dbSingleton.getConnection();
require("dotenv").config();

// Setup transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter config
transporter.verify((error, success) => {
  if (error) {
    console.log("Transporter error:", error);
  } else {
    console.log("✅ Server is ready to send emails");
  }
});

// Route: POST /api/email/contact
router.post("/contact", async (req, res) => {
  const { firstName, lastName, email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ message: "Email and message required." });
  }

  try {
    const info = await transporter.sendMail({
      from: `"${firstName} ${lastName}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: "📩 New Contact Message from BookHaven",
      text: `${message}\n\nFrom: ${firstName} ${lastName} (${email})`,
      html: `
        <p><strong>From:</strong> ${firstName} ${lastName} (${email})</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });


    // ✅ Save to contact_messages table
    const sql = `
      INSERT INTO contact_messages (first_name, last_name, email, message)
      VALUES (?, ?, ?, ?)
    `;
    db.query(sql, [firstName, lastName, email, message], (err) => {
      if (err) {
        console.error("❌ Failed to save message to DB:", err);
      } else {
        console.log("✅ Message saved to database.");
      }
    });

    res.status(200).json({ message: "Message sent successfully." });
  } catch (err) {
    console.error("❌ Email error:", err);
    res.status(500).json({ message: "Failed to send message." });
  }
});

module.exports = router;
