const express = require('express');
const db      = require('../db');
const protect = require('../util/protect');

const router = express.Router();

/* GET /api/users/me/stats ------------------------------------------- */
router.get('/me/stats', protect, async (req, res) => {
  try {
    /* 1) balance */
    const balRes = await db.query(
      `SELECT balance FROM users WHERE id=$1`, [req.claims.sub]);

    if (!balRes.rows.length)
      return res.status(404).json({ msg: 'user not found' });

    /* 2) holdings */
    const holdRes = await db.query(
      `SELECT symbol, shares, avg_cost
         FROM holdings WHERE user_id=$1`, [req.claims.sub]);

    res.json({
      balance: parseFloat(balRes.rows[0].balance),
      holdings: holdRes.rows.map(r => ({
        symbol:   r.symbol,
        shares:   Number(r.shares),
        avgCost:  parseFloat(r.avg_cost)   // <-- number now
      }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'DB error' });
  }
});

module.exports = router;
