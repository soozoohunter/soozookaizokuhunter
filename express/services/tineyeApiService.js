// express/services/tineyeApiService.js

const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'https://api.tineye.com/rest';
const API_KEY = process.env.TINEYE_API_KEY;
if (!API_KEY) {
  throw new Error('必须定义 TINEYE_API_KEY');
}

/**
 * 通过 URL 搜索
 * @param {string} imageUrl
 * @param {object} options
 */
async function searchByUrl(imageUrl, options = {}) {
  const resp = await axios.get(`${API_URL}/search/`, {
    params: { image_url: imageUrl, ...options },
    headers: { 'X-API-Key': API_KEY },
    validateStatus: () => true
  });
  if (resp.status === 401 || resp.status === 403) {
    throw new Error('TinEye API authentication failed');
  }
  if (resp.status !== 200) {
    throw new Error(`TinEye 搜索失败：${resp.status}`);
  }
  return resp.data;
}

/**
 * 通过本地文件搜索
 * @param {string} filePath
 * @param {object} options
 */
async function searchByFile(filePath, options = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`FILE_NOT_FOUND: ${filePath}`);
  }
  const form = new FormData();
  form.append('image_upload', fs.createReadStream(filePath));

  const query = new URLSearchParams(options).toString();
  const resp = await axios.post(
    `${API_URL}/search/?${query}`,
    form,
    {
      headers: { ...form.getHeaders(), 'X-API-Key': API_KEY },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      validateStatus: () => true
    }
  );
  if (resp.status === 401 || resp.status === 403) {
    throw new Error('TinEye API authentication failed');
  }
  if (resp.status !== 200) {
    throw new Error(`TinEye 搜索失败：${resp.status}`);
  }
  return resp.data;
}

/**
 * 从 TinEye 返回结构中提取所有结果链接
 * @param {object} apiResponse
 * @returns {string[]}
 */
function extractLinks(apiResponse) {
  // TinEye 可能在 .results.matches 或 .result.matches
  const matches = apiResponse.results?.matches || apiResponse.result?.matches || [];
  const links = [];
  for (const m of matches) {
    if (Array.isArray(m.backlinks)) {
      for (const b of m.backlinks) {
        if (typeof b === 'string') {
          links.push(b);
        } else if (b.backlink) {
          links.push(b.backlink);
        } else if (b.url) {
          links.push(b.url);
        }
      }
    } else if (m.backlink) {
      links.push(m.backlink);
    }
  }
  // 去重
  return [...new Set(links)];
}

module.exports = { searchByUrl, searchByFile, extractLinks };
