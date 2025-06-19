const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");

// Route Imports
const { router: authRoutes } = require("./routes/auth");
const cartRoutes = require("./routes/cart");
const booksRoutes = require("./routes/books");
const managementRoutes = require("./routes/managementroutes"); // staff + admin
const adminStatsRoutes = require("./routes/adminstats");
const createOrderRoute = require("./routes/createorder");
const orderHistoryRoutes = require("./routes/orderhistory");
const rulesRoutes = require("./routes/rules");
const adminDiscountRoutes = require("./routes/admindiscounts");
const categoriesRoutes = require("./routes/categories");
const emailRoutes = require('./routes/email');
const staffEmailRoutes = require('./routes/staffemail');






const port = 8801;

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(session({
  secret: "your_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
  },
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/categories", categoriesRoutes)
app.use("/api/admin", managementRoutes); // includes /admin/orders (Staff+Admin)
app.use("/api/admin", adminStatsRoutes); // includes /admin/stats (Admin only)
app.use("/api/order", createOrderRoute); // placing orders
app.use("/api/order", orderHistoryRoutes); // my-orders history
app.use("/api/rules", rulesRoutes); // edit/view rules
app.use("/api/admin/discounts", adminDiscountRoutes);
app.use("/api/email", emailRoutes)
app.use('/api/staff', staffEmailRoutes);




// Error handler (keep at the end)
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
