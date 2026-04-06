import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

const connStr = process.env.DATABASE_POOLER_URL?.trim();

if (!connStr) {
  console.error(
    "\nDATABASE_POOLER_URL chưa được set trong .env\n" +
    "    Thêm dòng này vào file .env (đặt đúng trong thư mục Backend/):\n" +
    "    DATABASE_POOLER_URL=postgresql://postgres.cinmviddxguuivdhfcjd:PhamHuongGiang2%405@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres\n"
  );
  process.exit(1);
}

export const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

pool.on("connect", () => console.log("PostgreSQL (Supabase) connected"));
pool.on("error",   (err) => console.error("Pool error:", err.message));

pool.query("SELECT NOW() AS time")
  .then((r) => console.log(`DB time: ${r.rows[0].time}`))
  .catch((e) => {
    console.error("DB connection failed:", e.message);
    if (e.message?.includes("password authentication failed")) {
      console.error("→ Mật khẩu sai. Kiểm tra lại password trong DATABASE_POOLER_URL (@ trong password phải encode thành %40)");
    }
    if (e.message?.includes("Tenant or user not found")) {
      console.error("→ Sai host pooler. Vào Supabase → Project Settings → Database → Transaction pooler → copy URI đúng");
    }
    if (["EAI_AGAIN","ENOTFOUND","ENETUNREACH"].includes(e.code)) {
      console.error("→ DNS/network lỗi. Kiểm tra host trong DATABASE_POOLER_URL có đúng dạng aws-0-ap-southeast-1.pooler.supabase.com không");
    }
  });

export default pool;