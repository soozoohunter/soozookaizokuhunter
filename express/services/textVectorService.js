// express/services/textVectorService.js
const axios = require('axios');

/**
 * 透過後端 Python服務 (或 OpenAI API) 將文字轉成 embedding
 * 你可視需求修改 URL 或改用 OpenAI Embeddings
 */
async function embedTextByPython(text) {
  try {
    const resp = await axios.post('http://python-vector-service:8000/api/v1/text-embed', {
      text
    }, { timeout: 30000 });
    // resp.data 形式: { embedding: [0.123, 0.456, ...] }
    return resp.data.embedding;
  } catch (e) {
    console.error('[embedTextByPython] error =>', e.message);
    return null;
  }
}

module.exports = { embedTextByPython };
