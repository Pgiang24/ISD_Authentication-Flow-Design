// src/routes/orders.js — schema v3
// Fix: SELECT ... FOR UPDATE SKIP LOCKED để tránh race condition khi 2 user đặt cùng lúc
// Fix: hoàn kho khi admin cancel đơn hàng

import express from 'express';
import pool from '../db.js';
const router = express.Router();

// ── GET /api/orders ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, search, sort = 'newest', page = 1, limit = 20 } = req.query;
    const params = [];
    const conditions = [];
    let idx = 1;

    if (status && status !== 'all') {
      const statusMap = {
        pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
        shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
        Pending: 'Pending', Confirmed: 'Confirmed', Processing: 'Processing',
        Shipped: 'Shipped', Delivered: 'Delivered', Cancelled: 'Cancelled',
      };
      conditions.push(`o.status = $${idx++}`);
      params.push(statusMap[status] || status);
    }

    if (search?.trim()) {
      const s = `%${search.trim()}%`;
      conditions.push(
        `(o.order_id::TEXT ILIKE $${idx} OR o.recipient_name ILIKE $${idx} OR o.recipient_phone ILIKE $${idx})`
      );
      params.push(s);
      idx++;
    }

    const where   = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = sort === 'oldest' ? 'o.order_date ASC' : 'o.order_date DESC';
    const offset  = (Number(page) - 1) * Number(limit);

    const { rows } = await pool.query(`
      SELECT
        o.*,
        py.payment_method,
        py.payment_status,
        py.amount       AS payment_amount,
        ch.channel_name,
        COUNT(oi.order_item_id)::INT AS item_count,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'name',   p.product_name,
            'qty',    oi.quantity,
            'price',  oi.unit_price,
            'weight', pv.weight
          )
        ) FILTER (WHERE oi.order_item_id IS NOT NULL) AS items
      FROM orders o
      LEFT JOIN payments         py ON py.order_id   = o.order_id
      LEFT JOIN channels         ch ON ch.channel_id = o.channel_id
      LEFT JOIN order_items      oi ON oi.order_id   = o.order_id
      LEFT JOIN product_variants pv ON pv.variant_id = oi.variant_id
      LEFT JOIN products          p ON p.product_id  = pv.product_id
      ${where}
      GROUP BY o.order_id, py.payment_method, py.payment_status, py.amount, ch.channel_name
      ORDER BY ${orderBy}
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, Number(limit), offset]);

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(DISTINCT o.order_id)::INT AS total FROM orders o ${where}`,
      params
    );

    const { rows: statusCounts } = await pool.query(
      `SELECT status, COUNT(*)::INT AS count FROM orders GROUP BY status`
    );

    res.json({
      orders: rows.map(o => ({
        ...o,
        id:            `ALE-ORDER-${String(o.order_id).padStart(3, '0')}`,
        order_code:    `ALE-ORDER-${String(o.order_id).padStart(3, '0')}`,
        customer:      o.recipient_name,
        full_name:     o.recipient_name,
        phone:         o.recipient_phone,
        date:          o.order_date?.toISOString().split('T')[0],
        total:         Number(o.total_amount),
        status:        o.status,
        paymentMethod: o.payment_method || 'COD',
        paymentStatus: o.payment_status || 'Pending',
        items:         o.items || [],
      })),
      total:        countRows[0].total,
      statusCounts: Object.fromEntries(
        statusCounts.map(s => [s.status.toLowerCase(), s.count])
      ),
    });
  } catch (e) {
    console.error('GET /api/orders error:', e.message);
    res.status(500).json({ error: 'Unable to load order list. Please try again.' });
  }
});

