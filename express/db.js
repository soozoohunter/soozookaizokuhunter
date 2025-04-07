// express/db.js

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER,         // e.g. "suzoo"
  password: process.env.POSTGRES_PASSWORD, // e.g. "KaiShieldDbPass2023!"
  database: process.env.POSTGRES_DB,       // e.g. "suzoo_db"
});

module.exports = pool;
