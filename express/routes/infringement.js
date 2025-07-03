require('dotenv').config();

const express = require('express');
const router = express.Router();
const db = require('../models');
const { sendTakedownRequest, isDmcaEnabled } = require('../services/dmcaService');
const checkQuota = require('../middleware/quotaCheck');
const { UsageRecord, DMCARequest } = db;
const logger = require('../utils/logger');

// POST /api/infringement/takedown
// Handles the DMCA takedown request from the frontend.
router.post('/takedown', checkQuota('dmca_takedown'), async (req, res) => {
    if (!isDmcaEnabled) {
        return res.status(503).json({ error: 'DMCA Service is not configured on the server.' });
    }

    const { originalFileId, infringingUrl } = req.body;

    if (!originalFileId || !infringingUrl) {
        return res.status(400).json({ error: 'Missing originalFileId or infringingUrl in request body.' });
    }

    try {
        // 1. Find the original file from our database to get its public URL
        const originalFile = await db.File.findByPk(originalFileId);
        if (!originalFile) {
            return res.status(404).json({ error: `Original file with ID ${originalFileId} not found.` });
        }

        // 2. Construct the original content URL. This could be an IPFS gateway link or a direct server link.
        // We'll use a link to our own server's protected view as the original content.
        const originalUrl = `${process.env.PUBLIC_HOST}/api/protect/view/${originalFile.id}`;

        // 3. Prepare the details for the DMCA takedown request
        const takedownDetails = {
            infringingUrl: infringingUrl,
            originalUrl: originalUrl,
            description: `Automated takedown request for copyrighted work. Original work registered with File ID: ${originalFile.id}, Title: "${originalFile.title}".`,
        };

        // 4. Call the dmcaService to send the actual request
        const dmcaResult = await sendTakedownRequest(takedownDetails);
        const report = await db.InfringementReport.create({
            user_id: req.user.userId || req.user.id,
            scan_id: null,
            links_confirmed: [infringingUrl]
        });
        await DMCARequest.create({
            user_id: req.user.userId || req.user.id,
            scan_id: null,
            report_id: report.id,
            infringing_url: infringingUrl,
            status: dmcaResult.success ? 'submitted' : 'failed',
            dmca_case_id: dmcaResult.data?.caseID || null,
            submitted_at: new Date()
        });
        await UsageRecord.create({ user_id: req.user.userId || req.user.id, feature_code: 'dmca_takedown' });

        if (dmcaResult.success) {
            res.status(200).json({
                success: true,
                message: dmcaResult.message,
                caseId: dmcaResult.data?.caseID,
            });
        } else {
            res.status(400).json({
                success: false,
                error: dmcaResult.message,
            });
        }
    } catch (error) {
        logger.error('[Takedown Route] An unexpected error occurred:', error);
        res.status(500).json({
            success: false,
            error: 'An internal server error occurred while processing the takedown request.',
        });
    }
});

// POST /api/infringement/manual
// Store manual notification for admin follow-up when DMCA API fails
router.post('/manual', async (req, res) => {
    const { originalFileId, infringingUrl, contactEmail, contactName, contactPhone } = req.body;
    if (!infringingUrl || !contactEmail || !contactName) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }
    try {
        const report = await db.ManualReport.create({
            file_id: originalFileId || null,
            user_id: req.user?.userId || null,
            infringing_url: infringingUrl,
            contact_email: contactEmail,
            contact_name: contactName,
            contact_phone: contactPhone || null
        });
        logger.info(`[ManualReport] Created manual report ID ${report.id} for ${infringingUrl}`);
        res.status(201).json({ success: true, reportId: report.id });
    } catch (err) {
        logger.error('[ManualReport] Failed to create manual report:', err);
        res.status(500).json({ error: 'Failed to record manual report.' });
    }
});

module.exports = router;
