const express = require('express');
const path = require('path');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// 1) Serve API under /api
app.use('/api/users', usersRouter);

// 2) Serve React build (after you run `cd client && npm run build`)
app.use(express.static(path.join(__dirname, '../../client/build')));

// 3) All other routes → index.html for client‑side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`UI Service listening on http://localhost:${PORT}`);
});
