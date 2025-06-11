const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'https://api.tineye.com/rest';
const API_KEY = process.env.TINEYE_API_KEY;
if (!API_KEY) throw new Error('必须定义 TINEYE_API_KEY');

async function searchByUrl(imageUrl, options = {}) {
  const resp = await axios.get('https://api.tineye.com/rest/search/', {
    params: { image_url: imageUrl, ...options },
    headers: { 'X-API-Key': API_KEY },
    validateStatus: () => true
  });
  if (resp.status !== 200) throw new Error(`TinEye 搜索失败：${resp.status}`);
  return resp.data;
}

async function searchByFile(filePath, options = {}) {
  const form = new FormData();
  form.append('image_upload', fs.createReadStream(filePath));
  const resp = await axios.post(
    `https://api.tineye.com/rest/search/?${new URLSearchParams(options).toString()}`,
    form,
    {
      headers: { ...form.getHeaders(), 'X-API-Key': API_KEY },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      validateStatus: () => true
    }
  );
  if (resp.status !== 200) throw new Error(`TinEye 搜索失败：${resp.status}`);
  return resp.data;
}

function extractLinks(apiResponse) {
  const matches = apiResponse.results?.matches || [];
  const links = [];
  for (const m of matches) {
    if (Array.isArray(m.backlinks)) {
      for (const b of m.backlinks) {
        if (typeof b === 'string') links.push(b);
        else if (b.backlink) links.push(b.backlink);
        else if (b.url) links.push(b.url);
      }
    } else if (m.backlink) {
      links.push(m.backlink);
    }
  }
  return [...new Set(links)];
}

module.exports = { searchByUrl, searchByFile, extractLinks };
