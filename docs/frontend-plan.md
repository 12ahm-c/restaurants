RestoManager Frontend Team Plan

Version 1.0 – Juin 2026

---

1. Purpose

This document enables the frontend team to work in parallel with the backend while avoiding contract drift. It does not authorize new endpoints, DTO fields, Socket.IO events, business rules, dependencies, or environment variables.

Frontend source of truth:

· API shapes/events/errors: API-contract.md (RestoManager API Contract).
· Business behavior and MVP boundaries: architecture.md (Architecture technique).
· Runtime/API URLs: determined by environment (see section 3).
· Cross-team sequencing: defined in master planning.

---

2. Ownership

Frontend owns:

· restomanager-frontend/** (React + Vite + TypeScript)
· Frontend-only tests and UI documentation.
· Integration with shared types only when explicitly approved.

Frontend must not edit backend, socket server, or worker internals unless explicitly assigned.

---

3. Current Runtime

Run from repository root:

```bash
cd restomanager-frontend
npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

Backend REST base URL is:

```
http://localhost:3001/v1
```

Socket.IO URL (realtime) is:

```
http://localhost:3001   (same port with upgrade)
```

Environment variables (provided by backend team / DevOps) will override these in staging/production.

---

4. Frontend Rules

· Use the central API client shell; do not scatter raw fetch logic when a shared client method exists.
· Every async screen must include loading, error, empty, and success states.
· Mobile/tablet behavior must be considered in each visible feature slice (responsive grid, touch-friendly buttons).
· Frontend mocks must match the API contract exactly and be clearly labeled as mocks.
· Do not invent DTO fields to make UI easier.
· Do not expose secrets in VITE_*. Only intentionally public browser keys may be exposed after documentation.
· Do not import backend code.
· Do not implement hidden business rules in the UI; backend remains authoritative.

UI Component and Icon Rules

· Use shadcn/ui-style components for reusable UI primitives.
· Use lucide-react as the default icon library.
· Use react-icons only for brand/platform icons not available in lucide-react, after approval.
· Do not run shadcn generators, add UI dependencies, or change package files unless the task explicitly approves those changes.
· Keep shared components accessible: semantic HTML, keyboard support, focus states, labels, sufficient contrast.
· Keep UI primitives presentation‑focused; do not embed API contract assumptions or business rules inside generic components.

---

5. Mock Data and Backend Swap Rule

The frontend team may use mock data before backend endpoints are ready, but mocks must be shaped exactly like API-contract.md.

Mock rules

· Mock responses must use the standard envelope: { success, data, error, meta }.
· Mock success data must match the documented endpoint response shape exactly.
· Mock errors must use documented error.code, error.message, and optional error.fields shape.
· Mock IDs must be 24‑hex ObjectId strings.
· Mock timestamps must be ISO 8601 UTC strings.
· Mock amounts must be integer MRU (Mauritanian ouguiya).
· Mock phone numbers must be E.164 (+222XXXXXXXX).
· Pagination:
  · /admin/logs → cursor pagination (cursor, hasMore).
  · All other lists → offset pagination (page, limit, total).
· Mock Socket.IO events must use only names and payloads from API Contract Appendix B.
· Mock files must be clearly named or documented as mocks.

Backend swap rule

· UI code should call an adapter/API‑client layer, not hardcode mock imports inside components.
· Replacing mocks with real backend calls should require changing the data source only, not rewriting screens.
· If a needed field is missing from the API contract, stop and request contract approval instead of adding it to the mock.

---

6. Phase‑by‑Phase Frontend Work

Phase 1 — Authentication & User Management

Deliverables:

· Login screen (/login)
· Logout (clears local state, redirects)
· Authenticated layout with role‑based navigation:
  · Employee layout (server, cashier, chef, stock_manager)
  · Manager layout (manager)
  · Admin layout (owner, admin)
· Profile page (/profile) – view and edit own name/email, language
· (Admin/Manager) Employee list & creation form (/admin/employees)

Endpoints to integrate:

· POST /auth/login – authentication
· POST /auth/refresh – token refresh
· POST /auth/logout – logout
· GET /auth/me – current user
· PATCH /users/me – update profile
· GET /admin/employees – list employees (admin/owner)
· POST /admin/employees – create employee (admin/owner)
· PATCH /admin/employees/:id – update employee (admin/owner)

Parallel work allowed:

· Build static screens with contract‑matching mocks.
· Wire real API only after backend endpoints pass contract review.

Do not:

· Store refresh tokens in localStorage (use httpOnly cookie or memory).
· Hardcode role permissions beyond what user.role provides.
· Invent extra user fields.

---

Phase 2 — Point of Sale (POS) – Core Ordering

Deliverables:

· POS screen (/pos) with:
  · Product search by name or category
  · Cart (add, remove, adjust quantity, add notes/options)
  · Table selection (visual map or dropdown)
  · Customer attachment (search existing / quick create via POST /customers)
  · Order type selection (dine-in, takeaway, delivery)
  · Order submission with Idempotency‑Key
  · Order success confirmation with ticket preview
· Table map view (/tables) showing status (free, occupied, reserved, in-service)
· Table status management (open, transfer, merge)

Endpoints to integrate:

· GET /tables – list tables with status filter
· GET /tables/status – table status summary
· PATCH /tables/:id/status – change table status
· PATCH /tables/:id/transfer – transfer table (manager)
· POST /tables/merge – merge tables (manager)
· GET /menu/products – list products
· GET /menu/categories – list categories
· POST /orders – create order (Idempotency‑Key required)
· GET /orders/active – active orders for server
· POST /customers – quick customer creation
· GET /customers/search – customer search

Parallel work allowed:

· Mock POST /orders with fake stock validation.
· Build cart state (Zustand) and UI components.
· Build visual table map with draggable table elements.

Do not:

· Assume any stock validation on frontend – always rely on backend error INSUFFICIENT_STOCK.
· Implement loyalty point redemption client‑side – use POST /customers/:id/loyalty/redeem before sale.

---

Phase 3 — Kitchen & Order Management

Deliverables:

· Kitchen queue view (/kitchen) with:
  · Pending orders list (real-time updates)
  · Start preparation button (PATCH /kitchen/queue/:id/start)
  · Mark as ready button (PATCH /kitchen/queue/:id/ready)
  · Priority orders view
· Order management for servers:
  · Active orders list with status
  · Order detail view with items
  · Status update (ready → served) via PATCH /orders/:id/status
  · Order cancellation (manager) via POST /orders/:id/cancel

Endpoints to integrate:

· GET /kitchen/queue – kitchen queue with status filter
· GET /kitchen/queue/priority – priority orders
· PATCH /kitchen/queue/:id/start – start preparation
· PATCH /kitchen/queue/:id/ready – mark as ready
· GET /orders – list orders with filters
· GET /orders/:id – order detail
· PATCH /orders/:id/status – update order status
· POST /orders/:id/cancel – cancel order (manager)

Socket.IO events to handle:

· order:new – new order arrives in kitchen
· order:status-update – order status changes (notify server)

Parallel work allowed:

· Build kitchen queue UI with mock data.
· Build order list with status badges.

Do not:

· Poll for updates if Socket.IO is connected – use real-time events.
· Allow chefs to modify orders (read-only for kitchen).

---

Phase 4 — Menu & Products Management

Deliverables:

· Product list (/menu) with search, category filter, pagination
· Product detail page (/menu/products/:id) showing:
  · Product info (name, description, price, prep time)
  · Recipe ingredients (inventory items with quantities)
  · Status badge (available/unavailable/discontinued)
· (Admin) Product create / edit forms with:
  · Name, description, price, prep time, category
  · Recipe association (inventory items + quantities)
  · Status toggle
· Category management (list, create, update)

Endpoints to integrate:

· GET /menu/products – list products
· GET /menu/products/:id – product detail with recipe
· GET /menu/categories – list categories
· POST /menu/products – create product (admin)
· PUT /menu/products/:id – update product (admin)
· DELETE /menu/products/:id – soft delete product (admin)

Parallel work allowed:

· Build product search UI with mock data.
· Build recipe editor with inventory search.

Do not:

· Calculate recipe costs client-side – use backend-provided values.
· Allow status change to discontinued without backend validation.

---

Phase 5 — Inventory & Stock Management

Deliverables:

· Inventory list (/inventory) with:
  · Category filter, search, pagination
  · Below-threshold highlighting
  · Stock value summary
· Inventory detail page (/inventory/:id) with current quantity, threshold, supplier
· (Admin) Create inventory item
· (Stock Manager) Stock adjustment (PATCH /inventory/adjust) – physical inventory
· (Stock Manager) Stock replenishment (PATCH /inventory/:id/increment)
· Stock alerts view (/inventory/alerts) – critical stock items

Endpoints to integrate:

· GET /inventory – list inventory
· GET /inventory/:id – inventory detail
· GET /inventory/alerts – stock alerts
· GET /inventory/stock-value – total stock value (admin)
· POST /inventory – create inventory item (admin)
· PATCH /inventory/adjust – adjust stock (Idempotency‑Key required)
· PATCH /inventory/:id/increment – add stock

Socket.IO events to handle:

· alert:stock_critical – stock critical notification

Parallel work allowed:

· Build inventory list with mock data.
· Build adjustment form with mock validation.

Do not:

· Allow negative stock adjustments – rely on backend 422 error.
· Implement auto-adjustment logic – backend is authoritative.

---

Phase 6 — Customers & Loyalty

Deliverables:

· Customer search (/customers) by phone/name/email
· Customer detail page (/customers/:id) showing:
  · Profile info
  · Loyalty points balance
  · Total spent
  · Last purchase date
  · Purchase history (list of orders)
· Customer creation form (also accessible from POS)
· Loyalty redemption UI:
  · Points redemption form (within POS or customer page)
  · Calls POST /customers/:id/loyalty/redeem
· Loyalty ranking (manager) – /customers/loyalty/ranking

Endpoints to integrate:

· GET /customers/search – search customers
· GET /customers/:id – customer detail with loyalty info
· POST /customers – create customer
· POST /customers/:id/loyalty/redeem – redeem loyalty points

Parallel work allowed:

· Build customer search UI with mock data.
· Build loyalty redemption form.

Do not:

· Compute points or discount rates – always use backend‑returned values.
· Allow redemption exceeding available points – rely on backend validation.

---

Phase 7 — Payments & Cash Management

Deliverables:

· Payment screen in POS:
  · Payment method selection (cash, card, mobile)
  · Cash given & change calculation (for cash payments)
  · Payment submission with Idempotency‑Key
  · Order status updates to paid
· Cash drawer management:
  · Open cash drawer (POST /payments/cash-drawer/open)
  · Close cash drawer (POST /payments/cash-drawer/close)
  · Cash drawer status (GET /payments/cash-drawer)
· Payment list/history (optional)

Endpoints to integrate:

· POST /payments – record payment (Idempotency‑Key required)
· GET /payments/cash-drawer – cash drawer status
· POST /payments/cash-drawer/open – open cash drawer (manager)
· POST /payments/cash-drawer/close – close cash drawer (manager)

Socket.IO events to handle:

· sale:new – new sale notification to admin

Parallel work allowed:

· Build payment form with mock cash drawer data.
· Build cash drawer management UI.

Do not:

· Allow cash drawer operations without manager role.
· Calculate change incorrectly – use backend-provided change amount.

---

Phase 8 — Dashboards & Reports

Deliverables:

· Employee dashboard (/dashboard) – for servers/cashiers:
  · Today's orders count
  · Today's revenue
  · Today's average ticket
  · Active tables count
  · Pending kitchen orders
· Manager dashboard (/dashboard/manager) with period selector (day/week/month/year):
  · Revenue (total + comparison)
  · Orders count + average ticket
  · Top products (quantity + revenue)
  · Table utilization rate
  · Alerts count (critical, out-of-stock)
· Reports page (/reports):
  · Sales report export (PDF/Excel) – GET /reports/sales
  · Profitability report (owner) – GET /reports/profitability
  · Stock usage report (stock_manager) – GET /reports/stock-usage

Endpoints to integrate:

· GET /dashboard/employee – employee KPIs
· GET /dashboard/manager – manager KPIs
· GET /reports/sales – sales report
· GET /reports/profitability – profitability report (owner)
· GET /reports/stock-usage – stock usage report (stock_manager)

Socket.IO events to handle:

· dashboard:update – real-time dashboard updates

Parallel work allowed:

· Build dashboard cards with mock KPIs.
· Build report filters and export buttons (mocked file download).

Do not:

· Cache dashboard data longer than 5 minutes unless backend supports Cache-Control.
· Calculate margins or aggregates – display only what backend sends.
· Generate reports client-side – use backend-provided file downloads.

---

Phase 9 — Notifications (In-App + Realtime)

Deliverables:

· Notifications center (/notifications) – list of in-app notifications:
  · Pagination, read/unread filtering
  · Mark as read (PATCH /notifications/:id/read)
  · Mark all as read (PATCH /notifications/read-all)
· Real-time notification badges on:
  · POS (stock critical alerts)
  · Dashboard (alerts count)
  · Kitchen (new orders)
  · Navigation (unread notification count)
· Toast notifications for critical events (order ready, stock critical)

Endpoints to integrate:

· GET /notifications/me – list notifications
· PATCH /notifications/:id/read – mark as read
· PATCH /notifications/read-all – mark all as read

Socket.IO events to handle:

· order:new – new order notification (kitchen)
· order:status-update – order status change
· alert:stock_critical – stock critical alert
· sale:new – new sale notification

Parallel work allowed:

· Build notification UI with mock data.
· Integrate Socket.IO client (listen to events, update Zustand store).

Do not:

· Assume Socket.IO is always connected – fallback to polling REST endpoints.
· Emit any client‑side events not listed in API Contract Appendix B.

---

Phase 10 — Administration & Settings

Deliverables:

· Settings page (/admin/settings) – view and edit:
  · Loyalty points per 100 MRU
  · Loyalty redeem rate
  · Tax rate
  · Currency
  · Company name
  · WhatsApp Business phone ID
· Logs viewer (/admin/logs):
  · Cursor‑paginated (cursor, limit)
  · Filters: userId, action, from, to
  · Immutable log entries (read-only)
· Branch management (V2 – owner only)

Endpoints to integrate:

· GET /admin/settings – get settings (admin)
· PUT /admin/settings – update settings (admin)
· GET /admin/logs – view logs (admin)
· GET /admin/branches – list branches (owner – V2)

Parallel work allowed:

· Build settings form with mock data.
· Build logs table with mock cursor pagination.

Do not:

· Allow editing of sensitive system values without proper role.
· Expose log details to non-admin users.

---

Phase 11 — Production Hardening

Deliverables:

· Accessibility pass (keyboard navigation, screen reader labels).
· Responsive / mobile pass (POS works on tablet, dashboards readable on phone).
· Performance pass (lazy loading, image optimization, chunk splitting).
· Empty/error/loading consistency across all screens.
· Production build verification (npm run build).

---

7. State Management (Zustand)

We use Zustand for client state:

Store Responsibility
authStore User, tokens, isAuthenticated, login/logout actions
cartStore POS cart items, quantities, customer attached, order type, notes
tableStore Current table selection, table statuses, active tables
notificationStore In‑app notifications, unread count, real‑time alerts
uiStore Sidebar open/close, modal visibility, loading flags, toast messages

No other global stores should be created without approval.

---

8. Routing (React Router)

Folder structure:

```
src/
├── layouts/
│   ├── EmployeeLayout.tsx    (server, cashier, chef, stock_manager)
│   ├── ManagerLayout.tsx     (manager)
│   └── AdminLayout.tsx       (owner, admin)
├── modules/
│   ├── auth/
│   │   ├── login/
│   │   └── logout/
│   ├── dashboard/
│   ├── pos/
│   ├── tables/
│   ├── kitchen/
│   ├── menu/
│   │   ├── products/
│   │   └── categories/
│   ├── customers/
│   ├── inventory/
│   ├── accounting/
│   │   ├── payments/
│   │   └── cash-drawer/
│   ├── reports/
│   ├── notifications/
│   └── admin/
│       ├── employees/
│       ├── settings/
│       └── logs/
├── components/
│   ├── ui/                    (Design system)
│   ├── pos/                   (Cart, ProductSearch, Payment)
│   ├── tables/                (TableMap, TableCard)
│   ├── kitchen/               (KitchenQueue, OrderCard)
│   └── shared/                (Loading, Error, Empty, Pagination)
├── hooks/
│   ├── useAuth.ts
│   ├── useSocket.ts
│   └── useNotifications.ts
├── services/
│   ├── api-client.ts
│   ├── auth.service.ts
│   ├── orders.service.ts
│   ├── tables.service.ts
│   ├── products.service.ts
│   ├── inventory.service.ts
│   ├── customers.service.ts
│   ├── payments.service.ts
│   ├── reports.service.ts
│   └── notifications.service.ts
├── stores/
│   ├── authStore.ts
│   ├── cartStore.ts
│   ├── tableStore.ts
│   ├── notificationStore.ts
│   └── uiStore.ts
├── types/
│   └── index.ts               (Shared DTOs from API contract)
└── App.tsx
```

Route protection:

```typescript
// Route guard pattern
const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user?.role)) return <Navigate to="/dashboard" />;
  
  return children;
};
```

---

9. Frontend Definition of Done

· Uses documented API/event contracts only.
· Mock data, if used, matches API-contract.md exactly and can be swapped for backend responses through the API client/adapter layer.
· Handles loading, error, empty, and success states.
· Mobile layout reviewed.
· No backend imports.
· No secret exposure.
· npm run lint, npm run typecheck, and npm run build pass.

---

Document prepared for RestoManager frontend team – Juin 2026