const axios = require('axios');

/**
 * 透過後端 Python服務 (SentenceTransformers) 將文字轉成 embedding
 * 若 docker-compose 服務名稱是 python-vector-service:8000
 */
async function embedTextByPython(text) {
  try {
    const resp = await axios.post('http://python-vector-service:8000/api/v1/text-embed', {
      text
    }, { timeout: 30000 });
    // resp.data => { embedding: [....] }
    return resp.data.embedding;
  } catch (e) {
    console.error('[embedTextByPython] error =>', e.message);
    return null;
  }
}

module.exports = { embedTextByPython };
