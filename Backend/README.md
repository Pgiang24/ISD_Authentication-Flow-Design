# ALE Farm's Backend — Cách Connect Database

## Yêu cầu
- Node.js >= 18
- Tài khoản Supabase (https://supabase.com)

---

## Bước 1 — Chạy Schema trên Supabase

1. Vào **Supabase Dashboard** → chọn project → **SQL Editor** → **New query**
2. Copy toàn bộ file `supabase_schema.sql` → Paste → **Run**

---

## Bước 2 — Lấy Connection String

1. Supabase Dashboard → **Project Settings** ⚙️ → **Database**
2. Kéo xuống phần **"Connection string"**
3. Chọn tab **"Transaction pooler"** *(bắt buộc — không dùng Direct connection)*
4. Copy URI — có dạng:

```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

> Nếu mật khẩu có `@` → encode thành `%40`

---

## Bước 3 — Tạo file `.env`

Tạo file `.env` trong thư mục `Backend/` (cùng cấp `package.json`):

```env
DATABASE_POOLER_URL=postgresql://postgres.YOUR_REF:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
JWT_SECRET=ale_farms_secret_key_2026
PORT=3001
FRONTEND_URL=http://localhost:5173
```

---

## Bước 4 — Cài đặt và chạy

```bash
cd Backend
npm install
npm run dev
```

**Terminal phải thấy:**
```
PostgreSQL (Supabase) connected
DB time: 2026-...
```

**Test nhanh:**
```
http://localhost:3001/api/health     → { "status": "ok" }
http://localhost:3001/api/products   → danh sách sản phẩm
```

---
