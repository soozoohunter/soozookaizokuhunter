// 載入必要套件和設定
require('dotenv').config();                     // 載入 .env 環境變數
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { ethers } = require('ethers');

// 使用環境變數建立資料庫連線 (example for MySQL)
const sequelize = new Sequelize(
  process.env.DB_NAME,          // 資料庫名稱
  process.env.DB_USER,          // 資料庫使用者
  process.env.DB_PASSWORD,      // 資料庫密碼
  {
    host: process.env.DB_HOST,  // 資料庫主機位址
    dialect: process.env.DB_DIALECT || 'mysql',  // 資料庫方言，例如 mysql
    logging: false              // 關閉 SQL 日誌 (可選擇性設定)
  }
);

// 定義 User 模型
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }     // 驗證 email 格式
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  serialNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: () => {
      // 產生包含日期的 UUID 序號，例如 20250415-<UUID>
      const dateStr = new Date().toISOString().replace(/[-:.T]/g, '').slice(0, 8);
      return `${dateStr}-${uuidv4()}`;
    }
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false
  },
  IG: { type: DataTypes.STRING },       // 各社群帳號欄位，允許空值
  FB: { type: DataTypes.STRING },
  YouTube: { type: DataTypes.STRING },
  TikTok: { type: DataTypes.STRING },
  Shopee: { type: DataTypes.STRING },
  Ruten: { type: DataTypes.STRING },
  Yahoo: { type: DataTypes.STRING },
  Amazon: { type: DataTypes.STRING },
  eBay: { type: DataTypes.STRING },
  Taobao: { type: DataTypes.STRING }
}, {
  // 模型選項
  tableName: 'Users',
  timestamps: true  // 自動維護 createdAt、updatedAt
});

// Hook：在建立或更新 User 前加密密碼
User.beforeCreate(async (user, options) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);  // 雜湊密碼
  }
});
User.beforeUpdate(async (user, options) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// Hook：在成功建立 User 後寫入智慧合約 (區塊鏈)
User.afterCreate(async (user, options) => {
  try {
    // 使用 ethers.js 連接區塊鏈
    const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
    const contractABI = [
      // 合約中 registerUser 方法的 ABI 定義 (假設參數皆為 string)
      "function registerUser(string userName, string role, string accountsJson, string serialNumber) public"
    ];
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

    // 準備 accountsJson（包含所有社群帳號欄位的 JSON字串）
    const accountsData = {
      IG: user.IG, FB: user.FB, YouTube: user.YouTube, TikTok: user.TikTok,
      Shopee: user.Shopee, Ruten: user.Ruten, Yahoo: user.Yahoo,
      Amazon: user.Amazon, eBay: user.eBay, Taobao: user.Taobao
    };
    const accountsJson = JSON.stringify(accountsData);

    // 呼叫智慧合約的 registerUser 方法寫入鏈上資料
    await contract.registerUser(user.userName, user.role, accountsJson, user.serialNumber);
    console.log(`Blockchain: registerUser called for ${user.userName}`);
  } catch (err) {
    console.error('Blockchain registration failed:', err);
    // （可選）在此進行錯誤處理，例如標記狀態，或補償機制
  }
});

// 匯出 Sequelize 實例和 User 模型
module.exports = { sequelize, User };
