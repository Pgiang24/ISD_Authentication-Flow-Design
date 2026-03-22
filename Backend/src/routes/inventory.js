import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, p.product_name AS name, p.image_url AS image,
             pv.weight, pv.price, pv.variant_id
      FROM Inventory i
      JOIN Products p ON p.product_id = i.product_id
      JOIN Product_Variants pv ON pv.product_id = i.product_id
      ORDER BY p.product_name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:productId", async (req, res) => {
  try {
    const { stock } = req.body;
    await pool.query(
      `UPDATE Inventory
       SET stock_quantity = ?, last_update = NOW()
       WHERE product_id = ?`,
      [stock, req.params.productId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.inventory_id, i.product_id, i.stock_quantity, i.last_update,
             p.product_name AS name, p.image_url AS image,
             pv.weight, pv.price, pv.variant_id
      FROM Inventory i
      JOIN Products p ON p.product_id = i.product_id
      JOIN Product_Variants pv ON pv.product_id = i.product_id
      ORDER BY p.product_name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
export default router;