// ui_service/src/routes/users.js
const express  = require('express');
const protect  = require('../util/protect');

const router = express.Router();

/* GET /api/users/me/stats  – protected */
router.get('/me/stats', protect, (req, res) => {
  // demo portfolio
  res.json({
    balance: 12345.67,
    holdings: [
      { symbol: 'AAPL', shares: 10, avgCost: 150 },
      { symbol: 'TSLA', shares: 5,  avgCost: 600 }
    ],
    who: req.claims.name
  });
});

module.exports = router;
