const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",           // Your MySQL host
  user: "root",                // Your MySQL username
  password: "your_password",   // Replace this with your MySQL password
  database: "book_rental"      // Replace with your database name
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

module.exports = db;
