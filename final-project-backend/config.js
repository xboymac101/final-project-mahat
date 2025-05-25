const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",         // Change if you're not using root
  password: "",         // Leave empty if no password is set
  database: "bookhaven" // Your database name
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
    return;
  }
  console.log("✅ Connected to MySQL database.");
});

module.exports = db;
