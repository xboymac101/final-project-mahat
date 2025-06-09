const express = require("express");
const app = express();
const cors = require("cors");
const authRoutes = require("./routes/auth");
const port = 8801;
const cartRoutes = require('./routes/cart');
const session = require('express-session'); 
const booksRoutes = require("./routes/books");

app.use(cors());
app.use(express.json());

app.use('/api/books', booksRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/cart', cartRoutes);

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set true only for HTTPS!
}));

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
