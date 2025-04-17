require('dotenv').config();
require('./db');                       // ← initialise pool early

const express = require('express');
const path    = require('path');

const authR  = require('./routes/auth');
const userR  = require('./routes/users');
const tradeR = require('./routes/trades');

const app = express();
app.use(express.json());

app.use('/api/auth',   authR);
app.use('/api/users',  userR);
app.use('/api/trades', tradeR);

/* serve React */
app.use(express.static(path.join(__dirname, '../../client/build')));
app.get('*', (_, res) =>
  res.sendFile(path.join(__dirname, '../../client/build', 'index.html')));

app.listen(process.env.PORT || 3000, () =>
  console.log('ui_service listening'));
