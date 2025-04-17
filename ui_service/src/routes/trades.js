// ui_service/src/routes/trades.js
const express = require('express');
// If you’re on Node ≥18 you get fetch for free.
// Otherwise install: npm install node-fetch
const fetch = require('node-fetch');

const router = express.Router();

router.post('/', async (req, res) => {
  // 1) Destructure the incoming data
  const { symbol, qty, username } = req.body;
  console.log(`Trade request from ${username}: ${qty} shares of ${symbol}`);

  // 2) Build the payload you’ll send upstream
  const payload = { symbol, qty, username };

  try {
    console.log(`Sending trade to API Gateway at address ${process.env.API_GATEWAY_URL}/api/trades`);

    // 3) Forward to your load balancer / gateway
    const gatewayRes = await fetch(
      `${process.env.API_GATEWAY_URL}/api/trades`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const gatewayData = await gatewayRes.json();

    if (!gatewayRes.ok) {
      console.error('Gateway returned error:', gatewayData);
      // 4a) If the gateway failed, bubble that back as a 502
      return res
        .status(502)
        .json({ message: 'Upstream API error', details: gatewayData });
    }

    console.log('Gateway response:', gatewayData);

    // 4b) On success, relay whatever you like back to your client
    return res.status(201).json({
      message: `Order for ${qty} ${symbol} placed by ${username}`,
      gatewayResponse: gatewayData,
    });
  } catch (err) {
    console.error('Error sending to gateway:', err);
    // 5) Network or unexpected failure
    return res
      .status(500)
      .json({ message: 'Internal server error' });
  }
});

module.exports = router;
