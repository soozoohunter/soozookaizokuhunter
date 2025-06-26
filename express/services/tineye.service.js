require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const os = require('os');
const logger = require('../utils/logger');

const TINEYE_API_URL = process.env.TINEYE_API_URL || 'https://api.tineye.com/rest/search/';
const TINEYE_API_KEY = process.env.TINEYE_API_KEY;

function extractLinks(apiResponse) {
    if (!apiResponse || !apiResponse.results || !Array.isArray(apiResponse.results.matches)) {
        return [];
    }
    const urls = apiResponse.results.matches
        .flatMap(match => match.backlinks ? match.backlinks.map(link => link.url) : [])
        .filter(Boolean);
    return [...new Set(urls)];
}

async function searchByFile(filePath) {
    if (!TINEYE_API_KEY) {
        logger.error('[TinEye Service] TINEYE_API_KEY is not set.');
        return { success: false, links: [], error: 'TINEYE_API_KEY is not set.' };
    }

    const form = new FormData();
    form.append('image_upload', fs.createReadStream(filePath));

    try {
        const response = await axios.post(TINEYE_API_URL, form, {
            headers: {
                ...form.getHeaders(),
            },
            params: { api_key: TINEYE_API_KEY },
            timeout: 20000,
        });
        const links = extractLinks(response.data);
        logger.info(`[TinEye Service] Search by file successful, found ${links.length} links.`);
        return { success: true, links, error: null };
    } catch (err) {
        const errorMsg = err.response ? JSON.stringify(err.response.data) : err.message;
        logger.error(`[TinEye Service] Search by file failed: ${errorMsg}`);
        return { success: false, links: [], error: err.message };
    }
}

async function searchByBuffer(buffer) {
    const tmpDir = path.join(os.tmpdir(), 'tineye-buffer');
    await fsPromises.mkdir(tmpDir, { recursive: true });
    const tmpPath = path.join(tmpDir, `img_${Date.now()}.jpg`);
    await fsPromises.writeFile(tmpPath, buffer);
    try {
        return await searchByFile(tmpPath);
    } finally {
        await fsPromises.unlink(tmpPath).catch(err =>
            logger.warn(`[TinEye Service] Failed to delete temp file ${tmpPath}: ${err.message}`)
        );
    }
}

module.exports = {
    searchByFile,
    searchByBuffer,
};
