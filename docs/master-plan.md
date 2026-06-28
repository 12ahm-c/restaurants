RestoManager – Master Plan

Version 1.0 – Juin 2026

---

1. Purpose

This document serves as the single source of truth for project sequencing, defining the incremental delivery strategy from MVP to full system. It ensures:

· Safe execution – Each phase delivers working, testable functionality
· Parallel work – Backend and frontend teams can progress independently
· Contract-first – API design precedes implementation
· Risk mitigation – Critical path features are delivered early

---

2. Master Timeline Overview

Phase Name Duration Dependencies
0 Foundation & Setup 1 week None
1 Authentication & User Management 2 weeks Phase 0
2 Point of Sale (Core Ordering) 3 weeks Phase 1
3 Kitchen & Order Management 2 weeks Phase 2
4 Menu & Products Management 2 weeks Phase 2
5 Inventory & Stock Management 2 weeks Phase 4
6 Customers & Loyalty 2 weeks Phase 2
7 Payments & Cash Management 2 weeks Phase 2
8 Dashboards & Reports 2 weeks Phases 2, 7
9 Notifications & Realtime 1 week Phase 3
10 Administration & Settings 1.5 weeks Phase 1
11 Production Hardening 1.5 weeks All phases

Total estimated duration: 22 weeks (~5.5 months)

---

3. Phase 0 – Foundation & Setup

Duration: 1 week
Goal: Establish project structure, infrastructure, and shared contracts

Backend Tasks

# Task Owner Deliverable
B0.1 Initialize Node.js project with TypeScript Backend package.json, tsconfig.json
B0.2 Set up project structure (modules, services, middlewares) Backend Directory scaffold
B0.3 Configure MongoDB connection + Mongoose Backend Connection utility, base models
B0.4 Configure Redis connection Backend Redis client utility
B0.5 Set up logging (Pino/Winston) Backend Logging utility
B0.6 Configure environment variables validation Backend .env.example, validation
B0.7 Set up Zod schemas for all DTOs (API Contract §14) Backend packages/shared/ schemas
B0.8 Configure ESLint + Prettier + TypeScript strict mode Backend Lint config, pre-commit hooks
B0.9 Set up BullMQ with Redis Backend Queue service
B0.10 Create health check endpoint GET /health Backend Monitoring baseline

Frontend Tasks

# Task Owner Deliverable
F0.1 Initialize React + Vite + TypeScript project Frontend package.json, vite.config.ts
F0.2 Set up project structure (modules, components, stores) Frontend Directory scaffold
F0.3 Configure TailwindCSS + shadcn/ui Frontend Design system foundation
F0.4 Set up React Router with layouts Frontend Routing scaffold
F0.5 Configure Zustand stores (auth, ui, cart, table) Frontend Store skeletons
F0.6 Create API client with interceptors (Auth, refresh, Idempotency) Frontend api-client.ts
F0.7 Set up ESLint + Prettier + TypeScript Frontend Lint config, pre-commit hooks
F0.8 Create shared UI components (Loading, Error, Empty, Pagination) Frontend Component library
F0.9 Set up Socket.IO client skeleton Frontend useSocket hook
F0.10 Configure environment variables Frontend .env.example, validation

Definition of Done – Phase 0

· Both projects build without errors (npm run build)
· Lint and typecheck pass (npm run lint, npm run typecheck)
· Health check endpoint returns { status: "ok" }
· API client can perform authenticated/unauthenticated requests
· Shared DTO types are published and imported by both teams
· .env files with all required variables exist

---

4. Phase 1 – Authentication & User Management

Duration: 2 weeks
Goal: Secure login, role-based access, and employee management
Dependencies: Phase 0 complete
Critical path: Foundation for all subsequent phases

Backend Tasks

# Task Owner Deliverable
B1.1 Create User model with bcrypt hashing (cost 12) Backend models/User.ts
B1.2 Implement POST /auth/login with rate limiting (API Contract §2.1) Backend Auth controller + service
B1.3 Implement JWT generation (access + refresh) Backend Token service
B1.4 Implement POST /auth/refresh (API Contract §2.2) Backend Refresh endpoint
B1.5 Implement POST /auth/logout with token revocation (API Contract §2.3) Backend Logout endpoint
B1.6 Implement GET /auth/me (API Contract §2.4) Backend Me endpoint
B1.7 Create Auth middleware (JWT verification) Backend middleware/auth.ts
B1.8 Create RBAC middleware requireRole() Backend middleware/rbac.ts
B1.9 Implement GET /admin/employees (API Contract §3.3) Backend Admin list endpoint
B1.10 Implement POST /admin/employees (API Contract §3.4) Backend Admin create endpoint
B1.11 Implement PATCH /admin/employees/:id (API Contract §3.5) Backend Admin update endpoint
B1.12 Create Log model (append-only) Backend models/Log.ts
B1.13 Implement login logging to logs collection Backend Audit trail
B1.14 Write integration tests for auth flows Backend Test suite

