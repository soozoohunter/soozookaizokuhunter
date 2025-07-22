const express = require('express');
const router = express.Router();
const { InfringementCase, File, User } = require('../models');

router.get('/:uniqueCaseId', async (req, res) => {
    try {
        const { uniqueCaseId } = req.params;
        const caseDetails = await InfringementCase.findOne({
            where: { unique_case_id: uniqueCaseId },
            include: [
                { model: File, attributes: ['filename', 'fingerprint', 'ipfs_hash', 'tx_hash', 'created_at'] },
                { model: User, attributes: ['real_name'] }
            ]
        });
        if (!caseDetails) {
            return res.status(404).json({ message: '找不到此案件，連結可能已失效或無效。' });
        }
        res.json({
            caseId: caseDetails.unique_case_id,
            status: caseDetails.status,
            infringingUrl: caseDetails.infringing_url,
            licensePrice: caseDetails.license_price,
            originalWork: {
                author: caseDetails.User.real_name,
                filename: caseDetails.File.filename,
                fingerprint: caseDetails.File.fingerprint,
                ipfsHash: caseDetails.File.ipfs_hash,
                txHash: caseDetails.File.tx_hash,
                creationDate: caseDetails.File.created_at
            }
        });
    } catch (error) {
        res.status(500).json({ message: '讀取案件時發生錯誤。' });
    }
});

module.exports = router;
