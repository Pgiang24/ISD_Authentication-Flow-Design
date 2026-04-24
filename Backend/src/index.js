// src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productsRouter      from "./routes/products.js";
import ordersRouter        from "./routes/orders.js";
import usersRouter         from "./routes/users.js";
import inventoryRouter     from "./routes/inventory.js";
import dashboardRouter     from "./routes/dashboard.js";
import notificationsRouter from "./routes/notifications.js";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.use("/api/products",      productsRouter);
app.use("/api/orders",        ordersRouter);
app.use("/api/users",         usersRouter);
app.use("/api/inventory",     inventoryRouter);
app.use("/api/dashboard",     dashboardRouter);
app.use("/api/notifications", notificationsRouter);

app.get("/api/health", (_, res) => res.json({ status: "ok", db: "supabase-v3" }));

app.get("/", (_, res) => res.json({
  name: "ALE Farm's API v3",
  status: "running",
  endpoints: {
    health:              "GET  /api/health",
    products:            "GET  /api/products",
    product:             "GET  /api/products/:id",
    reviews:             "GET  /api/products/:id/reviews",
    orders:              "GET  /api/orders?status=&search=&sort=newest&page=1",
    createOrder:         "POST /api/orders",
    updateOrderStatus:   "PATCH /api/orders/:id/status",
    login:               "POST /api/users/login",
    register:            "POST /api/users/register",
    inventory:           "GET  /api/inventory",
    inventorySummary:    "GET  /api/inventory/summary",
    updateStock:         "PATCH /api/inventory/:variantId/stock",
    updatePrice:         "PATCH /api/inventory/:variantId/price",
    dashboardKpi:        "GET  /api/dashboard/kpi",
    dashboardRevenue:    "GET  /api/dashboard/revenue",
    dashboardCategories: "GET  /api/dashboard/sales-by-category",
    dashboardOrdersMonth:"GET  /api/dashboard/orders-per-month",
    dashboardRecent:     "GET  /api/dashboard/recent-orders",
    notifications:       "GET  /api/notifications",
    markRead:            "PATCH /api/notifications/:id/read",
    markAllRead:         "PATCH /api/notifications/read-all",
  },
}));

app.listen(process.env.PORT || 3001, () => {
  console.log(`API running at http://localhost:${process.env.PORT || 3001}`);
});