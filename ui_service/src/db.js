// ui_service/src/db.js
const { Pool } = require('pg');
require('dotenv').config();        // make sure DATABASE_URL is loaded

// CockroachCloud Serverless already presents a trusted cert in its chain;
// pg will verify it automatically with sslmode=verify-full.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  application_name: 'ui_service',
  max: 8,
  idleTimeoutMillis: 30_000,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
