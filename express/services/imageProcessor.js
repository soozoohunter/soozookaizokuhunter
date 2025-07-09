const fs = require('fs');
const path = require('path');
const { convertAndUpload: baseConvertAndUpload } = require('../utils/convertAndUpload');

// Default to localhost for development if PUBLIC_HOST not specified
const PUBLIC_HOST = process.env.PUBLIC_HOST || 'http://localhost:3000';
// Resolve to project-level uploads directory
const UPLOAD_BASE_DIR = '/app/uploads';
const PUBLIC_IMAGES_DIR = path.join(UPLOAD_BASE_DIR, 'publicImages');

function createPublicImageLink(fileId) {
  try {
    const files = fs.readdirSync(PUBLIC_IMAGES_DIR)
      .filter(f => f.startsWith(`public_${fileId}_`))
      .sort();
    if (files.length === 0) {
      return null;
    }
    const latest = files[files.length - 1];
    return `${PUBLIC_HOST.replace(/\/$/, '')}/uploads/publicImages/${latest}`;
  } catch {
    return null;
  }
}

async function convertAndUpload(fileId) {
  const baseName = `imageForSearch_${fileId}`;
  const exts = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp', '.tif', '.tiff'];
  let foundPath = null;
  let foundExt = null;
  for (const e of exts) {
    const testPath = path.join(UPLOAD_BASE_DIR, `${baseName}${e}`);
    if (fs.existsSync(testPath)) {
      foundPath = testPath;
      foundExt = e;
      break;
    }
  }
  if (!foundPath) {
    throw new Error(`Source file for id ${fileId} not found`);
  }
  const publicUrl = await baseConvertAndUpload(foundPath, foundExt, fileId);
  return { tempImagePath: foundPath, publicUrl };
}

module.exports = { convertAndUpload, createPublicImageLink };