Frontend Tasks

# Task Owner Deliverable
F1.1 Create Login screen (/login) with form validation Frontend modules/auth/login/
F1.2 Integrate POST /auth/login API Frontend Login flow
F1.3 Implement token storage (memory + httpOnly cookie) Frontend Auth service
F1.4 Implement POST /auth/refresh on 401 Frontend Token refresh interceptor
F1.5 Implement POST /auth/logout Frontend Logout flow
F1.6 Create Authenticated Layout with role-based navigation (Employee/Manager/Admin) Frontend layouts/
F1.7 Create Profile page (/profile) with PATCH /users/me Frontend Profile screen
F1.8 Create Employee list page (/admin/employees) with GET /admin/employees Frontend Admin employee list
F1.9 Create Employee creation form (POST /admin/employees) Frontend Employee creation
F1.10 Create Employee edit form (PATCH /admin/employees/:id) Frontend Employee editing
F1.11 Implement ProtectedRoute guard with allowedRoles Frontend Route protection
F1.12 Write auth flow integration tests Frontend Test suite

Definition of Done – Phase 1

· Users can login with valid credentials and receive JWT
· Invalid credentials return 401 with proper error
· Rate limiting prevents brute force (5 attempts/15min)
· Refresh token rotation works (reuse detection)
· Logout revokes tokens
· Admin/Manager can view, create, update employees
· Profile page shows and updates user data
· Role-based navigation shows/hides sections appropriately
· Unauthorized access redirects to login
· Login attempts are logged in logs collection
· All auth endpoints pass contract validation
· Manual test: login as admin → create employee → login as employee

---

5. Phase 2 – Point of Sale (Core Ordering)

Duration: 3 weeks
Goal: Complete ordering flow from table selection to order submission
Dependencies: Phase 1 complete
Critical path: Core business functionality

Backend Tasks

# Task Owner Deliverable
B2.1 Create Table model (API Contract §14.2) Backend models/Table.ts
B2.2 Create Category model (API Contract §14.6) Backend models/Category.ts
B2.3 Create Product model with recipe (API Contract §14.5) Backend models/Product.ts
B2.4 Create Order model (API Contract §14.3) Backend models/Order.ts
B2.5 Create OrderItem model Backend models/OrderItem.ts
B2.6 Implement GET /tables (API Contract §4.1) Backend Table list endpoint
B2.7 Implement GET /tables/status (API Contract §4.2) Backend Table status summary
B2.8 Implement GET /tables/:id (API Contract §4.3) Backend Table detail endpoint
B2.9 Implement PATCH /tables/:id/status (API Contract §4.4) Backend Table status update
B2.10 Implement GET /menu/products (API Contract §7.1) Backend Product list endpoint
B2.11 Implement GET /menu/products/:id (API Contract §7.2) Backend Product detail endpoint
B2.12 Implement GET /menu/categories (API Contract §7.3) Backend Category list endpoint
B2.13 Implement POST /orders with idempotence (API Contract §5.1) Backend Order creation endpoint
B2.14 Implement GET /orders (API Contract §5.2) Backend Order list endpoint
B2.15 Implement GET /orders/active (API Contract §5.3) Backend Active orders endpoint
B2.16 Implement GET /orders/:id (API Contract §5.4) Backend Order detail endpoint
B2.17 Implement PATCH /orders/:id/status (API Contract §5.5) Backend Order status update
B2.18 Create Inventory model (API Contract §14.7) Backend models/Inventory.ts
B2.19 Implement stock deduction in order creation (API Contract §5.1) Backend Inventory service
B2.20 Implement Table → Order transaction (ACID) Backend Transaction service
B2.21 Implement Idempotency-Key handling Backend Idempotency middleware
B2.22 Write integration tests for complete order flow Backend Test suite

Frontend Tasks

