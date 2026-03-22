import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET tất cả sản phẩm
router.get("/", async (req, res) => {
  try {
    const [products] = await pool.query(
      "SELECT * FROM Products ORDER BY created_at DESC"
    );

    for (const product of products) {
      const [variants] = await pool.query(
        `SELECT pv.variant_id, pv.product_id, pv.weight, pv.price,
                COALESCE(MAX(i.stock_quantity), 0) AS stock_quantity
         FROM Product_Variants pv
         LEFT JOIN Inventory i ON i.product_id = pv.product_id
         WHERE pv.product_id = ?
         GROUP BY pv.variant_id, pv.product_id, pv.weight, pv.price`,
        [product.product_id]
      );
      product.variants = variants;

      const [comboItems] = await pool.query(
        "SELECT * FROM Combo_Items WHERE combo_product_id = ?",
        [product.product_id]
      );
      if (comboItems.length > 0) {
        product.isCombo = true;
        product.comboItems = comboItems;
      }
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET 1 sản phẩm theo id
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Products WHERE product_id = ?",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Không tìm thấy sản phẩm" });

    const product = rows[0];

    const [variants] = await pool.query(
      `SELECT pv.variant_id, pv.product_id, pv.weight, pv.price,
              COALESCE(MAX(i.stock_quantity), 0) AS stock_quantity
       FROM Product_Variants pv
       LEFT JOIN Inventory i ON i.product_id = pv.product_id
       WHERE pv.product_id = ?
       GROUP BY pv.variant_id, pv.product_id, pv.weight, pv.price`,
      [product.product_id]
    );
    product.variants = variants;

    const [comboItems] = await pool.query(
      "SELECT * FROM Combo_Items WHERE combo_product_id = ?",
      [product.product_id]
    );
    if (comboItems.length > 0) {
      product.isCombo = true;
      product.comboItems = comboItems;
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/:id/reviews", async (req, res) => {
  try {
    const [reviews] = await pool.query(
      `SELECT r.*, u.full_name AS user_name
       FROM Reviews r
       LEFT JOIN Users u ON u.user_id = r.user_id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/reviews", async (req, res) => {
  try {
    const { userId, rating, comment } = req.body;
    const [result] = await pool.query(
      `INSERT INTO Reviews (product_id, user_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [req.params.id, userId || null, rating, comment]
    );
    res.status(201).json({ success: true, reviewId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
export default router;