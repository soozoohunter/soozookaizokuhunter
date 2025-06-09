const express = require('express');
const axios = require('axios');

const router = express.Router();

const VECTOR_SEARCH_URL = process.env.VECTOR_SEARCH_URL || 'http://suzoo_python_vector:8000/vector/search';

router.post('/milvus', async (req, res) => {
  try {
    const { imageBase64, topK } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const payload = { imageBase64 };
    if (topK !== undefined) payload.topK = topK;

    const response = await axios.post(VECTOR_SEARCH_URL, payload, { timeout: 30000 });
    return res.json(response.data);
  } catch (err) {
    console.error('[searchMilvus] error:', err.message);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
