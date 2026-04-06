// src/routes/products.js — khớp với schema v3 FINAL
import express from 'express';
import pool from '../db.js';
const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { rows: products } = await pool.query(`
      SELECT
        p.product_id,
        p.product_name,
        p.name_en,
        p.description_vi   AS description,
        p.description_en,
        p.long_description_vi  AS long_description,
        p.long_description_en,
        p.image_url,
        p.image_gallery,
        p.tag,
        p.certifications,
        p.smoking_time     AS preparation_time,
        p.is_featured      AS featured,
        p.is_active,
        p.is_combo,
        p.created_at,
        p.category_id,
        c.name_vi          AS category_name,
        c.slug             AS category_slug
      FROM products p
      LEFT JOIN categories c ON c.category_id = p.category_id
      WHERE p.is_active = TRUE
      ORDER BY p.is_featured DESC, p.product_id
    `);

    if (!products.length) return res.json([]);

    const productIds = products.map(p => p.product_id);

    const { rows: variants } = await pool.query(`
      SELECT pv.*, i.stock_quantity, i.low_stock_threshold, i.last_updated
      FROM product_variants pv
      LEFT JOIN inventory i ON i.variant_id = pv.variant_id
      WHERE pv.product_id = ANY($1) AND pv.is_active = TRUE
      ORDER BY pv.product_id, pv.variant_id
    `, [productIds]);

    const { rows: combos } = await pool.query(`
      SELECT * FROM combo_items
      WHERE combo_product_id = ANY($1)
      ORDER BY combo_product_id, sort_order
    `, [productIds]);

    const result = products.map(p => ({
      ...p,
      variants: variants
        .filter(v => v.product_id === p.product_id)
        .map(v => ({
          variant_id:          v.variant_id,
          weight:              v.weight,
          price:               Number(v.price),
          stock:               Number(v.stock_quantity) || 0,
          stock_quantity:      Number(v.stock_quantity) || 0,
          low_stock_threshold: v.low_stock_threshold || 5,
          last_updated:        v.last_updated,
          sku:                 v.sku,
        })),
      comboItems: combos.filter(c => c.combo_product_id === p.product_id),
    }));

    res.json(result);
  } catch (e) {
    console.error('GET /api/products error:', e.message);
    res.status(500).json({ error: 'Không thể tải danh sách sản phẩm' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT
        p.*,
        p.description_vi   AS description,
        p.description_en,
        p.long_description_vi  AS long_description,
        p.long_description_en,
        p.smoking_time     AS preparation_time,
        p.is_featured      AS featured,
        c.name_vi          AS category_name,
        c.slug             AS category_slug
      FROM products p
      LEFT JOIN categories c ON c.category_id = p.category_id
      WHERE p.product_id = $1 AND p.is_active = TRUE
    `, [id]);

    if (!rows.length)
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

    const product = rows[0];

    const [{ rows: variants }, { rows: combos }] = await Promise.all([
      pool.query(`
        SELECT pv.*, i.stock_quantity, i.low_stock_threshold, i.last_updated
        FROM product_variants pv
        LEFT JOIN inventory i ON i.variant_id = pv.variant_id
        WHERE pv.product_id = $1 AND pv.is_active = TRUE
        ORDER BY pv.variant_id
      `, [id]),
      pool.query(`
        SELECT * FROM combo_items WHERE combo_product_id = $1 ORDER BY sort_order
      `, [id]),
    ]);

    res.json({
      ...product,
      variants: variants.map(v => ({
        variant_id:          v.variant_id,
        weight:              v.weight,
        price:               Number(v.price),
        stock:               Number(v.stock_quantity) || 0,
        stock_quantity:      Number(v.stock_quantity) || 0,
        low_stock_threshold: v.low_stock_threshold || 5,
        last_updated:        v.last_updated,
        sku:                 v.sku,
      })),
      certifications: product.certifications || [],
      comboItems: combos,
    });
  } catch (e) {
    console.error('GET /api/products/:id error:', e.message);
    res.status(500).json({ error: 'Không thể tải sản phẩm' });
  }
});

// GET /api/products/:id/reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.*, u.full_name AS user_name
      FROM reviews r
      LEFT JOIN users u ON u.user_id = r.user_id
      WHERE r.product_id = $1 AND r.is_visible = TRUE
      ORDER BY r.created_at DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (e) {
    console.warn('GET reviews fallback:', e.message);
    res.json([]);
  }
});

// POST /api/products/:id/reviews
router.post('/:id/reviews', async (req, res) => {
  try {
    const { userId, rating, comment } = req.body;
    if (!comment?.trim())
      return res.status(400).json({ error: 'Comment is required' });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ error: 'Rating must be 1-5' });
    if (!userId)
      return res.status(401).json({ error: 'Bạn cần đăng nhập để viết đánh giá' });

    await pool.query(`
      INSERT INTO reviews (product_id, user_id, rating, comment, is_verified)
      VALUES ($1,$2,$3,$4,FALSE)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET rating=$3, comment=$4, created_at=NOW()
    `, [req.params.id, userId, rating, comment.trim()]);

    res.status(201).json({ message: 'Review submitted' });
  } catch (e) {
    console.error('POST review error:', e.message);
    res.status(500).json({ error: 'Không thể gửi review' });
  }
});

export default router;