# Task Owner Deliverable
F2.1 Create Table Map view (/tables) with visual layout Frontend modules/tables/TableMap.tsx
F2.2 Integrate GET /tables with status filter Frontend Table list
F2.3 Integrate PATCH /tables/:id/status Frontend Table status management
F2.4 Create POS screen (/pos) with product search Frontend modules/pos/
F2.5 Integrate GET /menu/products with search/filters Frontend Product search
F2.6 Integrate GET /menu/categories Frontend Category filter
F2.7 Build Cart component (add/remove/adjust quantity/notes) Frontend Cart UI
F2.8 Build Table selection (dropdown or visual map) Frontend Table selector
F2.9 Build Order type selection (dine-in/takeaway/delivery) Frontend Order type picker
F2.10 Integrate POST /orders with Idempotency-Key Frontend Order submission
F2.11 Build Order success confirmation with ticket preview Frontend Order confirmation
F2.12 Build Active Orders list for servers (GET /orders/active) Frontend Active orders view
F2.13 Build Order detail view (GET /orders/:id) Frontend Order detail
F2.14 Build Order status update (PATCH /orders/:id/status) Frontend Status buttons
F2.15 Create Cart Zustand store Frontend stores/cartStore.ts
F2.16 Create Table Zustand store Frontend stores/tableStore.ts
F2.17 Implement mobile-responsive design for POS Frontend Responsive layouts

Definition of Done – Phase 2

· Table list shows status (free/occupied/reserved)
· Table status can be changed (free ↔ occupied)
· Products can be searched and filtered by category
· Cart supports add/remove/adjust quantity/notes
· Order submission creates order with transaction
· Stock is deducted when order is created
· Table status updates to "occupied" on order creation
· Idempotency prevents duplicate orders
· Active orders list shows current orders for server
· Order detail page shows all items and status
· Order status can be updated (new → preparing → ready → served)
· Manual test: Table selection → add products → submit order → verify stock deduction
· Manual test: Idempotency-Key prevents duplicate submission

---

6. Phase 3 – Kitchen & Order Management

Duration: 2 weeks
Goal: Real-time kitchen queue management and order coordination
Dependencies: Phase 2 complete

Backend Tasks

# Task Owner Deliverable
B3.1 Create KitchenQueue model (API Contract §14.4) Backend models/KitchenQueue.ts
B3.2 Implement kitchen queue creation in order pipeline Backend Order service update
B3.3 Implement GET /kitchen/queue (API Contract §6.1) Backend Kitchen queue list
B3.4 Implement PATCH /kitchen/queue/:id/start (API Contract §6.2) Backend Start preparation
B3.5 Implement PATCH /kitchen/queue/:id/ready (API Contract §6.3) Backend Mark as ready
B3.6 Implement GET /kitchen/queue/priority (API Contract §6.4) Backend Priority queue
B3.7 Implement POST /orders/:id/cancel (API Contract §5.6) Backend Order cancellation
B3.8 Set up Socket.IO server with JWT auth Backend socket/socket.server.ts
B3.9 Implement order:new Socket.IO emission (API Contract §15.2) Backend Order socket events
B3.10 Implement order:status-update Socket.IO emission (API Contract §15.2) Backend Status socket events
B3.11 Implement Kitchen rooms (kitchen, user:{userId}) Backend Room management
B3.12 Write integration tests for kitchen queue flow Backend Test suite

Frontend Tasks

# Task Owner Deliverable
F3.1 Create Kitchen Queue view (/kitchen) Frontend modules/kitchen/
F3.2 Integrate GET /kitchen/queue with status filter Frontend Queue list
F3.3 Integrate PATCH /kitchen/queue/:id/start Frontend Start prep button
F3.4 Integrate PATCH /kitchen/queue/:id/ready Frontend Mark ready button
F3.5 Integrate GET /kitchen/queue/priority Frontend Priority orders view
F3.6 Integrate POST /orders/:id/cancel (manager) Frontend Cancel button
F3.7 Implement Socket.IO connection with JWT auth Frontend hooks/useSocket.ts
F3.8 Handle order:new event → refresh kitchen queue Frontend Real-time update
F3.9 Handle order:status-update event → update order list Frontend Real-time status update
F3.10 Build KitchenQueue card components with priority badges Frontend Queue UI
F3.11 Implement toast notifications for new orders Frontend Toast integration

Definition of Done – Phase 3

· Kitchen queue shows pending orders with priority
· Chef can start preparation (status → preparing)
· Chef can mark as ready (status → ready)
· Priority orders appear at top of queue
· Manager can cancel orders (with stock restoration)
· order:new event triggers kitchen queue refresh
· order:status-update event updates order status in real-time
· Socket.IO connection is authenticated with JWT
· Room assignment works (kitchen room for chefs)
· Manual test: Create order → chef sees it → start prep → mark ready → server sees update

