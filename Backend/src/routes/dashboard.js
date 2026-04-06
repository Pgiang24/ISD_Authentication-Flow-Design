// src/routes/dashboard.js — Sprint 2 US1-US5
// Dùng các views đã có: v_dashboard_kpi, v_revenue_overview,
//   v_sales_by_category, v_orders_per_month, v_recent_orders
import express from 'express';
import pool from '../db.js';
const router = express.Router();

// GET /api/dashboard/kpi — US1: Summary cards
router.get('/kpi', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_dashboard_kpi');
    res.json(rows[0]);
  } catch (e) {
    console.error('GET /api/dashboard/kpi error:', e.message);
    res.status(500).json({ error: "Couldn't load dashboard summary." });
  }
});

// GET /api/dashboard/revenue — US2: Revenue Overview chart
router.get('/revenue', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_revenue_overview ORDER BY month');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Couldn't load revenue data." });
  }
});

// GET /api/dashboard/sales-by-category — US3: Donut chart
router.get('/sales-by-category', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_sales_by_category');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Couldn't load category sales data." });
  }
});

// GET /api/dashboard/orders-per-month — US4: Bar chart
router.get('/orders-per-month', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_orders_per_month ORDER BY month');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Couldn't load orders per month data." });
  }
});

// GET /api/dashboard/recent-orders — US5: Recent Orders widget
router.get('/recent-orders', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const { rows } = await pool.query(
      'SELECT * FROM v_recent_orders LIMIT $1',
      [limit]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Couldn't load recent orders." });
  }
});

export default router;