const { File } = require('../models');
const crypto = require('crypto');
const fs = require('fs').promises;
const { queueService } = require('../services');

exports.handleStep1Upload = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: '未上傳文件。' });
    }

    try {
        const { path: filePath, originalname: filename, mimetype, size } = req.file;

        // 1. 計算 SHA256 指紋
        const fileBuffer = await fs.readFile(filePath);
        const hash = crypto.createHash('sha256');
        hash.update(fileBuffer);
        const fingerprint = hash.digest('hex');

        // 2. 保存文件元數據到數據庫
        const newFile = await File.create({
            filename,
            mimetype,
            size,
            fingerprint,
            storage_path: filePath,
        });

        // 3. 發送任務到後台工作隊列
        await queueService.sendTask({
            fileId: newFile.id,
            filePath: filePath
        });

        // 4. 響應給前端
        res.status(201).json({
            message: "文件上傳成功，指紋已計算。",
            file: {
                id: newFile.id,
                filename: newFile.filename,
                fingerprint: newFile.fingerprint
            },
            scanId: `scan-${newFile.id}`
        });

    } catch (error) {
        console.error('Step1上傳處理錯誤:', error);
        res.status(500).json({ message: '文件處理期間發生服務器錯誤。' });
    }
};
