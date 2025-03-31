require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.POSTGRES_HOST || 'db',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

module.exports = sequelize;
