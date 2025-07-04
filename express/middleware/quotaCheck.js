// express/middleware/quotaCheck.js (升級版，支援批量檢查)
const { User } = require('../models'); // 簡化，我們只需要 User 模型來查額度
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const checkQuota = (checkType) => async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        
        let requestedAmount = 1; // 單次操作預設為 1
        // 如果是批量上傳，我們會從 req.files 中獲取檔案數量
        if (checkType === 'upload' && req.files) {
            requestedAmount = req.files.length;
        }

        if (checkType === 'upload') {
            const remaining = user.image_upload_limit - user.image_upload_usage;
            if (requestedAmount > remaining) {
                return res.status(403).json({ 
                    error: `圖片上傳數量超出上限。您剩餘 ${remaining} 個額度，但嘗試上傳 ${requestedAmount} 個檔案。請升級方案或減少檔案數量。` 
                });
            }
        } else if (checkType === 'scan') {
            // 檢查每月掃描額度是否需要重置
            if (user.scan_usage_reset_at && new Date() > new Date(user.scan_usage_reset_at)) {
                logger.info(`Resetting monthly scan quota for user ${userId}.`);
                user.scan_usage_monthly = 0;
                user.scan_usage_reset_at = new Date(new Date().setMonth(new Date().getMonth() + 1));
                await user.save();
            }
            const remaining = user.scan_limit_monthly - user.scan_usage_monthly;
            if (requestedAmount > remaining) {
                return res.status(403).json({ error: `本月侵權偵測次數已達上限。您剩餘 ${remaining} 次額度。` });
            }
        }
        
        // 將請求數量附加到 req 物件上，方便後續路由使用
        req.quota = { requestedAmount };
        next();
    } catch (error) {
        logger.error(`[Quota Check Middleware] Error:`, error);
        res.status(500).json({ error: "Failed to verify quota." });
    }
};

module.exports = checkQuota;
