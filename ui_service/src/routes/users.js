const express = require('express');
const router = express.Router();

// In a real app you'd fetch from the DB here.
const dummyUsers = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
];

router.get('/', (req, res) => {
  res.json({ users: dummyUsers });
});

module.exports = router;
