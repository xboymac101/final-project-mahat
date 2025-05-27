const express = require("express");
const app = express();
const cors = require("cors");
const authRoutes = require("./routes/auth");
const port = 8801;
const booksRoutes = require("./routes/books");
app.use(cors());

app.use(express.json());

// app.use(session({
//   secret: 'your_secret_key',
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: false } // For HTTPS use true
// }));
app.use('/api/books', booksRoutes);
app.use("/api/auth", authRoutes);
app.use((err, req, res, next) => {
  console.error(err); // Log error
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
