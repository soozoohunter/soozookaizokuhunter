// express/db.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'suzoo_postgres',
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER || 'suzoo',
  password: process.env.POSTGRES_PASSWORD || 'KaiShieldDbPass2023!',
  database: process.env.POSTGRES_DB || 'suzoo'
});

// 可選：測試連線
pool.connect()
  .then(() => console.log('[Express/db.js] pg Pool connected.'))
  .catch(err => console.error('[Express/db.js] pg Pool error:', err));

// 匯出 query 函式以供路由使用
module.exports = {
  query: (text, params) => pool.query(text, params),
};
