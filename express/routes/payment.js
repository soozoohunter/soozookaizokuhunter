/*************************************************************
 * express/routes/payment.js
 * - 付款API (pending -> Admin審核 -> approved)
 *************************************************************/
const express = require('express');
const router = express.Router();

const SERVICE_PRICING = {
  download_certificate: 99,
  infringement_scan: 99,
  dmca_submit: 299,
  legal_support: 9990
};

// POST /api/pay => 建立付款(待審核)
router.post('/pay', async (req, res) => {
  const db = req.db; // 來自 server.js
  const { item, price } = req.body;

  // 確認是否合法
  const cost = SERVICE_PRICING[item];
  if (!cost) {
    return res.status(400).json({ error: 'Invalid item' });
  }
  if (Number(price) !== cost) {
    return res.status(400).json({ error: 'Price mismatch' });
  }

  try {
    // 範例: 假設無登入 => userId=null
    // 實務: 可從 JWT 解碼 req.userId
    const userId = null;
    const uploadId = null;

    const result = await db.query(`
      INSERT INTO pending_payments
        (user_id, upload_id, feature, amount, status, created_at)
      VALUES ($1, $2, $3, $4, 'PENDING', NOW())
      RETURNING id
    `, [userId, uploadId, item, cost]);
    const paymentId = result.rows[0].id;

    return res.json({ success: true, paymentId });
  } catch (err) {
    console.error('[Payment] error:', err);
    return res.status(500).json({ error: 'Payment creation failed' });
  }
});

// 管理員審核 /api/admin/payments/:id/approve
router.post('/admin/payments/:id/approve', async (req, res) => {
  const db = req.db;
  const paymentId = req.params.id;

  try {
    const upd = await db.query(`
      UPDATE pending_payments
        SET status='APPROVED', approved_at=NOW()
        WHERE id=$1
        RETURNING *
    `, [paymentId]);

    if (upd.rowCount === 0) {
      return res.status(404).json({ error: 'No record found' });
    }
    const payment = upd.rows[0];

    // ★ 若要更新該使用者 isPaid=true，可加:
    // if (payment.user_id) {
    //   await db.query(`UPDATE users SET "isPaid"=true WHERE id=$1`, [payment.user_id]);
    // }

    return res.json({ success: true, payment });
  } catch (err) {
    console.error('[Payment approve] error:', err);
    return res.status(500).json({ error: 'Approve payment failed' });
  }
});

module.exports = router;
