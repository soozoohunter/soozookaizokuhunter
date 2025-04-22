const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'suzoo_postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'suzoo',
  user: process.env.POSTGRES_USER || 'suzoo',
  password: process.env.POSTGRES_PASSWORD || 'KaiShieldDbPass2023!'
});

// 可選: 可在這裡 pool.connect()，並 console.log
pool.connect()
  .then(() => console.log('[Express/db.js] pg Pool connected.'))
  .catch(err => console.error('[Express/db.js] pg Pool error:', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
};
