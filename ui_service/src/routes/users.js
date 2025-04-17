const express = require('express');
const router  = express.Router();

// Fetch current user stats
router.get('/me/stats', (req, res) => {
  // TODO: lookup real stats
  res.json({
    balance: 12345.67,
    holdings: [
      { symbol: 'AAPL', shares: 10, avgCost: 150.0 },
      { symbol: 'TSLA', shares: 5,  avgCost: 600.0 }
    ]
  });
});

module.exports = router;