---

7. Phase 4 – Menu & Products Management

Duration: 2 weeks
Goal: Full product CRUD with recipe management
Dependencies: Phase 2 complete

Backend Tasks

# Task Owner Deliverable
B4.1 Implement POST /menu/products (API Contract §7.4) Backend Product creation
B4.2 Implement PUT /menu/products/:id (API Contract §7.5) Backend Product update
B4.3 Implement DELETE /menu/products/:id (API Contract §7.6) Backend Product soft delete
B4.4 Implement product recipe validation Backend Recipe validation
B4.5 Implement product image upload (S3) Backend Image service
B4.6 Create Category CRUD endpoints Backend Category management
B4.7 Implement text index on product name for search Backend MongoDB index
B4.8 Write product management integration tests Backend Test suite

Frontend Tasks

# Task Owner Deliverable
F4.1 Create Product List page (/menu) with search and category filter Frontend modules/menu/products/
F4.2 Integrate GET /menu/products with pagination Frontend Product list
F4.3 Create Product Detail page (/menu/products/:id) with recipe Frontend Product detail
F4.4 Create Product Creation form (POST /menu/products) Frontend Product creation
F4.5 Create Product Edit form (PUT /menu/products/:id) Frontend Product editing
F4.6 Implement Product Delete (soft) DELETE /menu/products/:id Frontend Delete button
F4.7 Create Category List and management Frontend Category management
F4.8 Build Recipe editor with inventory search Frontend Recipe UI
F4.9 Implement status toggle (available/unavailable/discontinued) Frontend Status badge

Definition of Done – Phase 4

· Products can be created with name, price, category, recipe
· Products can be updated (all fields, including recipe)
· Products can be soft-deleted (status → discontinued)
· Product search works by name (text index)
· Categories can be managed (CRUD)
· Recipe shows inventory items with quantities
· Manual test: Create product with recipe → edit product → delete product

---

8. Phase 5 – Inventory & Stock Management

Duration: 2 weeks
Goal: Full inventory tracking with alerts and adjustments
Dependencies: Phase 4 complete

Backend Tasks

# Task Owner Deliverable
B5.1 Implement GET /inventory (API Contract §8.1) Backend Inventory list
B5.2 Implement GET /inventory/:id (API Contract §8.2) Backend Inventory detail
B5.3 Implement GET /inventory/alerts (API Contract §8.3) Backend Stock alerts
B5.4 Implement POST /inventory (API Contract §8.4) Backend Create inventory item
B5.5 Implement PATCH /inventory/adjust (API Contract §8.5) Backend Stock adjustment
B5.6 Implement PATCH /inventory/:id/increment (API Contract §8.6) Backend Stock replenishment
B5.7 Implement GET /inventory/stock-value (API Contract §8.7) Backend Stock value
B5.8 Implement threshold alerts (check after each movement) Backend Alert service
B5.9 Create stock_movements collection (history) Backend Movement logging
B5.10 Implement alert:stock_critical Socket.IO emission (API Contract §15.2) Backend Alert socket
B5.11 Write inventory integration tests Backend Test suite

Frontend Tasks

# Task Owner Deliverable
F5.1 Create Inventory List page (/inventory) with search/filters Frontend modules/inventory/
F5.2 Integrate GET /inventory with below-threshold highlighting Frontend Inventory list
F5.3 Create Inventory Detail page (/inventory/:id) Frontend Detail view
F5.4 Create Inventory Creation form (POST /inventory) Frontend Create inventory
F5.5 Implement Stock Adjustment (PATCH /inventory/adjust) Frontend Adjustment form
F5.6 Implement Stock Replenishment (PATCH /inventory/:id/increment) Frontend Replenish form
F5.7 Create Stock Alerts view (/inventory/alerts) Frontend Alerts page
F5.8 Integrate GET /inventory/stock-value Frontend Stock value card
F5.9 Handle alert:stock_critical Socket.IO event Frontend Toast notification
F5.10 Implement stock value summary in dashboard Frontend Dashboard card

Definition of Done – Phase 5

· Inventory list shows all items with current quantity
· Items below threshold are highlighted (red)
· Stock adjustment logs quantity changes with reason
· Stock replenishment adds quantity
· Critical alerts are generated when quantity ≤ threshold
· Alert email/notification is sent (via Socket.IO)
· Stock value is calculated correctly (quantity × unitPrice)
· Manual test: Create inventory item → adjust stock below threshold → alert triggers

---

