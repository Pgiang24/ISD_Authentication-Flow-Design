// src/routes/orders.js — schema v3 + notification triggers
import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ale_farm_secret_change_in_prod';

// ── Helper: insert notification ──────────────────────────────────────────────
// Schema thực tế: notification_id, user_id, type(ENUM), title, message, order_id, is_read, created_at
async function createNotification(client, { type, title, message, orderId }) {
  try {
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, order_id, is_read)
       VALUES (NULL, $1, $2, $3, $4, FALSE)`,
      [type, title, message || null, orderId || null]
    );
  } catch (e) {
    // Fire-and-forget — không để lỗi notification phá transaction chính
    console.error('createNotification error:', e.message);
  }
}

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// ── GET /api/orders ──────────────────────────────────────────────────────────
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
      const mapped = statusMap[status] || status;
      conditions.push(`o.status = $${idx++}`);
      params.push(mapped);
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
        py.payment_method, py.payment_status, py.amount AS payment_amount,
        ch.channel_name,
        COUNT(oi.order_item_id)::INT AS item_count,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'name',   p.product_name, 'qty',    oi.quantity,
            'price',  oi.unit_price,  'weight', pv.weight
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
      `SELECT COUNT(DISTINCT o.order_id)::INT AS total FROM orders o ${where}`, params
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
        paymentMethod: o.payment_method ?? 'COD',
        paymentStatus: o.payment_status ?? 'Pending',
        items:         o.items || [],
      })),
      total:        countRows[0].total,
      statusCounts: Object.fromEntries(statusCounts.map(s => [s.status.toLowerCase(), s.count])),
    });
  } catch (e) {
    console.error('GET /api/orders error:', e.message);
    res.status(500).json({ error: 'Unable to load order list. Please try again.' });
  }
});

// ── POST /api/orders ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      userId, customer, phone, email, address,
      city, district, ward, deliveryNotes,
      items, paymentMethod, channelId,
    } = req.body;

    const subtotal    = items.reduce((s, i) => s + i.price * i.qty, 0);
    const shippingFee = subtotal >= 500000 ? 0 : 30000;
    const grandTotal  = subtotal + shippingFee;

    const { rows: orderRows } = await client.query(`
      INSERT INTO orders
        (user_id, channel_id, status, total_amount,
         recipient_name, recipient_phone, address, city, district, ward, delivery_notes)
      VALUES ($1,$2,'Pending',$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING order_id
    `, [
      userId || null, channelId || 1, grandTotal,
      customer, phone, address || '',
      city || '', district || '', ward || null,
      deliveryNotes || null,
    ]);

    const { order_id } = orderRows[0];
    const orderCode = `ALE-ORDER-${String(order_id).padStart(3, '0')}`;

    // Insert items + giảm stock
    for (const item of items) {
      const { rows: vRows } = await client.query(
        `SELECT pv.variant_id, i.stock_quantity
         FROM product_variants pv
         JOIN inventory i ON i.variant_id = pv.variant_id
         WHERE pv.product_id=$1 AND pv.weight=$2 AND pv.is_active=TRUE`,
        [item.productId, item.weight]
      );
      if (!vRows.length) throw new Error(`Không tìm thấy sản phẩm: ${item.name} ${item.weight}`);
      const v = vRows[0];
      if (v.stock_quantity < item.qty) throw new Error(`Không đủ hàng: ${item.name} chỉ còn ${v.stock_quantity}`);

      await client.query(
        `INSERT INTO order_items (order_id, variant_id, quantity, unit_price) VALUES ($1,$2,$3,$4)`,
        [order_id, v.variant_id, item.qty, item.price]
      );
      await client.query(
        `UPDATE inventory SET stock_quantity = stock_quantity - $1, last_updated = NOW()
         WHERE variant_id = $2`,
        [item.qty, v.variant_id]
      );

      // Notification: tồn kho thấp (ngưỡng <= 10)
      const { rows: stockRows } = await client.query(
        `SELECT stock_quantity FROM inventory WHERE variant_id = $1`, [v.variant_id]
      );
      if (stockRows[0]?.stock_quantity <= 10) {
        await createNotification(client, {
          type:    'low_stock',
          title:   `Tồn kho thấp: ${item.name} (${item.weight})`,
          message: `Chỉ còn ${stockRows[0].stock_quantity} sản phẩm. Cần nhập thêm hàng.`,
          orderId: null,
        });
      }
    }

    // Map payment method
    let pmMethod;
    switch (paymentMethod) {
      case 'bank_transfer': case 'bank': case 'card':
        pmMethod = 'Bank Transfer'; break;
      case 'cod': default:
        pmMethod = 'COD'; break;
    }

    await client.query(
      `INSERT INTO payments (order_id, payment_method, payment_status, amount)
       VALUES ($1,$2,'Pending',$3)`,
      [order_id, pmMethod, grandTotal]
    );

    const isBankTransfer = pmMethod === 'Bank Transfer';

    // Notification: đơn hàng mới
    await createNotification(client, {
      type:    'new_order',
      title:   `Đơn hàng mới: ${orderCode}`,
      message: `${customer} · ${phone} · ${formatVND(grandTotal)} · ${isBankTransfer ? 'Chuyển khoản/QR' : 'COD'}`,
      orderId: order_id,
    });

    // Notification: chờ xác nhận thanh toán QR
    if (isBankTransfer) {
      await createNotification(client, {
        type:    'payment_received',
        title:   `Chờ xác nhận thanh toán QR: ${orderCode}`,
        message: `Khách ${customer} thanh toán qua QR/chuyển khoản ${formatVND(grandTotal)}. Cần xác nhận.`,
        orderId: order_id,
      });
    }

    await client.query('COMMIT');
    res.status(201).json({ orderCode });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('POST /api/orders error:', e.message);
    res.status(500).json({ error: e.message || 'Không thể tạo đơn hàng' });
  } finally {
    client.release();
  }
});

// ── PATCH /api/orders/:id/status ─────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { status } = req.body;
    const statusMap = {
      pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
      shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
    };
    const mapped = statusMap[status?.toLowerCase()] || status;
    const valid = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!valid.includes(mapped)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { rows } = await client.query(
      `UPDATE orders SET status=$1::order_status, updated_at=NOW()
       WHERE order_id=$2 RETURNING *`,
      [mapped, req.params.id]
    );
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    const order     = rows[0];
    const orderId   = order.order_id;
    const orderCode = `ALE-ORDER-${String(orderId).padStart(3, '0')}`;
    const name      = order.recipient_name;
    const amount    = formatVND(Number(order.total_amount));

    // Notification theo trạng thái mới
    const notifMap = {
      Confirmed:  { type: 'system',           title: `Đã xác nhận: ${orderCode}`,       message: `Đơn của ${name} đã được xác nhận.` },
      Processing: { type: 'system',           title: `Đang xử lý: ${orderCode}`,         message: `Đơn của ${name} đang được chuẩn bị.` },
      Shipped:    { type: 'system',           title: `Đang giao hàng: ${orderCode}`,     message: `Đơn của ${name} đã bàn giao vận chuyển.` },
      Delivered:  { type: 'payment_received', title: `Giao thành công: ${orderCode}`,    message: `Đơn của ${name} · ${amount} đã giao xong.` },
      Cancelled:  { type: 'order_cancelled',  title: `Đơn bị huỷ: ${orderCode}`,         message: `Đơn hàng của ${name} đã bị huỷ.` },
    };

    if (notifMap[mapped]) {
      await createNotification(client, {
        ...notifMap[mapped],
        orderId,
      });
    }

    await client.query('COMMIT');
    res.json({ message: 'Status updated', order: rows[0] });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('PATCH order status error:', e.message);
    res.status(500).json({ error: 'Could not update status' });
  } finally {
    client.release();
  }
});

// ── GET /api/orders/my ───────────────────────────────────────────────────────
router.get('/my', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  let userId;
  try { userId = jwt.verify(token, JWT_SECRET).userId; }
  catch { return res.status(401).json({ error: 'Session expired' }); }

  try {
    const { rows } = await pool.query(`
      SELECT
        o.order_id, o.status, o.total_amount, o.order_date, o.updated_at,
        o.recipient_name, o.recipient_phone,
        o.address, o.city, o.district, o.ward, o.delivery_notes,
        py.payment_method, py.payment_status,
        s.tracking_number, s.shipping_company, s.shipping_status,
        s.ship_date, s.estimated_delivery,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'name', p.product_name, 'name_en', p.name_en,
            'qty',  oi.quantity,    'price',   oi.unit_price,
            'weight', pv.weight,    'image',   p.image_url,
            'product_id', p.product_id
          ) ORDER BY oi.order_item_id
        ) FILTER (WHERE oi.order_item_id IS NOT NULL) AS items
      FROM orders o
      LEFT JOIN payments         py ON py.order_id   = o.order_id
      LEFT JOIN shipping          s ON s.order_id    = o.order_id
      LEFT JOIN order_items      oi ON oi.order_id   = o.order_id
      LEFT JOIN product_variants pv ON pv.variant_id = oi.variant_id
      LEFT JOIN products          p ON p.product_id  = pv.product_id
      WHERE o.user_id = $1
      GROUP BY o.order_id, py.payment_method, py.payment_status,
               s.tracking_number, s.shipping_company, s.shipping_status,
               s.ship_date, s.estimated_delivery
      ORDER BY o.order_date DESC
    `, [userId]);

    res.json(rows.map(o => ({
      id:                `ALE-ORDER-${String(o.order_id).padStart(3, '0')}`,
      order_id:          o.order_id,
      status:            o.status,
      total:             Number(o.total_amount),
      orderDate:         o.order_date,
      updatedAt:         o.updated_at,
      recipient:         o.recipient_name,
      phone:             o.recipient_phone,
      address:           [o.address, o.district, o.city, o.ward].filter(Boolean).join(', '),
      deliveryNotes:     o.delivery_notes,
      paymentMethod:     o.payment_method ?? 'COD',
      paymentStatus:     o.payment_status ?? 'Pending',
      tracking:          o.tracking_number,
      shippingCompany:   o.shipping_company,
      shippingStatus:    o.shipping_status,
      shipDate:          o.ship_date,
      estimatedDelivery: o.estimated_delivery,
      items:             o.items || [],
    })));
  } catch (e) {
    console.error('GET /api/orders/my error:', e.message);
    res.status(500).json({ error: 'Could not load your orders.' });
  }
});

// ── GET /api/orders/track/:code ──────────────────────────────────────────────
router.get('/track/:code', async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const numMatch = code.match(/(\d+)$/);
    if (!numMatch) return res.status(404).json({ error: 'Order not found.' });
    const orderId = parseInt(numMatch[1], 10);

    const { rows } = await pool.query(`
      SELECT
        o.order_id, o.status, o.total_amount, o.order_date, o.updated_at,
        o.recipient_name, o.recipient_phone, o.address, o.city, o.district, o.ward,
        py.payment_method, py.payment_status,
        s.tracking_number, s.shipping_company, s.shipping_status,
        s.ship_date, s.estimated_delivery,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'name', p.product_name, 'name_en', p.name_en,
            'qty',  oi.quantity,    'price',   oi.unit_price,
            'weight', pv.weight,    'image',   p.image_url
          ) ORDER BY oi.order_item_id
        ) FILTER (WHERE oi.order_item_id IS NOT NULL) AS items
      FROM orders o
      LEFT JOIN payments         py ON py.order_id   = o.order_id
      LEFT JOIN shipping          s ON s.order_id    = o.order_id
      LEFT JOIN order_items      oi ON oi.order_id   = o.order_id
      LEFT JOIN product_variants pv ON pv.variant_id = oi.variant_id
      LEFT JOIN products          p ON p.product_id  = pv.product_id
      WHERE o.order_id = $1
      GROUP BY o.order_id, py.payment_method, py.payment_status,
               s.tracking_number, s.shipping_company, s.shipping_status,
               s.ship_date, s.estimated_delivery
    `, [orderId]);

    if (!rows.length) return res.status(404).json({ error: 'Order not found.' });
    const o = rows[0];
    res.json({
      id:                `ALE-ORDER-${String(o.order_id).padStart(3, '0')}`,
      order_id:          o.order_id,
      status:            o.status,
      total:             Number(o.total_amount),
      orderDate:         o.order_date,
      updatedAt:         o.updated_at,
      recipient:         o.recipient_name,
      phone:             o.recipient_phone,
      address:           [o.address, o.district, o.city, o.ward].filter(Boolean).join(', '),
      paymentMethod:     o.payment_method ?? 'COD',
      paymentStatus:     o.payment_status ?? 'Pending',
      tracking:          o.tracking_number,
      shippingCompany:   o.shipping_company,
      shippingStatus:    o.shipping_status,
      shipDate:          o.ship_date,
      estimatedDelivery: o.estimated_delivery,
      items:             o.items || [],
    });
  } catch (e) {
    console.error('GET /api/orders/track error:', e.message);
    res.status(500).json({ error: 'Could not find order.' });
  }
});

export default router;