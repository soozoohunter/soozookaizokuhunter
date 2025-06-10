// express/services/crawlers/tinEyeCrawler.js
const { searchByFile, extractLinks } = require('../tineyeApiService');

const ENGINE_MAX_LINKS = parseInt(process.env.ENGINE_MAX_LINKS, 10) || 50;

async function searchTinEye(_browser, imagePath){
  const engineName = 'tineye';
  let foundLinks = [];
  try {
    const data = await searchByFile(imagePath);
    foundLinks = extractLinks(data).slice(0, ENGINE_MAX_LINKS);
  } catch(err){
    console.error('[TinEye API] error =>', err.message);
  }
  return {
    engine: engineName,
    screenshotPath: '',
    links: foundLinks,
    success: foundLinks.length>0
  };
}

module.exports = { searchTinEye };
