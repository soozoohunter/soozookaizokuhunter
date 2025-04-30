// 假設你在 Node.js 裡要透過 axios 呼叫 Python 端
// 例如 Python 裡有個 /api/v1/text-embed => 回傳 [float,...] 向量
const axios = require('axios');

async function embedTextByPython(text) {
  try {
    const resp = await axios.post('http://python-vector-service:8000/api/v1/text-embed', {
      text
    }, { timeout: 30000 });
    // resp.data => { embedding:[0.123, 0.456, ...] }
    return resp.data.embedding;
  } catch(e) {
    console.error('[embedTextByPython] error =>', e.message);
    return null;
  }
}

module.exports = { embedTextByPython };
