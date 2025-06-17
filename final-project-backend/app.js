const express = require("express");
const app = express();
const cors = require("cors");
const authRoutes = require("./routes/auth");
const port = 8801;
const cartRoutes = require('./routes/cart');
const session = require('express-session'); 
const booksRoutes = require("./routes/books");
const adminRoutes = require('./routes/adminroutes');
const adminStatsRoutes = require('./routes/adminstats');
const createOrderRoute = require("./routes/createorder");
const orderHistoryRoutes = require("./routes/orderhistory");
const RulesRoutes = require("./routes/rules")

app.use(cors({
  origin: 'http://localhost:3000',  
  credentials: true                 
}));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, 
    httpOnly: true
  }
}));

app.use(express.json());


app.use('/api/books', booksRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminStatsRoutes);
app.use("/api/order", createOrderRoute);
app.use("/api/order", orderHistoryRoutes);
app.use('/api/rules', RulesRoutes);



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
