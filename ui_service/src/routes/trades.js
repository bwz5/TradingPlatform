// ui_service/src/routes/trades.js
const express  = require('express');
const protect  = require('../util/protect');
const fetch =  require('node-fetch');

const router = express.Router();

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
const normalizeSymbol = (s) => String(s).trim().toUpperCase();

const validateQty = (q) => {
  const n = +q;
  return Number.isFinite(n) && n > 0 ? n : null;
};

/* ------------------------------------------------------------------ */
/*  POST /api/trades   (protected)                                    */
/* ------------------------------------------------------------------ */
router.post('/', protect, async (req, res) => {
  let { symbol, qty, side = 'buy' } = req.body;

  // 1) Basic validation
  symbol = normalizeSymbol(symbol);
  qty    = validateQty(qty);
  side   = side.toLowerCase();

  if (!symbol || !qty)
    return res.status(400).json({ msg: 'symbol & qty (>0) required' });

  if (!['buy', 'sell'].includes(side))
    return res.status(400).json({ msg: 'side must be buy or sell' });

  const payload = { symbol, qty, side, username: req.claims.sub };
  console.log(`▶︎ ${side.toUpperCase()} ${qty} ${symbol} for ${req.claims.sub}`);

  /* 2) Forward to API‑Gateway if configured -------------------------------- */
  const gw = process.env.API_GATEWAY_URL;
  if (gw) {
    try {
      const up   = await fetch(`${gw}/api/trades`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });
      const data = await up.json();
      return res.status(up.status).json(data);
    } catch (err) {
      console.error('Gateway unreachable:', err.message);
      return res.status(502).json({ msg: 'Gateway unreachable' });
    }
  }

  /* 3) Local stub response ------------------------------------------------- */
  return res.status(201).json({
    msg: `Trade queued: ${side} ${qty} × ${symbol}`,
    ...payload
  });
});

module.exports = router;
