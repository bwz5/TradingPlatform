// ui_service/src/util/protect.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const hdr = req.headers.authorization || '';
  const [, token] = hdr.split(' ');
  if (!token) return res.status(401).json({ msg: 'No token' });

  try {
    req.claims = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ msg: 'Invalid / expired token' });
  }
};
