const { searchByFile, extractLinks } = require('./tineyeApiService');

const ENGINE_MAX_LINKS = parseInt(process.env.ENGINE_MAX_LINKS, 10) || 50;

async function searchImageTinEye(_browser, imagePath) {
    const result = { success: false, engine: 'TinEye', links: [], error: null };
    try {
        const data = await searchByFile(imagePath);
        result.links = extractLinks(data).slice(0, ENGINE_MAX_LINKS);
        result.success = result.links.length > 0;
    } catch (err) {
        result.error = err.message;
        console.error('[TinEye API] search failed:', err.message);
    }
    return result;
}

module.exports = { searchImageTinEye };
