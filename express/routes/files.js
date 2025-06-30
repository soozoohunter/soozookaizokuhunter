const express = require('express');
const router = express.Router();
const db = require('../models');

// GET /api/files/:fileId - return basic file info
router.get('/:fileId', async (req, res) => {
  const { fileId } = req.params;
  if (!fileId) {
    return res.status(400).json({ error: 'File ID is required.' });
  }
  try {
    const file = await db.File.findByPk(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }
    return res.json({
      id: file.id,
      title: file.title,
      filename: file.filename,
      mimeType: file.mime_type,
      userId: file.user_id
    });
  } catch (err) {
    console.error('[File Info Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve file info.' });
  }
});

module.exports = router;
