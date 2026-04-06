// src/routes/users.js — khớp schema v3 (cột "password" không phải "password_hash")
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'ale_farm_secret_change_in_prod';

// POST /api/users/register — US Sprint1
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name?.trim() || !email?.trim() || !password || !phone?.trim())
      return res.status(400).json({ error: 'Please fill in all required fields.' });

    if (!/^[a-zA-ZÀ-ỹ\s]{1,100}$/.test(name.trim()))
      return res.status(400).json({ error: 'Full name contains invalid characters' });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100)
      return res.status(400).json({ error: 'Please enter a valid email address' });

    if (!/^0[0-9]{9}$/.test(phone))
      return res.status(400).json({ error: 'Please enter a valid phone number' });

    if (password.length < 8 || password.length > 100)
      return res.status(400).json({ error: 'Password must be between 8-100 characters' });

    const { rows: existing } = await pool.query(
      'SELECT email, phone FROM users WHERE email=$1 OR phone=$2',
      [email.toLowerCase(), phone]
    );
    if (existing.some(r => r.email === email.toLowerCase()))
      return res.status(409).json({ error: 'This email is already registered' });
    if (existing.some(r => r.phone === phone))
      return res.status(409).json({ error: 'This phone number is already registered' });

    const hash = await bcrypt.hash(password, 12);

    // Schema v3: cột là "password" (không phải password_hash)
    await pool.query(
      `INSERT INTO users (full_name, email, phone, password, role)
       VALUES ($1,$2,$3,$4,'customer')`,
      [name.trim(), email.toLowerCase(), phone, hash]
    );

    res.status(201).json({
      message: 'Your account has been successfully created. Please log in.'
    });
  } catch (e) {
    console.error('Register error:', e.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/users/login — US Sprint1 (email HOẶC phone) + admin redirect
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password)
      return res.status(400).json({ error: 'Please fill in all fields' });

    // Tìm theo email HOẶC phone
    const { rows } = await pool.query(
      `SELECT * FROM users
       WHERE (email=$1 OR phone=$1) AND is_active=TRUE`,
      [email.trim().toLowerCase()]
    );

    if (!rows.length)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const user = rows[0];

    // Schema v3: cột là "password"
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Lưu session cho admin
    if (user.role === 'admin') {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await pool.query(
        `INSERT INTO admin_sessions (user_id, token_hash, expires_at)
         VALUES ($1,$2,$3)
         ON CONFLICT (token_hash) DO NOTHING`,
        [user.user_id, token, expiresAt]
      ).catch(() => {}); // admin_sessions có thể chưa tồn tại → bỏ qua
    }

    // Không trả cột password
    const { password: _, ...safeUser } = user;
    res.json({
      token,
      user: {
        id:    safeUser.user_id,
        name:  safeUser.full_name,
        email: safeUser.email,
        phone: safeUser.phone,
        role:  safeUser.role,
      }
    });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;