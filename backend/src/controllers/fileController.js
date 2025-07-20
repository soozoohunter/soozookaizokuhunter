const { File } = require('../models');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

exports.downloadCertificate = async (req, res) => {
    try {
        const fileId = req.params.id;
        const fileRecord = await File.findByPk(fileId);

        if (!fileRecord) {
            return res.status(404).json({ message: 'File record not found.' });
        }

        const pdfPath = fileRecord.certificate_path;

        if (!pdfPath || !fs.existsSync(pdfPath)) {
            logger.warn(`Certificate for file ID ${fileId} not found at path: ${pdfPath}`);
            return res.status(404).json({ message: 'Certificate PDF not found. It may still be generating.' });
        }

        res.download(pdfPath, `Certificate_${fileRecord.filename}.pdf`, (err) => {
            if (err) {
                logger.error(`Failed to download certificate for file ID ${fileId}:`, err);
                if (!res.headersSent) {
                    res.status(500).send('Could not download the file.');
                }
            }
        });

    } catch (error) {
        logger.error(`Error in downloadCertificate controller: ${error.message}`);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error while fetching certificate.' });
        }
    }
};
