const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

const PORT = 3000; // You can change the port if needed
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
