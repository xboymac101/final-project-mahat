const express = require('express');
const app = express();

const articleRoutes = require('./routes/articles');
const port = 8801;

const cors = require('cors');
app.use(cors());

app.use(express.json());

app.use('/article', articleRoutes);
app.use((err, req, res, next) => {
  console.error(err); // Log error
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
