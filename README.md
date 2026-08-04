# InventoryPro — Inventory & Business Analytics System

A full-stack inventory, sales, profit/loss, pricing, and market-value tracking
system for a small business.

**Stack:** React + Tailwind (frontend) · Node.js + Express (backend) · MySQL (database) · Recharts (charts)

---

## 1. Folder structure

```
inventorypro/
├── backend/
│   ├── config/
│   │   └── db.js                  # MySQL connection pool (mysql2/promise)
│   ├── controllers/                # Business logic — one file per feature
│   │   ├── dashboardController.js
│   │   ├── productController.js
│   │   ├── stockController.js
│   │   ├── salesController.js
│   │   ├── profitLossController.js
│   │   ├── pricingController.js
│   │   └── marketValueController.js
│   ├── routes/                     # Thin — just maps HTTP verb+path -> controller fn
│   │   └── ...matching each controller
│   ├── middleware/
│   │   └── errorHandler.js         # Central try/catch + asyncHandler wrapper
│   ├── sql/
│   │   ├── schema.sql              # Run this first
│   │   ├── seed.sql                # Optional demo data
│   │   └── example_queries.sql     # Reference queries, same ones used in controllers
│   ├── .env.example
│   ├── package.json
│   └── server.js                   # App entry point
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axiosClient.js      # One shared axios instance
    │   │   └── dashboardApi.js     # Dashboard endpoint calls
    │   ├── components/             # Reusable, presentational pieces
    │   │   ├── Sidebar.jsx
    │   │   ├── Topbar.jsx
    │   │   ├── StatCard.jsx
    │   │   ├── ProfitLossChart.jsx
    │   │   ├── BusinessInsights.jsx
    │   │   ├── TopSellingProducts.jsx
    │   │   └── LowStockAlerts.jsx
    │   ├── pages/
    │   │   └── Dashboard.jsx       # Fetches data, assembles components
    │   ├── App.jsx                 # Layout shell + simple page switcher
    │   ├── main.jsx
    │   └── index.css
    ├── tailwind.config.js          # Brand color tokens live here
    ├── vite.config.js
    └── package.json
```

**Why this structure?** Controllers hold logic, routes stay thin (just wiring),
and the frontend separates "how do I talk to the API" (`api/`) from "how does
this look" (`components/`) from "how is this screen assembled" (`pages/`).
This keeps each file doing one job — the same principle called out in the
best-practices section below.

---

## 2. Getting started

### Prerequisites
- Node.js 18+
- MySQL 8.0+ running locally (or a remote instance)

### Step 1 — Create the database
```bash
mysql -u root -p < backend/sql/schema.sql
mysql -u root -p < backend/sql/seed.sql   # optional but recommended for a first run
```

### Step 2 — Backend
```bash
cd backend
cp .env.example .env      # then edit DB_PASSWORD etc. to match your MySQL setup
npm install
npm run dev                # starts on http://localhost:5000
```
Visit `http://localhost:5000/api/health` — you should see `{ "success": true, ... }`.

### Step 3 — Frontend
```bash
cd frontend
npm install
npm run dev                # starts on http://localhost:5173
```
Open `http://localhost:5173`. The dashboard fetches live data from the API;
if the backend isn't reachable yet it falls back to demo data so the screen
is never blank while you're setting things up.

### Step 4 (optional) — point the frontend at a different API URL
Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

---

## 3. API reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/dashboard/summary` | Sales/revenue/profit today + % change |
| GET | `/api/dashboard/profit-loss?range=week\|month` | Chart data |
| GET | `/api/dashboard/top-selling?limit=5` | Best sellers this week |
| GET | `/api/dashboard/low-stock` | Products at/under reorder level |
| GET | `/api/dashboard/insights` | Rule-based insight cards |
| GET/POST/PUT/DELETE | `/api/products` | Product CRUD |
| GET | `/api/stocks` | Stock levels + status |
| POST | `/api/stocks/:id/restock` | Add stock (writes audit row) |
| POST | `/api/stocks/:id/adjust` | Damaged/expired/manual adjustment |
| GET | `/api/stocks/:id/history` | Restock/adjustment history |
| GET/POST | `/api/sales` | List / record a sale (transactional, decrements stock) |
| GET | `/api/profit-loss/summary?period=today\|week\|month` | Revenue, gross profit, expenses, losses, net profit |
| GET/POST | `/api/profit-loss/expenses` | Track operating costs |
| GET | `/api/profit-loss/losses` | Damaged/expired/theft log |
| GET | `/api/pricing` | Cost/selling price + margin per product |
| GET | `/api/pricing/:id/history` | Price change history + trend (increased/decreased) |
| PUT | `/api/pricing/:id` | Update price (auto-logs to history) |
| GET | `/api/market-value` | Selling price vs market price + suggestion |
| GET | `/api/market-value/:id/trend` | Market price over time |
| POST | `/api/market-value/:id` | Record a new market price snapshot |

