// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email:      { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },       // 密碼哈希值
  plan:       { type: String, enum: ['free', 'premium'], default: 'free' },
  uploadsUsed:  { type: Number, default: 0 },           // 已使用的上傳次數
  apiCallsUsed: { type: Number, default: 0 },           // 已使用的API調用次數
  name:       { type: String },                        // 使用者姓名
  contact:    { type: String }                         // 其他聯絡資訊
  // ...可擴充其他欄位，例如帳戶建立時間等
});

module.exports = mongoose.model('User', UserSchema);