// ── POST /api/orders — tạo đơn hàng ─────────────────────────────────────────
// Race condition fix:
//   SELECT ... FOR UPDATE SKIP LOCKED  → lock row inventory trong transaction
//   Nếu 2 user đặt cùng lúc:
//     - User 1 lock row, kiểm tra stock, trừ stock, commit
//     - User 2 đợi lock giải phóng, đọc stock đã bị trừ, kiểm tra lại
//     - Nếu User 2 mua quá số còn lại → throw lỗi "Không đủ hàng"
//   Kết quả: không bao giờ stock âm
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      userId, customer, phone, email, address,
      city, district, ward, deliveryNotes,
      items, paymentMethod, channelId,
    } = req.body;

    // Validate input cơ bản
    if (!customer?.trim()) throw new Error('Vui lòng nhập tên người nhận');
    if (!phone?.trim())    throw new Error('Vui lòng nhập số điện thoại');
    if (!items?.length)    throw new Error('Đơn hàng không có sản phẩm');

    const subtotal   = items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
    const shipping   = subtotal >= 500000 ? 0 : 30000;
    const grandTotal = subtotal + shipping;

    // Tạo order
    const { rows: orderRows } = await client.query(`
      INSERT INTO orders
        (user_id, channel_id, status, total_amount,
         recipient_name, recipient_phone, address, city, district, ward, delivery_notes)
      VALUES ($1,$2,'Pending',$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING order_id
    `, [
      userId || null, channelId || 1, grandTotal,
      customer.trim(), phone.trim(),
      address || '', city || '', district || '', ward || null,
      deliveryNotes || null,
    ]);

    const { order_id } = orderRows[0];
    const orderCode = `ALE-ORDER-${String(order_id).padStart(3, '0')}`;

    // ── Xử lý từng sản phẩm ──────────────────────────────────────────────────
    for (const item of items) {
      const qty = Number(item.qty);
      if (!qty || qty < 1) throw new Error(`Số lượng không hợp lệ: ${item.name}`);

      // FOR UPDATE SKIP LOCKED: lock row inventory
      // SKIP LOCKED: nếu row đang bị lock bởi transaction khác,
      // trả về rỗng ngay → xử lý như "đang bận", throw lỗi "vui lòng thử lại"
      const { rows: vRows } = await client.query(`
        SELECT
          pv.variant_id,
          i.stock_quantity
        FROM product_variants pv
        JOIN inventory i ON i.variant_id = pv.variant_id
        WHERE pv.product_id = $1
          AND pv.weight     = $2
          AND pv.is_active  = TRUE
        FOR UPDATE SKIP LOCKED
      `, [item.productId, item.weight]);

      // Không tìm thấy row → có thể do SKIP LOCKED (row đang bị lock) hoặc không tồn tại
      if (!vRows.length) {
        // Kiểm tra xem sản phẩm có tồn tại không (không lock)
        const { rows: checkRows } = await client.query(`
          SELECT pv.variant_id
          FROM product_variants pv
          WHERE pv.product_id = $1 AND pv.weight = $2 AND pv.is_active = TRUE
        `, [item.productId, item.weight]);

        if (!checkRows.length) {
          throw new Error(`Không tìm thấy sản phẩm: ${item.name} ${item.weight}`);
        }
        // Tồn tại nhưng đang bị lock → đang có transaction khác xử lý cùng lúc
        throw new Error(`Sản phẩm ${item.name} đang được xử lý bởi đơn khác. Vui lòng thử lại.`);
      }

      const { variant_id, stock_quantity } = vRows[0];

      // Kiểm tra đủ hàng SAU KHI đã lock — đây là giá trị chính xác
      if (stock_quantity < qty) {
        throw new Error(
          stock_quantity === 0
            ? `${item.name} (${item.weight}) đã hết hàng`
            : `${item.name} (${item.weight}) chỉ còn ${stock_quantity} sản phẩm, bạn đặt ${qty}`
        );
      }

      // Insert order item
      await client.query(`
        INSERT INTO order_items (order_id, variant_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
      `, [order_id, variant_id, qty, Number(item.price)]);

      // Trừ stock — an toàn vì row đã được lock
      await client.query(`
        UPDATE inventory
        SET stock_quantity = stock_quantity - $1,
            last_updated   = NOW()
        WHERE variant_id = $2
      `, [qty, variant_id]);
    }

    // Tạo bản ghi payment
    const pmMethod = paymentMethod === 'bank' ? 'Bank Transfer' : 'COD';
    await client.query(`
      INSERT INTO payments (order_id, payment_method, payment_status, amount)
      VALUES ($1, $2, 'Pending', $3)
    `, [order_id, pmMethod, grandTotal]);

    await client.query('COMMIT');
    res.status(201).json({ orderCode });

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('POST /api/orders error:', e.message);

    // Phân biệt lỗi business (400) vs lỗi hệ thống (500)
    const isBusinessError =
      e.message.includes('hết hàng') ||
      e.message.includes('chỉ còn') ||
      e.message.includes('Không tìm thấy') ||
      e.message.includes('Vui lòng nhập') ||
      e.message.includes('Không đủ hàng') ||
      e.message.includes('đang được xử lý');

    res.status(isBusinessError ? 400 : 500).json({
      error: e.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.',
    });
  } finally {
    client.release();
  }
});