9. Phase 6 – Customers & Loyalty

Duration: 2 weeks
Goal: Customer management and loyalty points system
Dependencies: Phase 2 complete

Backend Tasks

# Task Owner Deliverable
B6.1 Implement POST /customers (API Contract §9.1) Backend Customer creation
B6.2 Implement GET /customers/search (API Contract §9.2) Backend Customer search
B6.3 Implement GET /customers/:id (API Contract §9.3) Backend Customer detail
B6.4 Implement POST /customers/:id/loyalty/redeem (API Contract §9.4) Backend Loyalty redemption
B6.5 Implement GET /customers/loyalty/ranking (API Contract §9.5) Backend Customer ranking
B6.6 Create LoyaltyService (earn points on payment) Backend Loyalty logic
B6.7 Create loyalty_transactions collection Backend Transaction history
B6.8 Implement points calculation on order payment Backend Points earning
B6.9 Write loyalty integration tests Backend Test suite

Frontend Tasks

# Task Owner Deliverable
F6.1 Create Customer Search page (/customers) Frontend modules/customers/
F6.2 Integrate GET /customers/search by phone/name/email Frontend Search UI
F6.3 Create Customer Detail page (/customers/:id) Frontend Customer profile
F6.4 Create Customer Creation form (also accessible from POS) Frontend Create customer
F6.5 Implement Loyalty Redemption UI (POST /customers/:id/loyalty/redeem) Frontend Points redemption
F6.6 Create Loyalty Ranking page (GET /customers/loyalty/ranking) Frontend Ranking table
F6.7 Display loyalty points in POS cart (customer attached) Frontend Points display
F6.8 Show points earned confirmation after payment Frontend Points earned toast

Definition of Done – Phase 6

· Customers can be created with phone, name, email
· Customer search works by phone, name, or email
· Customer detail shows profile, points, purchase history
· Loyalty points are earned on payment (1 point per 100 MRU)
· Loyalty points can be redeemed for discounts (1 point = 1 MRU)
· Customer ranking shows top customers
· Manual test: Create customer → make purchase → verify points earned → redeem points

---

10. Phase 7 – Payments & Cash Management

Duration: 2 weeks
Goal: Complete payment processing with cash drawer management
Dependencies: Phase 2 complete

Backend Tasks

# Task Owner Deliverable
B7.1 Create Payment model Backend models/Payment.ts
B7.2 Implement POST /payments with idempotence (API Contract §10.1) Backend Payment processing
B7.3 Implement cash drawer operations (open/close) Backend Cash drawer service
B7.4 Implement GET /payments/cash-drawer (API Contract §10.2) Backend Cash drawer status
B7.5 Implement POST /payments/cash-drawer/open (API Contract §10.3) Backend Open drawer
B7.6 Implement POST /payments/cash-drawer/close (API Contract §10.4) Backend Close drawer
B7.7 Implement PaymentService.processPayment() with transaction Backend Payment service
B7.8 Implement loyalty points credit on payment Backend Loyalty integration
B7.9 Implement sale:new Socket.IO emission (API Contract §15.2) Backend Sale socket event
B7.10 Write payment integration tests Backend Test suite

Frontend Tasks

# Task Owner Deliverable
F7.1 Create Payment screen in POS Frontend modules/pos/Payment.tsx
F7.2 Integrate POST /payments with Idempotency-Key Frontend Payment submission
F7.3 Implement Payment method selection (cash/card/mobile) Frontend Method selector
F7.4 Implement Cash given & change calculation (using backend value) Frontend Cash input
F7.5 Create Cash Drawer Management page (/cash-drawer) Frontend modules/accounting/cash-drawer/
F7.6 Integrate GET /payments/cash-drawer Frontend Drawer status
F7.7 Integrate POST /payments/cash-drawer/open Frontend Open drawer
F7.8 Integrate POST /payments/cash-drawer/close Frontend Close drawer
F7.9 Handle sale:new Socket.IO event Frontend Real-time sale notification
F7.10 Show payment confirmation with change amount Frontend Payment receipt

Definition of Done – Phase 7

· Payments can be processed for orders
· Cash payments calculate change correctly
· Card and mobile payments are recorded
· Loyalty points are credited on payment
· Order status updates to "paid" on payment
· Cash drawer can be opened with opening balance
· Cash drawer can be closed with declared balance (difference shown)
· sale:new event notifies admin of new sale
· Manual test: Create order → process payment → verify order status paid → points credited

---

11. Phase 8 – Dashboards & Reports

