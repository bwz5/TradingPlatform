// ui_service/src/routes/users.js
const express = require('express');
const db      = require('../db');
const protect = require('../util/protect');

const router = express.Router();

/**
 * GET /api/users/me/stats
 *   – return current balance + holdings
 */
router.get('/me/stats', protect, async (req, res) => {
  try {
    // fetch balance
    const balRes = await db.query(
      `SELECT balance FROM users WHERE id = $1`,
      [req.claims.sub]
    );
    if (!balRes.rows.length) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // fetch holdings
    const holdRes = await db.query(
      `SELECT symbol, shares, avg_cost FROM holdings WHERE user_id = $1`,
      [req.claims.sub]
    );

    res.json({
      balance:  parseFloat(balRes.rows[0].balance),
      holdings: holdRes.rows.map(r => ({
        symbol:  r.symbol,
        shares:  Number(r.shares),
        avgCost: parseFloat(r.avg_cost),
      }))
    });
  } catch (e) {
    console.error('Stats error:', e);
    res.status(500).json({ msg: 'DB error' });
  }
});

/**
 * POST /api/users/me/deposit
 *   – { amount: <positive number> }
 *   – atomically adds to balance, returns new balance
 */
router.post('/me/deposit', protect, async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ msg: 'amount must be a positive number' });
  }

  try {
    const result = await db.query(
      `UPDATE users
         SET balance = balance + $1
       WHERE id = $2
     RETURNING balance`,
      [amount, req.claims.sub]
    );

    if (!result.rows.length) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ balance: parseFloat(result.rows[0].balance) });
  } catch (e) {
    console.error('Deposit error:', e);
    res.status(500).json({ msg: 'DB error' });
  }
});

/**
 * POST /api/users/me/withdraw
 *   – { amount: <positive number> }
 *   – atomically subtracts from balance if sufficient funds, else 400
 */
router.post('/me/withdraw', protect, async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ msg: 'amount must be a positive number' });
  }

  try {
    const result = await db.query(
      `UPDATE users
         SET balance = balance - $1
       WHERE id = $2 AND balance >= $1
     RETURNING balance`,
      [amount, req.claims.sub]
    );

    if (!result.rows.length) {
      // either user not found or insufficient funds
      // disambiguate if you like by checking existence first
      return res.status(400).json({ msg: 'Insufficient funds or user not found' });
    }

    res.json({ balance: parseFloat(result.rows[0].balance) });
  } catch (e) {
    console.error('Withdraw error:', e);
    res.status(500).json({ msg: 'DB error' });
  }
});

module.exports = router;
