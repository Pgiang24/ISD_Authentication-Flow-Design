# ALE FARM'S — FULLSTACK SETUP GUIDE

## 1. Clone project

git clone <repo-url>

---

## 2. Setup Backend

cd backend
npm install

# tạo file .env

cp .env.example .env

# điền thông tin:

DATABASE_POOLER_URL=...
JWT_SECRET=...

npm run dev

---

## 3. Setup Frontend

cd frontend
npm install

# tạo file .env

cp .env.example .env

# sửa:

VITE_API_URL=http://localhost:3001

npm run dev

---

## 4. Test

Backend:
http://localhost:3001/api/health

Frontend:
http://localhost:5173