// ── PATCH /api/orders/:id/status ─────────────────────────────────────────────
// Khi admin cancel đơn → hoàn kho
// Các trường hợp hoàn kho:
//   Pending/Confirmed/Processing → Cancelled: hoàn toàn bộ số lượng
//   Shipped/Delivered → Cancelled: KHÔNG hoàn (hàng đã đi/đã nhận)
const RESTORE_STOCK_STATUSES = new Set(['Pending', 'Confirmed', 'Processing']);

router.patch('/:id/status', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { status } = req.body;
    const statusMap = {
      pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
      shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
    };
    const newStatus = statusMap[status?.toLowerCase()] || status;
    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(newStatus))
      return res.status(400).json({ error: 'Invalid status' });

    // Lấy đơn hàng hiện tại (lock để tránh race condition khi admin nhiều người)
    const { rows: orderRows } = await client.query(
      `SELECT order_id, status FROM orders WHERE order_id = $1 FOR UPDATE`,
      [req.params.id]
    );
    if (!orderRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentStatus = orderRows[0].status;

    // Không cho phép đổi từ Cancelled/Delivered sang trạng thái khác
    if (currentStatus === 'Cancelled')
      return res.status(400).json({ error: 'Không thể thay đổi trạng thái đơn đã huỷ' });
    if (currentStatus === 'Delivered' && newStatus !== 'Delivered')
      return res.status(400).json({ error: 'Không thể thay đổi trạng thái đơn đã giao' });

    // Hoàn kho khi cancel đơn đang ở trạng thái chưa giao
    if (newStatus === 'Cancelled' && RESTORE_STOCK_STATUSES.has(currentStatus)) {
      // Lấy tất cả items của đơn
      const { rows: orderItems } = await client.query(`
        SELECT oi.variant_id, oi.quantity
        FROM order_items oi
        WHERE oi.order_id = $1
      `, [req.params.id]);

      // Hoàn từng sản phẩm về kho
      for (const oi of orderItems) {
        await client.query(`
          UPDATE inventory
          SET stock_quantity = stock_quantity + $1,
              last_updated   = NOW()
          WHERE variant_id = $2
        `, [oi.quantity, oi.variant_id]);
      }

      console.log(`[orders] Hoàn kho đơn #${req.params.id}: ${orderItems.length} variants`);
    }

    // Cập nhật status
    const { rows } = await client.query(
      `UPDATE orders SET status = $1::order_status, updated_at = NOW()
       WHERE order_id = $2 RETURNING *`,
      [newStatus, req.params.id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Status updated', order: rows[0] });

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('PATCH order status error:', e.message);
    res.status(500).json({ error: 'Could not update status. Please try again.' });
  } finally {
    client.release();
  }
});

export default router;