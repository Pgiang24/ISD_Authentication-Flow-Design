// src/routes/inventory.js — khớp schema v3
// Inventory tách riêng: stock ở bảng "inventory", không phải product_variants
// Views: v_inventory_summary, v_dashboard_kpi
import express from 'express';
import pool from '../db.js';
const router = express.Router();

// GET /api/inventory — US9/US10: inventory table
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM v_inventory_summary ORDER BY product_id, variant_id
    `);
    res.json(rows);
  } catch (e) {
    console.error('GET /api/inventory error:', e.message);
    res.status(500).json({ error: "Can't load inventory table. Please try again." });
  }
});

// GET /api/inventory/summary — US9: summary cards
// Total SKUs, Low Stock Alerts, Out of Stock
router.get('/summary', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::INT                                                     AS total_skus,
        COUNT(*) FILTER (WHERE stock_quantity > 0
          AND stock_quantity <= low_stock_threshold)::INT                AS low_stock_count,
        COUNT(*) FILTER (WHERE stock_quantity = 0)::INT                 AS out_of_stock_count
      FROM inventory i
      JOIN product_variants pv ON pv.variant_id = i.variant_id
      WHERE pv.is_active = TRUE
    `);
    res.json(rows[0]);
  } catch (e) {
    console.error('GET /api/inventory/summary error:', e.message);
    res.status(500).json({ error: "Couldn't load inventory summary. Please try again." });
  }
});

// PATCH /api/inventory/:variantId/stock — US10: inline edit stock
router.patch('/:variantId/stock', async (req, res) => {
  try {
    const { stock, editedBy } = req.body;
    const variantId = Number(req.params.variantId);

    if (stock === undefined || stock === null || stock === '')
      return res.status(400).json({ error: 'Stock quantity is required.' });

    const stockNum = Number(stock);
    if (!Number.isInteger(stockNum))
      return res.status(400).json({ error: 'Please enter a valid stock quantity.' });
    if (stockNum < 0)
      return res.status(400).json({ error: 'Stock cannot be negative.' });

    // Lấy giá trị cũ từ bảng inventory
    const { rows: old } = await pool.query(
      'SELECT stock_quantity FROM inventory WHERE variant_id=$1',
      [variantId]
    );
    if (!old.length)
      return res.status(404).json({ error: 'Variant not found.' });

    // Update bảng inventory (không phải product_variants)
    await pool.query(
      `UPDATE inventory
       SET stock_quantity=$1, last_updated=NOW(), updated_by=$2
       WHERE variant_id=$3`,
      [stockNum, editedBy || null, variantId]
    );

    // Trả về row mới từ view
    const { rows } = await pool.query(
      'SELECT * FROM v_inventory_summary WHERE variant_id=$1',
      [variantId]
    );
    res.json({ message: 'Stock updated', variant: rows[0] });
  } catch (e) {
    console.error('PATCH stock error:', e.message);
    res.status(500).json({ error: "Can't update stock. Please try again." });
  }
});

// PATCH /api/inventory/:variantId/price — US10: inline edit price
router.patch('/:variantId/price', async (req, res) => {
  try {
    const { price, editedBy } = req.body;
    const variantId = Number(req.params.variantId);

    if (price === undefined || price === null || price === '')
      return res.status(400).json({ error: 'Please enter a valid price.' });

    const priceNum = Number(price);
    if (isNaN(priceNum))
      return res.status(400).json({ error: 'Please enter a valid price.' });
    if (priceNum <= 0)
      return res.status(400).json({ error: 'Price must be greater than 0.' });

    const { rows: old } = await pool.query(
      'SELECT price FROM product_variants WHERE variant_id=$1',
      [variantId]
    );
    if (!old.length)
      return res.status(404).json({ error: 'Variant not found.' });

    // Price nằm ở product_variants
    await pool.query(
      'UPDATE product_variants SET price=$1 WHERE variant_id=$2',
      [priceNum, variantId]
    );

    // Cập nhật last_updated trong inventory để US15 hiện đúng
    await pool.query(
      'UPDATE inventory SET last_updated=NOW(), updated_by=$1 WHERE variant_id=$2',
      [editedBy || null, variantId]
    );

    const { rows } = await pool.query(
      'SELECT * FROM v_inventory_summary WHERE variant_id=$1',
      [variantId]
    );
    res.json({ message: 'Price updated', variant: rows[0] });
  } catch (e) {
    console.error('PATCH price error:', e.message);
    res.status(500).json({ error: "Can't change the price of the product. Please try again." });
  }
});

export default router;