All responses follow `{ success: boolean, data?: ..., message?: string }`.

---

## 4. Best practices used here (and what to keep doing as you grow)

**Backend**
- **Connection pooling, not one-off connections.** `mysql2/promise`'s pool
  (`config/db.js`) reuses connections instead of opening a new one per
  request — critical once you have concurrent users.
- **Transactions for multi-step writes.** Recording a sale touches 3 tables
  (`sales`, `sale_items`, `products`, `stock_movements`) — it's wrapped in
  `beginTransaction`/`commit`/`rollback` so a crash mid-write can never leave
  stock counts out of sync with sales records.
- **Audit trails over overwrites.** Stock changes and price changes are
  *appended* to `stock_movements` / `price_history` rather than just updating
  a single field — you keep full history for free, which is what powers the
  "price increased/decreased" and trend-chart features.
- **Parameterized queries everywhere** (`?` placeholders) to prevent SQL
  injection — never string-concatenate user input into SQL.
- **Thin routes, fat controllers.** Routes only map `verb + path -> function`.
  Business logic lives in controllers so it's independently testable.
- **Centralized error handling.** `asyncHandler` + `errorHandler` middleware
  means controllers can just `throw` and get a consistent JSON error response
  — no repeated try/catch boilerplate.
- **Soft deletes.** Products are deactivated (`is_active = 0`), not deleted —
  so historical sales/reports referencing them still resolve correctly.

**Frontend**
- **One API client, one source of truth.** `axiosClient.js` centralizes the
  base URL and error unwrapping — components never touch `fetch`/`axios`
  directly.
- **Presentational components take props, not fetch data themselves.**
  `StatCard`, `ProfitLossChart`, etc. just render what they're given — only
  `Dashboard.jsx` (a page) knows about the API. This makes components reusable
  and easy to test with fake data.
- **Design tokens in one place.** Brand colors live in `tailwind.config.js`,
  not scattered as hex strings through components — change the palette once,
  it updates everywhere.

**As the system grows, consider adding**
- **Authentication** (JWT-based) — `users` table already has a `role` column
  ready for it; add a `middleware/auth.js` that verifies a token and gates
  write routes.
- **Input validation** — a library like `zod` or `express-validator` on
  request bodies before they hit controllers.
- **Pagination** on `/api/products`, `/api/sales` once the catalog grows past
  a page or two.
- **Indexes** — the schema already indexes the columns used in `WHERE`/`JOIN`
  (stock levels, dates); revisit with `EXPLAIN` as query patterns emerge.
- **A migrations tool** (e.g. `knex` or `Prisma Migrate`) instead of hand-run
  `.sql` files once more than one person is changing the schema.
- **React Router** for real page-to-page navigation instead of the simple
  `useState` page switcher in `App.jsx` (kept minimal here on purpose).
- **Testing** — `supertest` for API routes, `React Testing Library` for
  components — once behavior needs to be locked in against regressions.

---

## 5. What's built vs. what's scaffolded

**Fully wired (API + UI talk to each other):** Dashboard — stats, profit/loss
chart, business insights, top sellers, low stock alerts.

**API ready, UI not yet built:** Products, Stocks, Sales, Profit & Loss,
Pricing, Market Value, Categories, Suppliers, Users, Settings. Each has a
working controller + routes; `App.jsx` shows a placeholder screen for these
nav items. Build each page the same way `Dashboard.jsx` was built:
1. Add an `api/xApi.js` file with the endpoint calls (copy `dashboardApi.js`'s pattern).
2. Build the page in `pages/`, using existing components where they fit
   (e.g. a table like `TopSellingProducts` for a full product list).
3. Swap the placeholder block in `App.jsx` for your new page component.
