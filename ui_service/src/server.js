const express = require('express');
const path    = require('path');

require('dotenv').config();

const authRouter   = require('./routes/auth');
const usersRouter  = require('./routes/users');
const tradesRouter = require('./routes/trades');

const app = express();
app.use(express.json());

// Mount API routes
app.use('/api/auth',   authRouter);    // POST /api/auth/register, /api/auth/login
app.use('/api/users',  usersRouter);   // GET  /api/users/me/stats
app.use('/api/trades', tradesRouter);  // POST /api/trades

// Serve React build
app.use(
  express.static(path.join(__dirname, '../../client/build'))
);
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '../../client/build', 'index.html'))
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ui_service listening on http://localhost:${PORT}`);
});
