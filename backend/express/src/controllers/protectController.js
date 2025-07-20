const { File, User } = require('../models');
const crypto = require('crypto');
const fs = require('fs').promises;
const fsSync = require('fs');
const { queueService } = require('../services');
const { generateCertificatePDF } = require('../services/pdfService');
const path = require('path');
const logger = require('../utils/logger');

const CERT_DIR = path.join('/app/uploads', 'certificates');
if (!fsSync.existsSync(CERT_DIR)) {
    fsSync.mkdirSync(CERT_DIR, { recursive: true });
}

exports.handleStep1Upload = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: '未上傳文件。' });
    }

    try {
        const { path: filePath, originalname, mimetype, size } = req.file;

        const { title, keywords } = req.body;

        const userId = req.user ? req.user.id : 1;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const fileBuffer = await fs.readFile(filePath);
        const hash = crypto.createHash('sha256');
        hash.update(fileBuffer);
        const fingerprint = hash.digest('hex');

        const newFile = await File.create({
            user_id: user.id,
            filename: originalname,
            title: title || originalname,
            keywords,
            fingerprint,
            status: 'protected',
            mime_type: mimetype,
            size
        });

        const pdfPath = path.join(CERT_DIR, `certificate_${newFile.id}.pdf`);
        await generateCertificatePDF({ user, file: newFile, title }, pdfPath);

        await newFile.update({ certificate_path: pdfPath });

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
        logger.error('Error in Step 1 upload process:', error);
        res.status(500).json({ message: 'Server error during file processing.' });
    } finally {
        if (req.file.path) {
            await fs.unlink(req.file.path);
        }
    }
};
