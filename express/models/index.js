/********************************************************************
 * models/index.js
 * Sequelize 初始化 + 動態載入並匯出所有 Model
 ********************************************************************/
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const configPath = path.resolve(__dirname, '..', 'config', 'config.json');
let cfg = {};

if (fs.existsSync(configPath)) {
  cfg = require(configPath)[env];
} else {
  // fallback to environment variables
  cfg = {
    database: process.env.POSTGRES_DB,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    dialect: process.env.DB_DIALECT || 'postgres'
  };
}

// if you have a single DATABASE_URL env var:
if (cfg.use_env_variable) {
  cfg = Object.assign(cfg, { url: process.env[cfg.use_env_variable] });
}

const sequelize = cfg.url
  ? new Sequelize(cfg.url, cfg)
  : new Sequelize(cfg.database, cfg.username, cfg.password, cfg);

const db = {};
const basename = path.basename(__filename);

// 動態載入同目錄下所有模型
fs.readdirSync(__dirname)
  .filter(f => f.indexOf('.') !== 0 && f !== basename && f.slice(-3) === '.js')
  .forEach(f => {
    const modelDef = require(path.join(__dirname, f));
    const model = typeof modelDef === 'function'
      ? modelDef(sequelize, Sequelize.DataTypes)
      : modelDef;
    db[model.name] = model;
  });

// 執行各模型的 associate (若有定義)
Object.keys(db).forEach(name => {
  if (db[name].associate) {
    db[name].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
module.exports = db;
