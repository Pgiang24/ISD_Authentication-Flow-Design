# ALE Farm's

## Overview

ALE Farm's is a full-stack web application designed to support both online sales and internal operations for a food retail business. The system follows a separated frontend and backend architecture and serves two main user groups:

- Customers: browse products, register an account, sign in, add items to cart, place orders, and review order history.
- Administrators: monitor business metrics, manage orders, and update inventory and pricing.

The product is intended to provide a practical operational platform where core workflows such as user authentication, checkout, order handling, and inventory management are available through a web interface instead of manual processing.

## Current Functional Scope

### Customer-facing features

- Account registration and sign-in using email or phone number.
- Client-side session persistence using JWT.
- Product catalog and product detail pages.
- Cart management and checkout flow.
- Order creation with basic payment options such as cash on delivery and bank transfer.
- Order history for authenticated users.
- Supporting pages such as about, contact, and account settings.

### Admin features

- Role-based access for `admin` users.
- Dashboard with operational metrics such as new orders, pending orders, low-stock alerts, and revenue.
- Order management with filtering, search, and status updates.
- Inventory management by product variant, including inline updates for stock quantity and price.

## System Architecture

### Frontend

- React 18
- Vite
- React Router
- Tailwind CSS
- Radix UI
- i18next
- Recharts

The frontend is implemented as a single-page application. It is responsible for rendering both customer and admin interfaces, handling client-side authentication state, calling backend APIs, and enforcing route-level access based on the current user role.

### Backend

- Node.js
- Express
- PostgreSQL
- Supabase pooler
- `jsonwebtoken`
- `bcryptjs`

The backend exposes a REST API for authentication, products, orders, inventory, and dashboard reporting. Data is stored in PostgreSQL, with several aggregated database views used to support dashboard and inventory-related queries.

## Repository Structure

```text
.
├── Backend/    Express API and PostgreSQL integration
├── Frontend/   React/Vite application
├── dev_overview.md
├── pm_overview.md
└── Readme.md
```

## Running the Project

### Prerequisites

- Node.js 18 or higher
- NPM
- PostgreSQL via Supabase pooler, or another database compatible with the current schema

### 1. Run the backend

Create `Backend/.env`:

```env
DATABASE_POOLER_URL=postgresql://...
JWT_SECRET=your_secret_key
PORT=3001
FRONTEND_URL=http://localhost:5173
```

Install dependencies and start the server:

```bash
cd Backend
npm install
npm run dev
```

The backend runs by default at `http://localhost:3001`.

### 2. Run the frontend

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
```

Install dependencies and start the application:

```bash
cd Frontend
npm install
npm run dev
```

The frontend runs by default at `http://localhost:5173`.

## Main API Endpoints

The application currently relies on the following core endpoints:

- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/orders`
- `POST /api/orders`
- `PATCH /api/orders/:id/status`
- `GET /api/orders/my`
- `GET /api/inventory`
- `PATCH /api/inventory/:variantId/stock`
- `PATCH /api/inventory/:variantId/price`
- `GET /api/dashboard/kpi`
- `GET /api/dashboard/revenue`
- `GET /api/dashboard/sales-by-category`
- `GET /api/dashboard/orders-per-month`
- `GET /api/dashboard/recent-orders`

## Operational Notes

- The frontend and backend are deployed separately, so `VITE_API_URL` and `FRONTEND_URL` must be configured correctly to avoid CORS issues or incorrect environment targeting.
- The current authentication approach stores JWT tokens on the client side. This is acceptable for development and internal demonstration, but a production deployment should review token storage strategy, session lifecycle, and browser-side security controls.
- Some dashboard and inventory features depend on database views. Any new environment must include the required schema objects and supporting views for those features to work correctly.

## Intended Use

This repository is suitable for:

- Building a sales website with both customer and admin areas.
- Supporting practical authentication, checkout, order, and inventory workflows.
- Serving as a base for future extensions such as address management, integrated payment flows, deeper reporting, or broader product administration.
