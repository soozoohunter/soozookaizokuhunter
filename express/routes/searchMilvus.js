// express/routes/searchMilvus.js
// 路由：向量搜尋（Milvus）
// POST /api/search/milvus

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Vector service endpoint (Python service)
const VECTOR_SEARCH_URL = process.env.VECTOR_SERVICE_URL
  ? `${process.env.VECTOR_SERVICE_URL.replace(/\/$/, '')}/vector/search`
  : 'http://suzoo_python_vector:8000/vector/search';

/**
 * POST /api/search/milvus
 * Body: { imageBase64: string, topK?: number }
 * Forward request to Python vector service and return the response.
 */
router.post('/milvus', async (req, res) => {
  const { imageBase64, topK } = req.body || {};
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  // Prepare payload using expected keys
  const payload = {
    image_base64: imageBase64,
    top_k: topK !== undefined ? topK : 5
  };

  try {
    const response = await axios.post(VECTOR_SEARCH_URL, payload, { timeout: 30000 });
    return res.json(response.data);
  } catch (err) {
    console.error('[searchMilvus] error =>', err.message || err);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    return res.status(500).json({ error: err.message || 'vector service error' });
  }
});

module.exports = router;
