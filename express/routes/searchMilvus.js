const express = require('express');
const router = express.Router();
const axios = require('axios');

const VECTOR_SERVICE_URL = process.env.PYTHON_VECTOR_SERVICE_URL || 'http://suzoo_python_vector:8000';

/**
 * POST /api/search/milvus
 * Body: { imageBase64: string, topK?: number }
 * Forward request to python vector service and return response.
 */
router.post('/search/milvus', async (req, res) => {
  const { imageBase64, topK } = req.body || {};
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 required' });
  }

  const url = `${VECTOR_SERVICE_URL}/vector/search`;
  try {
    const resp = await axios.post(url, {
      image_base64: imageBase64,
      top_k: topK || 5
    });
    return res.json(resp.data);
  } catch (err) {
    console.error('[searchMilvus] error =>', err.message || err);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    return res.status(500).json({ error: 'vector service error' });
  }
});

module.exports = router;
