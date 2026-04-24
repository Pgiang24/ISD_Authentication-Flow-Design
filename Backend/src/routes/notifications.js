// src/routes/notifications.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// ── GET /api/notifications ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        notification_id,
        type,
        title,
        message,
        order_id,
        is_read,
        created_at
      FROM notifications
      ORDER BY created_at DESC, notification_id DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (e) {
    console.error('GET /api/notifications error:', e.message);
    res.status(500).json({ error: 'Không thể tải thông báo' });
  }
});

// ── PATCH /api/notifications/read-all ───────────────────────────────────────
// PHẢI đặt TRƯỚC /:id/read để không bị match nhầm
router.patch('/read-all', async (req, res) => {
  try {
    await pool.query(`UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE`);
    res.json({ ok: true });
  } catch (e) {
    console.error('PATCH notifications read-all error:', e.message);
    res.status(500).json({ error: 'Không thể cập nhật thông báo' });
  }
});

// ── PATCH /api/notifications/:id/read ───────────────────────────────────────
router.patch('/:id/read', async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE notification_id = $1`,
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('PATCH notification read error:', e.message);
    res.status(500).json({ error: 'Không thể cập nhật thông báo' });
  }
});

export default router;