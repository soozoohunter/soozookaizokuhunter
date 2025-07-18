// express/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger'); // 引入 logger

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('[Auth Middleware] Missing or invalid Authorization header.');
      return res.status(401).send({ error: 'Authentication required: No token provided or invalid format.' });
    }

    const token = authHeader.replace('Bearer ', '');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 根據您 JWT payload 的實際結構來判斷，通常是 decoded.id 或 decoded.userId
    // 濾除 undefined 以避免 Sequelize 拋出 "WHERE parameter has invalid 'undefined'" 的錯誤
    const ids = [decoded.id, decoded.userId].filter((v) => v !== undefined && v !== null);
    if (ids.length === 0) {
      logger.warn('[Auth Middleware] Token payload lacks user id.');
      return res.status(401).send({ error: 'Invalid token payload.' });
    }

    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        id: { [Op.in]: ids }
      }
    });

    if (!user) {
      logger.warn(`[Auth Middleware] User not found for decoded ID: ${decoded.id || decoded.userId}`);
      throw new Error('User not found.'); // 這會被 catch 捕獲
    }

    // 確保 req.user 包含所有需要的用戶資訊，並統一 user ID 的命名
    req.token = token;
    req.user = {
      ...user.toJSON(), // 將 Sequelize 實例轉換為純物件
      userId: user.id, // 確保有一個統一的 userId 屬性
    }; 
    next();
  } catch (e) {
    logger.error(`[Auth Middleware] Token verification error: ${e.message}`, { error: e.name, message: e.message, stack: e.stack });
    if (e.name === 'TokenExpiredError') {
      return res.status(401).send({ error: 'Unauthorized: Token has expired.' });
    }
    if (e.name === 'JsonWebTokenError') {
      return res.status(401).send({ error: 'Unauthorized: Invalid token.' });
    }
    res.status(401).send({ error: 'Authentication failed.' });
  }
};

module.exports = auth;
