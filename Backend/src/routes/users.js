import { Router } from "express";
import { pool } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("=== LOGIN DEBUG ===");
    console.log("Email:", email);
    console.log("Password nhận:", password);
    console.log("Password length:", password?.length);

    const [rows] = await pool.query(
      "SELECT * FROM Users WHERE email = ?",
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Email không tồn tại" });

    console.log("DB password prefix:", user.password?.substring(0, 10));

    const isHashed = user.password.startsWith("$2");
    console.log("isHashed:", isHashed);

    let match;
    if (isHashed) {
      match = await bcrypt.compare(password, user.password);
    } else {
      match = password === user.password;
    }

    console.log("match:", match);

    if (!match) return res.status(401).json({ error: "Sai mật khẩu" });

    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id:    String(user.user_id),
        name:  user.full_name,
        email: user.email,
        role:  user.role,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    console.log("=== REGISTER DEBUG ===");
    console.log("Name:", name, "Email:", email);

    const [existing] = await pool.query(
      "SELECT user_id FROM Users WHERE email = ?",
      [email]
    );
    if (existing[0]) {
      return res.status(400).json({ error: "Email đã được sử dụng" });
    }

    const hashed = await bcrypt.hash(password, 10);
    console.log("Hashed prefix:", hashed.substring(0, 10));

    const [result] = await pool.query(
      `INSERT INTO Users (full_name, email, phone, password, role)
       VALUES (?, ?, ?, ?, 'customer')`,
      [name, email, phone || null, hashed]
    );

    console.log("Registered userId:", result.insertId);
    res.status(201).json({ success: true, userId: result.insertId });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;