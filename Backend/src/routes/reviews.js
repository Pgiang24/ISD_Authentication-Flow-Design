// src/routes/reviews.js
// GET  /api/products/:id/reviews        — lấy danh sách review (public)
// GET  /api/products/:id/reviews/can-review — kiểm tra user đã mua chưa (cần auth)
// POST /api/products/:id/reviews        — tạo review (cần auth + đã mua)
import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router({ mergeParams: true });
const JWT_SECRET = process.env.JWT_SECRET || 'ale_farm_secret_change_in_prod';

// Helper: xác thực token, trả về userId hoặc null
function getUserId(req) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET).userId;
  } catch {
    return null;
  }
}

// ── GET /api/products/:id/reviews ────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) return res.status(400).json({ error: 'Invalid product id' });

    const { rows } = await pool.query(`
      SELECT
        r.review_id,
        r.rating,
        r.comment,
        r.created_at,
        u.name AS user_name
      FROM reviews r
      LEFT JOIN users u ON u.user_id = r.user_id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
    `, [productId]);

    res.json(rows);
  } catch (e) {
    console.error('GET reviews error:', e.message);
    res.status(500).json({ error: 'Không thể tải đánh giá' });
  }
});

// ── GET /api/products/:id/reviews/can-review ─────────────────────────────────
// FIX BUG 2: kiểm tra user đã mua sản phẩm này chưa
// Trả về { canReview: boolean, reason?: string, alreadyReviewed: boolean }
router.get('/can-review', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.json({ canReview: false, reason: 'not_logged_in', alreadyReviewed: false });
  }

  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) return res.status(400).json({ error: 'Invalid product id' });

    // Kiểm tra đã từng review chưa
    const { rows: existingReview } = await pool.query(`
      SELECT review_id FROM reviews
      WHERE user_id = $1 AND product_id = $2
      LIMIT 1
    `, [userId, productId]);

    if (existingReview.length > 0) {
      return res.json({ canReview: false, reason: 'already_reviewed', alreadyReviewed: true });
    }

    // FIX BUG 2: kiểm tra user có đơn hàng đã giao chứa sản phẩm này
    // Chỉ cho phép review khi đơn hàng có status 'Delivered'
    const { rows: purchaseRows } = await pool.query(`
      SELECT oi.order_item_id
      FROM order_items oi
      JOIN product_variants pv ON pv.variant_id = oi.variant_id
      JOIN orders o ON o.order_id = oi.order_id
      WHERE pv.product_id = $1
        AND o.user_id     = $2
        AND o.status      = 'Delivered'
      LIMIT 1
    `, [productId, userId]);

    if (purchaseRows.length === 0) {
      return res.json({ canReview: false, reason: 'not_purchased', alreadyReviewed: false });
    }

    res.json({ canReview: true, alreadyReviewed: false });
  } catch (e) {
    console.error('GET can-review error:', e.message);
    res.status(500).json({ error: 'Không thể kiểm tra quyền đánh giá' });
  }
});

// ── POST /api/products/:id/reviews ───────────────────────────────────────────
// FIX BUG 2: xác thực đã đăng nhập + đã mua trước khi cho phép tạo review
router.post('/', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Bạn cần đăng nhập để đánh giá' });
  }

  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) return res.status(400).json({ error: 'Invalid product id' });

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Điểm đánh giá phải từ 1 đến 5' });
    }
    if (!comment?.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập nội dung đánh giá' });
    }

    // FIX BUG 2: kiểm tra đã mua sản phẩm với đơn hàng Delivered
    const { rows: purchaseRows } = await pool.query(`
      SELECT oi.order_item_id
      FROM order_items oi
      JOIN product_variants pv ON pv.variant_id = oi.variant_id
      JOIN orders o ON o.order_id = oi.order_id
      WHERE pv.product_id = $1
        AND o.user_id     = $2
        AND o.status      = 'Delivered'
      LIMIT 1
    `, [productId, userId]);

    if (purchaseRows.length === 0) {
      return res.status(403).json({
        error: 'Bạn chỉ có thể đánh giá sản phẩm đã mua và đã nhận hàng'
      });
    }

    // Kiểm tra đã review chưa (tránh duplicate)
    const { rows: existing } = await pool.query(`
      SELECT review_id FROM reviews
      WHERE user_id = $1 AND product_id = $2
    `, [userId, productId]);

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Bạn đã đánh giá sản phẩm này rồi' });
    }

    // Insert review
    const { rows } = await pool.query(`
      INSERT INTO reviews (product_id, user_id, rating, comment, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING review_id, rating, comment, created_at
    `, [productId, userId, rating, comment.trim()]);

    // Cập nhật avg rating trên bảng products
    await pool.query(`
      UPDATE products
      SET
        average_rating = (
          SELECT ROUND(AVG(rating)::numeric, 1)
          FROM reviews
          WHERE product_id = $1
        ),
        review_count = (
          SELECT COUNT(*) FROM reviews WHERE product_id = $1
        )
      WHERE product_id = $1
    `, [productId]);

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('POST review error:', e.message);
    res.status(500).json({ error: 'Không thể gửi đánh giá' });
  }
});

export default router;