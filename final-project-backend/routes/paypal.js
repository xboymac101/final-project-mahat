
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/verify', async (req, res) => {
  const { orderID } = req.body;

  try {
    const { data } = await axios.post(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}`,
      {},
      {
        auth: {
          username: process.env.PAYPAL_CLIENT_ID,
          password: process.env.PAYPAL_SECRET,
        },
      }
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;