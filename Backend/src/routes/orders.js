import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.post("/", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

const { userId, customer, phone, email, address,
        items, total, paymentMethod, channelId } = req.body;
        
    const [orderResult] = await conn.query(
      `INSERT INTO Orders (user_id, order_date, status, total_amount, channel_id)
       VALUES (?, NOW(), 'pending', ?, 1)`,
      [userId || null, total]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      await conn.query(
        `INSERT INTO Order_Items (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.productId, item.qty, item.price]
      );

      await conn.query(
        `UPDATE Inventory
         SET stock_quantity = stock_quantity - ?, last_update = NOW()
         WHERE product_id = ?`,
        [item.qty, item.productId]
      );
    }

    await conn.query(
      `INSERT INTO Payments (order_id, payment_method, payment_status, payment_date)
       VALUES (?, ?, 'pending', NOW())`,
      [orderId, paymentMethod]
    );

    await conn.commit();
    res.status(201).json({
      success: true,
      orderId,
      orderCode: `ALE-ORDER-${String(orderId).padStart(3, "0")}`,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

router.get("/", async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, u.full_name AS customer, u.phone, u.email,
             p.payment_method, p.payment_status
      FROM Orders o
      LEFT JOIN Users u ON u.user_id = o.user_id
      LEFT JOIN Payments p ON p.order_id = o.order_id
      ORDER BY o.order_date DESC
    `);

    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, pr.product_name AS name
         FROM Order_Items oi
         JOIN Products pr ON pr.product_id = oi.product_id
         WHERE oi.order_id = ?`,
        [order.order_id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query(
      "UPDATE Orders SET status = ? WHERE order_id = ?",
      [status, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;