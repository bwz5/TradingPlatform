const express = require('express');
const router  = express.Router();

// Create new user
router.post('/register', (req, res) => {
  // TODO: implement registration logic
  const { username, password } = req.body;
  console.log(`Registration request has been sent by ${username}`);
  res
    .status(201)
    .json({ message: 'User registered (stub)', token: 'YOUR_JWT_HERE' });
});

// Authenticate user
router.post('/login', (req, res) => {
  // TODO: implement login logic
  const { username, password } = req.body;
  console.log(`Login request has been sent by ${username}`);
  res
    .status(200)
    .json({ message: 'User logged in (stub)', token: 'YOUR_JWT_HERE' });
});

module.exports = router;
