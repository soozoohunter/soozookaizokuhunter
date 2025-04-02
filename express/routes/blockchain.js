const express = require('express');
const router = express.Router();
const { writeToBlockchain } = require('../utils/chain');

router.post('/write', async (req, res) => {
  const { data } = req.body;
  try {
    const txHash = await writeToBlockchain(data);
    res.json({ message: '成功寫入區塊鏈', txHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
