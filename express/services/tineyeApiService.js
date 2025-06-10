const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'https://api.tineye.com/rest';
const API_KEY = process.env.TINEYE_API_KEY;

if (!API_KEY) {
  // Fail fast during service startup if API key missing
  throw new Error('TINEYE_API_KEY is not defined');
}

function ensureApiKey(){
  if(!API_KEY){
    throw new Error('TINEYE_API_KEY is not defined');
  }
}

async function searchByUrl(imageUrl, options={}){
  ensureApiKey();
  const params = { image_url: imageUrl, ...options };
  const { data } = await axios.get(`${API_URL}/search/`, {
    params,
    headers: { 'X-API-Key': API_KEY }
  });
  return data;
}

async function searchByFile(filePath, options={}){
  ensureApiKey();
  const form = new FormData();
  form.append('image_upload', fs.createReadStream(filePath));
  const query = new URLSearchParams(options).toString();
  const { data } = await axios.post(`${API_URL}/search/?${query}`, form, {
    headers: { ...form.getHeaders(), 'X-API-Key': API_KEY }
  });
  return data;
}

function extractLinks(apiResponse){
  const links = [];
  const matches = apiResponse?.results?.matches || [];
  for(const m of matches){
    if(Array.isArray(m.backlinks)){
      for(const b of m.backlinks){
        if(b.backlink) links.push(b.backlink);
        else if(typeof b === 'string') links.push(b);
      }
    }
  }
  return Array.from(new Set(links));
}

module.exports = {
  searchByUrl,
  searchByFile,
  extractLinks
};