Duration: 2 weeks
Goal: Real-time KPIs and report generation
Dependencies: Phases 2, 7 complete

Backend Tasks

# Task Owner Deliverable
B8.1 Implement GET /dashboard/employee (API Contract §11.1) Backend Employee KPIs
B8.2 Implement GET /dashboard/manager (API Contract §11.2) Backend Manager KPIs
B8.3 Implement GET /reports/sales (API Contract §11.3) Backend Sales report
B8.4 Implement GET /reports/profitability (API Contract §11.4) Backend Profitability report
B8.5 Implement GET /reports/stock-usage (API Contract §11.5) Backend Stock usage report
B8.6 Implement Redis caching for KPIs (TTL 5 min) Backend Cache service
B8.7 Implement report export (PDF via Puppeteer, Excel via exceljs) Backend Export service
B8.8 Implement dashboard:update Socket.IO emission (API Contract §15.2) Backend Dashboard updates
B8.9 Create MongoDB aggregations for sales/performance Backend Aggregation pipelines
B8.10 Write report integration tests Backend Test suite

Frontend Tasks

# Task Owner Deliverable
F8.1 Create Employee Dashboard (/dashboard) Frontend modules/dashboard/EmployeeDashboard.tsx
F8.2 Integrate GET /dashboard/employee Frontend Employee KPIs
F8.3 Create Manager Dashboard (/dashboard/manager) Frontend modules/dashboard/ManagerDashboard.tsx
F8.4 Integrate GET /dashboard/manager with period selector Frontend Manager KPIs
F8.5 Create Reports page (/reports) Frontend modules/reports/
F8.6 Integrate GET /reports/sales with date picker + export Frontend Sales report
F8.7 Integrate GET /reports/profitability with export Frontend Profitability report
F8.8 Integrate GET /reports/stock-usage with export Frontend Stock usage report
F8.9 Handle dashboard:update Socket.IO event Frontend Real-time dashboard refresh
F8.10 Build dashboard cards with loading/error/empty states Frontend Dashboard components
F8.11 Implement period selector (day/week/month/year) Frontend Time period filter

Definition of Done – Phase 8

· Employee dashboard shows today's orders, revenue, active tables
· Manager dashboard shows revenue, orders, top products, table utilization
· Period selector filters data (day/week/month/year)
· Sales report can be exported as PDF/Excel
· Profitability report shows revenue - expenses
· Stock usage report shows ingredient consumption
· Dashboard data is cached (5 min TTL)
· Manual test: View dashboard → change period → verify data changes → export report

---

12. Phase 9 – Notifications & Realtime

Duration: 1 week
Goal: Complete notification system with in-app and push
Dependencies: Phase 3 complete

Backend Tasks

# Task Owner Deliverable
B9.1 Create Notification model (API Contract §14.10) Backend models/Notification.ts
B9.2 Implement NotificationService (in-app + push) Backend Notification service
B9.3 Implement GET /notifications/me (API Contract §13.1) Backend Notification list
B9.4 Implement PATCH /notifications/:id/read (API Contract §13.2) Backend Mark read
B9.5 Implement PATCH /notifications/read-all (API Contract §13.3) Backend Mark all read
B9.6 Implement push notifications via FCM Backend FCM integration
B9.7 Implement notification generation on key events (order ready, stock critical) Backend Event → notification
B9.8 Implement WhatsApp Business API integration Backend WhatsApp service
B9.9 Implement email notifications (Nodemailer) Backend Email service
B9.10 Write notification integration tests Backend Test suite

Frontend Tasks

# Task Owner Deliverable
F9.1 Create Notifications Center (/notifications) Frontend modules/notifications/
F9.2 Integrate GET /notifications/me with pagination Frontend Notification list
F9.3 Integrate PATCH /notifications/:id/read Frontend Mark as read
F9.4 Integrate PATCH /notifications/read-all Frontend Mark all read
F9.5 Display notification badge on nav (unread count) Frontend Badge component
F9.6 Implement toast notifications for critical events Frontend Toast system
F9.7 Handle all Socket.IO events with notifications Frontend Event listeners
F9.8 Implement "mark as read" from toast Frontend Toast actions
F9.9 Store notifications in Zustand store Frontend notificationStore.ts

Definition of Done – Phase 9

· In-app notifications are created for key events (order ready, stock critical)
· Notifications list shows pagination, read/unread status
· Individual and bulk "mark as read" work
· Unread count badge updates in real-time
· Toast notifications appear for critical events
· Push notifications are sent via FCM (staging)
· Manual test: Create order → mark ready → server receives push + in-app notification

