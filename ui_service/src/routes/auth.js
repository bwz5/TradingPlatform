// ui_service/src/routes/auth.js
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const router   = express.Router();

/* ---------------------------  In‑memory “DB”  --------------------------- */
const users = new Map();           // email → { name, email, passHash }

/* ---------------------------  Helpers  --------------------------------- */
const issueToken = (user) =>
  jwt.sign(
    { sub: user.email, name: user.name },               // payload claims
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_TTL || '15m' }
  );

/* ---------------------------  POST /register  -------------------------- */
router.post('/register', async (req, res) => {
  const { name = req.body.username,   // fall back to username
          email = req.body.username,  // if you treat username ≈ email
          password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ msg: 'name, email, password required' });

  if (users.has(email))
    return res.status(400).json({ msg: 'Email already registered' });

  try {
    const passHash = await bcrypt.hash(password, 11);
    const user = { name, email, passHash };
    users.set(email, user);

    const token = issueToken(user);
    res.status(201).json({ token, name, email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/* ---------------------------  POST /login  ----------------------------- */
router.post('/login', async (req, res) => {
  const { email = req.body.username, password } = req.body;

  const user = users.get(email);
  if (!user || !(await bcrypt.compare(password, user.passHash))) {
    return res.status(401).json({ msg: 'Incorrect email or password' });
  }

  const token = issueToken(user);
  res.json({ token, name: user.name, email });
});

module.exports = router;
