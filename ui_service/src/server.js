// ui_service/src/server.js
require('dotenv').config();
const path    = require('path');
const express = require('express');

const authR  = require('./routes/auth');
const userR  = require('./routes/users');
const tradeR = require('./routes/trades');

const app = express();
app.use(express.json());

/* ----------------  API routes ---------------- */
app.use('/api/auth',   authR);
app.use('/api/users',  userR);
app.use('/api/trades', tradeR);

/* -------------  Serve React bundle ----------- */
app.use(express.static(path.join(__dirname, '../../client/build')));
app.get('*', (_, res) =>
  res.sendFile(path.join(__dirname, '../../client/build', 'index.html'))
);

/* ----------------  Start server -------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ui_service listening on :${PORT}`));
