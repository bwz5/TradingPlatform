// ui_service/src/routes/auth.js
/**********************************************************************
 * User registration & login backed by CockroachDB
 * - Passwords are bcrypt‑hashed
 * - JWT returned on success
 *********************************************************************/

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../db');

const router = express.Router();

/* ------------------------------------------------------------------ */
/*  Helper to issue a JWT                                              */
/* ------------------------------------------------------------------ */
const issueToken = (user) =>
  jwt.sign(
    { sub: user.id, name: user.name },            // payload / claims
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_TTL || '15m' }
  );

/* ------------------------------------------------------------------ */
/*  POST /api/auth/register                                            */
/* ------------------------------------------------------------------ */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ msg: 'name, email & password required' });

  try {
    const hash = await bcrypt.hash(password, 11);

    const { rows } = await db.query(
      `INSERT INTO users (name, email, pass_hash)
         VALUES ($1,$2,$3)
       RETURNING id, name, email`,
      [name, email, hash]
    );

    const user  = rows[0];
    const token = issueToken(user);
    res.status(201).json({ token, name: user.name, email: user.email });
  } catch (e) {
    if (e.code === '23505')      // unique_violation on email
      return res.status(400).json({ msg: 'Email already registered' });

    console.error('Register DB error:', e);
    res.status(500).json({ msg: 'Server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/auth/login                                               */
/* ------------------------------------------------------------------ */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ msg: 'email & password required' });

  try {
    const { rows } = await db.query(
      `SELECT id, name, pass_hash FROM users WHERE email = $1`, [email]);

    if (!rows.length)
      return res.status(401).json({ msg: 'Incorrect email or password' });

    const userRow   = rows[0];

    /* pass_hash comes back as Buffer because column type is BYTES */
    const storedHash = Buffer.isBuffer(userRow.pass_hash)
      ? userRow.pass_hash.toString()   // Buffer → string
      : userRow.pass_hash;             // already string if column is STRING

    const ok = await bcrypt.compare(password, storedHash);
    if (!ok)
      return res.status(401).json({ msg: 'Incorrect email or password' });

    const token = issueToken(userRow);
    res.json({ token, name: userRow.name, email });
  } catch (e) {
    console.error('Login DB error:', e);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
