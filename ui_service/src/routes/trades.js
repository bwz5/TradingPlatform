// ui_service/src/routes/trades.js
/**********************************************************************
 *  Trade endpoint
 *  - Accepts POST /api/trades with { symbol, qty, side?, price? }
 *  - Forwards the payload to the OMS via API_GATEWAY_URL
 *  - If OMS (gateway) is unreachable → returns 502
 *  - No database mutations happen here; OMS owns state changes
 *********************************************************************/

const express  = require('express');
const protect  = require('../util/protect');
const fetch    = require('node-fetch');      // always node‑fetch v2

const router = express.Router();

/* Helpers ----------------------------------------------------------- */
const normalizeSymbol = (s) => String(s || '').trim().toUpperCase();
const isPositiveInt   = (v) => Number.isInteger(v) && v > 0;

/* POST /api/trades -------------------------------------------------- */
router.post('/', protect, async (req, res) => {
  let { symbol, qty, side = 'buy', price } = req.body;

  symbol = normalizeSymbol(symbol);
  qty    = Number(qty);

  if (!symbol || !isPositiveInt(qty))
    return res.status(400).json({ msg: 'symbol & qty (>0 int) required' });

  side  = String(side).toLowerCase();
  price = price ? Number(price) : undefined;

  if (!['buy', 'sell'].includes(side))
    return res.status(400).json({ msg: 'side must be buy or sell' });

  const payload = {
    symbol,
    qty,
    side,
    price,
    username: req.claims.sub,      // let OMS know who placed it
  };

  /* Forward to OMS via Load Balancer -------------------------------- */
  const gw = process.env.API_GATEWAY_URL;   // e.g. https://lb.example.com
  if (gw) {
    try {
      const gwRes  = await fetch(`${gw}/api/trades`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const body = await gwRes.json().catch(() => ({}));  // OMS may send no body
      return res.status(gwRes.status).json(body);
    } catch (err) {
      console.error('OMS unreachable:', err.message);
      return res.status(502).json({ msg: 'Gateway / OMS unreachable' });
    }
  }

  /* Dev fallback when no gateway configured ------------------------- */
  console.warn('API_GATEWAY_URL not set ‑ returning stub response');
  return res.status(202).json({
    msg:     `Stub: ${side} ${qty} ${symbol} accepted (no OMS)`,
    payload,
  });
});

module.exports = router;
