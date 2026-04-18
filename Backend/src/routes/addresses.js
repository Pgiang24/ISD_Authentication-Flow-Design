// src/routes/addresses.js
// CRUD quản lý địa chỉ giao hàng của từng customer
import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ale_farm_secret_change_in_prod';

// Middleware: xác thực JWT
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired' });
  }
}

// GET /api/addresses — lấy tất cả địa chỉ của user hiện tại
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM user_addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at ASC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /api/addresses error:', e.message);
    res.status(500).json({ error: 'Could not load addresses.' });
  }
});

// POST /api/addresses — tạo địa chỉ mới
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { label, full_name, phone, address, district, city, ward, is_default } = req.body;

    if (!full_name?.trim()) return res.status(400).json({ error: 'Full name is required.' });
    if (!phone?.trim())     return res.status(400).json({ error: 'Phone number is required.' });
    if (!address?.trim())   return res.status(400).json({ error: 'Address is required.' });
    if (!city?.trim())      return res.status(400).json({ error: 'City is required.' });

    // Nếu là địa chỉ đầu tiên → tự động set default
    const { rows: existing } = await client.query(
      'SELECT COUNT(*)::INT AS cnt FROM user_addresses WHERE user_id = $1',
      [req.user.userId]
    );
    const makeDefault = is_default || existing[0].cnt === 0;

    // Nếu set default → bỏ default các địa chỉ khác
    if (makeDefault) {
      await client.query(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
        [req.user.userId]
      );
    }

    const { rows } = await client.query(
      `INSERT INTO user_addresses
         (user_id, label, full_name, phone, address, district, city, ward, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.user.userId,
        (label || 'Home').trim(),
        full_name.trim(), phone.trim(),
        address.trim(), (district || '').trim(),
        city.trim(), ward?.trim() || null,
        makeDefault,
      ]
    );

    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('POST /api/addresses error:', e.message);
    res.status(500).json({ error: 'Could not save address.' });
  } finally {
    client.release();
  }
});

// PUT /api/addresses/:id — cập nhật địa chỉ
router.put('/:id', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { label, full_name, phone, address, district, city, ward, is_default } = req.body;

    if (!full_name?.trim()) return res.status(400).json({ error: 'Full name is required.' });
    if (!phone?.trim())     return res.status(400).json({ error: 'Phone number is required.' });
    if (!address?.trim())   return res.status(400).json({ error: 'Address is required.' });
    if (!city?.trim())      return res.status(400).json({ error: 'City is required.' });

    // Verify ownership
    const { rows: check } = await client.query(
      'SELECT address_id FROM user_addresses WHERE address_id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    if (!check.length) return res.status(404).json({ error: 'Address not found.' });

    if (is_default) {
      await client.query(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
        [req.user.userId]
      );
    }

    const { rows } = await client.query(
      `UPDATE user_addresses
       SET label=$1, full_name=$2, phone=$3, address=$4,
           district=$5, city=$6, ward=$7, is_default=$8, updated_at=NOW()
       WHERE address_id=$9 AND user_id=$10
       RETURNING *`,
      [
        (label || 'Home').trim(),
        full_name.trim(), phone.trim(),
        address.trim(), (district || '').trim(),
        city.trim(), ward?.trim() || null,
        !!is_default,
        req.params.id, req.user.userId,
      ]
    );

    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('PUT /api/addresses error:', e.message);
    res.status(500).json({ error: 'Could not update address.' });
  } finally {
    client.release();
  }
});

// PATCH /api/addresses/:id/default — đặt địa chỉ làm mặc định
router.patch('/:id/default', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: check } = await client.query(
      'SELECT address_id FROM user_addresses WHERE address_id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    if (!check.length) return res.status(404).json({ error: 'Address not found.' });

    // Bỏ default tất cả
    await client.query(
      'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
      [req.user.userId]
    );
    // Set default cho địa chỉ được chọn
    await client.query(
      'UPDATE user_addresses SET is_default = TRUE, updated_at = NOW() WHERE address_id = $1',
      [req.params.id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Default address updated.' });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Could not set default address.' });
  } finally {
    client.release();
  }
});

// DELETE /api/addresses/:id
router.delete('/:id', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'DELETE FROM user_addresses WHERE address_id=$1 AND user_id=$2 RETURNING is_default',
      [req.params.id, req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Address not found.' });

    // Nếu xóa địa chỉ default → tự động set địa chỉ cũ nhất còn lại làm default
    if (rows[0].is_default) {
      await client.query(
        `UPDATE user_addresses SET is_default = TRUE
         WHERE address_id = (
           SELECT address_id FROM user_addresses
           WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1
         )`,
        [req.user.userId]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Address deleted.' });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Could not delete address.' });
  } finally {
    client.release();
  }
});

export default router;