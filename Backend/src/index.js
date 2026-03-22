import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productsRouter  from "./routes/products.js";
import ordersRouter    from "./routes/orders.js";
import usersRouter     from "./routes/users.js";
import inventoryRouter from "./routes/inventory.js";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use("/api/products",  productsRouter);
app.use("/api/orders",    ordersRouter);
app.use("/api/users",     usersRouter);
app.use("/api/inventory", inventoryRouter);

app.get("/api/health", (_, res) => res.json({ status: "ok", db: "ale_farm_db" }));

// Thêm route trang chủ API
app.get("/", (_, res) => {
  res.json({
    name: "ALE Farm's API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health:    "GET /api/health",
      products:  "GET /api/products",
      orders:    "GET /api/orders",
      users:     "POST /api/users/login | POST /api/users/register",
      inventory: "GET /api/inventory",
    },
  });
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`🚀 API chạy tại http://localhost:${process.env.PORT || 3001}`);
});