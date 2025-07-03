const { User } = require('../models');

const checkQuota = (checkType) => async (req, res, next) => {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    if (checkType === 'upload') {
        if (user.image_upload_usage >= user.image_upload_limit) {
            return res.status(403).json({ error: '圖片上傳數量已達上限。請升級您的方案。' });
        }
    } else if (checkType === 'scan') {
        if (user.scan_usage_reset_at && new Date() > new Date(user.scan_usage_reset_at)) {
            user.scan_usage_monthly = 0;
            user.scan_usage_reset_at = new Date(new Date().setMonth(new Date().getMonth() + 1));
            await user.save();
        }
        if (user.scan_usage_monthly >= user.scan_limit_monthly) {
            return res.status(403).json({ error: '本月侵權偵測次數已達上限。請升級您的方案。' });
        }
    }
    next();
};

module.exports = checkQuota;