---

13. Phase 10 – Administration & Settings

Duration: 1.5 weeks
Goal: System configuration, log viewing, advanced admin
Dependencies: Phase 1 complete

Backend Tasks

# Task Owner Deliverable
B10.1 Create Settings model (system configuration) Backend models/Settings.ts
B10.2 Implement GET /admin/settings (API Contract §12.1) Backend Settings read
B10.3 Implement PUT /admin/settings (API Contract §12.2) Backend Settings update
B10.4 Implement GET /admin/logs (API Contract §12.3) Backend Log list (cursor pagination)
B10.5 Implement log filtering (userId, action, from, to) Backend Log filter
B10.6 Implement GET /admin/branches (API Contract §12.4) Backend Branches list (V2)
B10.7 Implement log immutability (append-only) Backend Log service
B10.8 Create backup service (automatic daily) Backend Backup cron job
B10.9 Write admin integration tests Backend Test suite

Frontend Tasks

# Task Owner Deliverable
F10.1 Create Settings page (/admin/settings) Frontend modules/admin/settings/
F10.2 Integrate GET /admin/settings Frontend Settings display
F10.3 Integrate PUT /admin/settings Frontend Settings editing
F10.4 Create Logs Viewer (/admin/logs) Frontend modules/admin/logs/
F10.5 Integrate GET /admin/logs with cursor pagination Frontend Logs table
F10.6 Implement log filters (userId, action, date range) Frontend Log filters
F10.7 Create Admin Layout with settings/logs navigation Frontend Admin layout
F10.8 Implement branch management (V2) Frontend Branch list

Definition of Done – Phase 10

· Settings can be viewed and updated (loyalty rates, tax, currency)
· Logs are immutable and paginated by cursor
· Logs can be filtered by user, action, date range
· Automatic daily backup runs (cron job)
· Only admin users can access settings and logs
· Manual test: Update loyalty rate → verify change in POS loyalty calculation

---

14. Phase 11 – Production Hardening

Duration: 1.5 weeks
Goal: Production readiness, performance, security, and stability
Dependencies: All phases complete

Backend Tasks

# Task Owner Deliverable
B11.1 Implement comprehensive integration tests for all modules Backend Full test suite
B11.2 Implement rate limiting on all endpoints Backend Rate limit middleware
B11.3 Implement structured logging (JSON format) Backend Logging upgrade
B11.4 Implement monitoring (health, metrics, alerting) Backend Health + metrics endpoints
B11.5 Create staging → production deployment checklist Backend Deployment docs
B11.6 Implement backup & restore scripts Backend Backup scripts
B11.7 Perform security audit (OWASP top 10) Backend Security report
B11.8 Optimize MongoDB indexes (explain plan) Backend Index optimization
B11.9 Implement connection pooling optimization Backend Performance tuning
B11.10 Set up error tracking (Sentry) Backend Error monitoring

Frontend Tasks

# Task Owner Deliverable
F11.1 Accessibility pass (keyboard navigation, screen readers, ARIA) Frontend A11y audit
F11.2 Responsive/Mobile pass (POS on tablet, dashboards on phone) Frontend Responsive audit
F11.3 Performance pass (lazy loading, image optimization, chunk splitting) Frontend Performance audit
F11.4 Empty/Error/Loading consistency across all screens Frontend State audit
F11.5 Production build verification (npm run build) Frontend Build validation
F11.6 Implement error boundary for React components Frontend Error boundaries
F11.7 Set up error tracking (Sentry) Frontend Error monitoring
F11.8 Performance monitoring (Core Web Vitals) Frontend Performance metrics

Definition of Done – Phase 11

· All integration tests pass (backend)
· Rate limiting prevents abuse on all endpoints
· Structured logging is enabled (JSON format)
· Monitoring shows health and metrics
· Deployment checklist is documented
· Backup & restore scripts are tested
· Security audit passes
· MongoDB indexes are optimized
· Accessibility audit passes (WCAG 2.1 AA)
· Mobile responsiveness is verified on all screens
· Production build passes without errors
· Error tracking is configured (Sentry)

---

15. Cross-Cutting Concerns

15.1 Testing Strategy

Phase Backend Tests Frontend Tests
Unit Services, utilities, helpers Components, hooks, stores
Integration API endpoints, database, transactions API integration, real-time events
E2E Full user flows (critical paths) Full user flows (critical paths)

Minimum test coverage target: 80%

15.2 API Contract Compliance

