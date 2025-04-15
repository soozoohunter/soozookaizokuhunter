const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// 建立 Sequelize 連線（使用 .env 中的資料庫設定）
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  logging: false  // 可選：關閉 SQL 日誌輸出
});

// 定義 User 模型
const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true  // Email 必須唯一
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true  // 使用者名稱必須唯一
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false  // 將存儲哈希後的密碼
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false  // 'copyright' | 'trademark' | 'both'
  },
  serialNumber: {
    type: DataTypes.STRING,
    allowNull: false  // 用戶提供的序號
  },
  IG: { type: DataTypes.STRING },       // Instagram 帳號
  FB: { type: DataTypes.STRING },       // Facebook 帳號
  YouTube: { type: DataTypes.STRING },  // YouTube 帳號/頻道
  TikTok: { type: DataTypes.STRING },   // TikTok 帳號
  Shopee: { type: DataTypes.STRING },   // 蝦皮購物帳號
  Ruten: { type: DataTypes.STRING },    // 露天拍賣帳號
  Yahoo: { type: DataTypes.STRING },    // Yahoo奇摩帳號
  Amazon: { type: DataTypes.STRING },   // Amazon 賣家帳號
  Taobao: { type: DataTypes.STRING },   // 淘寶帳號
  eBay: { type: DataTypes.STRING }      // eBay 帳號
}, {
  // 模型設定選項
  tableName: 'Users',    // 指定資料表名稱，如有需要
  underscored: false,    // 假設不使用底線命名
  timestamps: true       // 如需要 createdAt, updatedAt
});

module.exports = { sequelize, User };
