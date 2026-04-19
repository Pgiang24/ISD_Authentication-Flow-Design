// src/routes/notifications.js
import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ale_farm_secret_change_in_prod';

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Session expired' }); }
}

// GET /api/notifications — lấy tất cả notif của user (admin)
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT notification_id, type, title, message, reference_id, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [req.user.userId]);
    res.json(rows);
  } catch (e) {
    console.error('GET /api/notifications error:', e.message);
    res.status(500).json({ error: 'Could not load notifications.' });
  }
});

// PATCH /api/notifications/:id/read — đánh dấu 1 notif là đã đọc
router.patch('/:id/read', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE notification_id = $1 AND user_id = $2`,
      [req.params.id, req.user.userId]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not update notification.' });
  }
});

// PATCH /api/notifications/read-all — đánh dấu tất cả là đã đọc
router.patch('/read-all', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
      [req.user.userId]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not update notifications.' });
  }
});

export default router;