· Every endpoint is validated against API Contract before phase completion
· Contract violations halt delivery until resolved
· Postman/OpenAPI documentation is updated with each phase

15.3 Documentation

Document Owner Update Frequency
API Contract Backend Per phase
Architecture Backend Per phase
Deployment Guide DevOps Per environment
User Manual Product Per feature
Onboarding Guide Product MVP launch

---

16. Milestones & Go/No-Go Decisions

Milestone Phase Go/No-Go Criteria
Foundation Complete Phase 0 Build passes, contracts defined
Auth Complete Phase 1 All auth tests pass, RBAC works
MVP Core (Ordering) Phase 2 Complete order flow works end-to-end
MVP Kitchen Phase 3 Kitchen queue works with real-time updates
MVP Menu Phase 4 Product CRUD works with recipe
MVP Inventory Phase 5 Stock tracking and alerts work
MVP Payments Phase 7 Payment processing works
MVP LAUNCH Phase 7 All MVP features stable, deployed
Dashboards Phase 8 Reports and KPIs work
Notifications Phase 9 All notification channels work
Admin Phase 10 Settings and logs work
V1 LAUNCH Phase 11 All features stable, production-ready

---

17. Risk Management

Risk Impact Mitigation Phase
Database transaction issues Critical Thorough testing of order pipeline Phase 2
Real-time event reliability High Fallback to polling, connection monitoring Phase 3
Stock inconsistency Critical Transaction locks, audit trail Phase 2, 5
Payment processing errors High Idempotency, rollback mechanism Phase 7
Performance degradation High Caching, indexing, monitoring All phases
API contract drift Medium Contract-first, automated validation All phases
Third-party integration failures Medium Retry logic, graceful degradation Phase 9

---

18. Communication & Coordination

18.1 Weekly Rhythm

· Monday: Sprint planning (2h) – Review progress, plan week
· Wednesday: Architecture sync (1h) – Technical decisions, contract updates
· Friday: Demo (1h) – Show working features, collect feedback
· Friday: Retrospective (30min) – Improve process

18.2 Handoff Protocol

For each completed phase, the backend team provides:

1. Endpoint completion report – List of implemented endpoints with:
   · Method + path
   · Required roles
   · Success/error response examples
   · Test credentials
2. Contract verification – API Contract validation passes
3. Integration test results – Tests pass in CI/CD

18.3 Escalation Path

Issue Type First Contact Escalation
API contract mismatch Backend Tech Lead Product Manager
Blocking bug Team Lead Engineering Manager
Security concern Backend Tech Lead Security Lead
Scope creep Product Manager Business Owner

---

19. Success Metrics (MVP)

Metric Target Measurement
Order creation time < 2 seconds Application performance monitoring
Kitchen order visibility < 1 second (real-time) Socket.IO latency
Stock accuracy 100% (transactional) Inventory audit
Payment processing < 3 seconds Application monitoring
User satisfaction > 4.5/5 Post-launch survey
System uptime 99.9% Monitoring alerts

---

20. Appendix – Phase Dependencies Graph

```
Phase 0 (Foundation)
    │
    ├── Phase 1 (Auth & Users)
    │       │
    │       ├── Phase 2 (POS Ordering)
    │       │       │
    │       │       ├── Phase 3 (Kitchen)
    │       │       │       │
    │       │       │       └── Phase 9 (Notifications)
    │       │       │
    │       │       ├── Phase 4 (Menu)
    │       │       │       │
    │       │       │       └── Phase 5 (Inventory)
    │       │       │
    │       │       ├── Phase 6 (Customers & Loyalty)
    │       │       │
    │       │       └── Phase 7 (Payments)
    │       │               │
    │       │               └── Phase 8 (Dashboards & Reports)
    │       │
    │       └── Phase 10 (Admin & Settings)
    │
    └── Phase 11 (Production Hardening)
```

---

21. Conclusion

This master plan provides a clear, incremental, and safe path from project inception to production launch. By following the phase sequence and respecting the dependencies, both backend and frontend teams can work in parallel while ensuring:

1. Early delivery of core business value – Ordering works by Phase 2
2. Continuous integration – Each phase adds functionality without breaking existing features
3. Contract-first development – API stability across teams
4. Risk mitigation – Critical path features (orders, payments) are built early
5. Production readiness – Hardening phase ensures stability and performance

Estimated total duration: 22 weeks (~5.5 months)

The project is structured to deliver an MVP at Phase 7 (Payments) , with a full V1 release at Phase 11.

---

Document prepared for RestoManager technical team – Juin 2026