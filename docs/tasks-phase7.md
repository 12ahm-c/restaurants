# RestoManager – Phase 7 & Phase 8 Task Breakdown

**Version 1.0 – June 2026**

---

## Phase 7 – Payments & Cash Management

**Duration:** 2 weeks  
**Goal:** Complete payment processing with cash drawer management  
**Dependencies:** Phase 2 complete

### Backend Tasks

#### B7.1 Payment Model
- **Owner:** Backend  
- **Deliverable:** Payment model (API Contract §14.9)
- **Details:**
  - Create `apps/backend/src/models/Payment.ts`
  - Fields:
    - orderId: ObjectId (ref Order, required)
    - amount: Number (required, min 0)
    - method: enum['cash', 'card', 'mobile'] (required)
    - status: enum['pending', 'completed', 'failed', 'refunded'] (default: 'pending')
    - transactionId: String (for card/mobile reference)
    - cashGiven: Number (required if method = 'cash')
    - changeAmount: Number (computed)
    - userId: ObjectId (ref User, required)
    - branchId: ObjectId (ref Branch)
    - createdAt: Date
    - updatedAt: Date
  - Create indexes: orderId, status, createdAt

#### B7.2 CashDrawer Model
- **Owner:** Backend  
- **Deliverable:** Cash drawer tracking model
- **Details:**
  - Create `apps/backend/src/models/CashDrawer.ts`
  - Fields:
    - branchId: ObjectId (ref Branch, required)
    - status: enum['open', 'closed'] (required)
    - openingBalance: Number (required when opening)
    - currentBalance: Number
    - closingBalance: Number
    - cashSales: Number (default: 0)
    - cardSales: Number (default: 0)
    - cashOut: Number (default: 0)
    - openedBy: ObjectId (ref User)
    - closedBy: ObjectId (ref User)
    - openedAt: Date
    - closedAt: Date
    - difference: Number (computed on close)
  - Create indexes: branchId, status

#### B7.3 Payment Module Setup
- **Owner:** Backend  
- **Deliverable:** Payment module structure (controller, service, routes)
- **Details:**
  - Create `apps/backend/src/modules/payments/` directory
  - Implement `payment.service.ts` with payment processing logic
  - Implement `payment.controller.ts` with HTTP handlers
  - Implement `payment.routes.ts` with Express routes
  - Wire routes in `server.ts`

#### B7.4 POST /payments
- **Owner:** Backend  
- **Deliverable:** Payment processing endpoint (API Contract §10.1)
- **Details:**
  - Requires `cashier`, `manager`, or `owner` role
  - Idempotency-Key required
  - Request: `{ orderId, amount, method, cashGiven? }`
  - Validate order exists and is not already paid
  - Validate amount matches order total
  - For cash: calculate changeAmount = cashGiven - amount
  - Create payment record
  - Update order.status = 'paid', order.paid = true
  - Update cash drawer if open (add to cashSales/cardSales)
  - Emit `sale:new` to admin room
  - Return: `{ paymentId, changeAmount, orderStatus, loyaltyPointsEarned }`

#### B7.5 GET /payments/cash-drawer
- **Owner:** Backend  
- **Deliverable:** Cash drawer status endpoint (API Contract §10.2)
- **Details:**
  - Requires `manager` or `owner` role
  - Return current open drawer for branch
  - Response: `{ openingBalance, currentBalance, cashSales, cardSales, cashOut }`

#### B7.6 POST /payments/cash-drawer/open
- **Owner:** Backend  
- **Deliverable:** Open cash drawer endpoint (API Contract §10.3)
- **Details:**
  - Requires `manager` or `owner` role
  - Request: `{ openingBalance }`
  - Validate no drawer already open for branch
  - Create new CashDrawer record with status='open'
  - Return cash drawer state

#### B7.7 POST /payments/cash-drawer/close
- **Owner:** Backend  
- **Deliverable:** Close cash drawer endpoint (API Contract §10.4)
- **Details:**
  - Requires `manager` or `owner` role
  - Request: `{ declaredBalance }`
  - Calculate expectedBalance = openingBalance + cashSales - cashOut
  - Calculate difference = declaredBalance - expectedBalance
  - Update drawer status='closed', set closingBalance, difference
  - Return: `{ expectedBalance, declaredBalance, difference, cashSales }`

#### B7.8 PaymentService.processPayment()
- **Owner:** Backend  
- **Deliverable:** Transactional payment processing
- **Details:**
  - Use MongoDB session for ACID transaction
  - Create payment record
  - Update order status
  - Update cash drawer balances
  - Commit transaction
  - On failure: abort transaction, return error

#### B7.9 Loyalty Points Integration
- **Owner:** Backend  
- **Deliverable:** Points earning on payment
- **Details:**
  - After successful payment, check if order has customerId
  - If yes, call `customerService.earnLoyaltyPoints()`
  - Calculate points: floor(amount / 100)
  - Include `loyaltyPointsEarned` in payment response

#### B7.10 Socket.IO Sale Emission
- **Owner:** Backend  
- **Deliverable:** Sale notification socket event
- **Details:**
  - Emit `sale:new` to admin room after payment
  - Payload: `{ orderId, totalAmount, cashierName, timestamp }`
  - Integrate with existing emitters.ts

#### B7.11 Integration Tests for Payments
- **Owner:** Backend  
- **Deliverable:** Test suite for payment module
- **Details:**
  - Test POST /payments (cash, card, mobile)
  - Test POST /payments with idempotency
  - Test GET /payments/cash-drawer
  - Test POST /payments/cash-drawer/open
  - Test POST /payments/cash-drawer/close
  - Test payment validation (amount mismatch, already paid)
  - Test cash change calculation
  - Test loyalty points earning

---

### Frontend Tasks

#### F7.1 Payment Screen in POS
- **Owner:** Frontend  
- **Deliverable:** Payment component in POS
- **Details:**
  - Create `apps/frontend/src/modules/pos/Payment.tsx`
  - Display order summary (items, total)
  - Payment method selector (cash, card, mobile)
  - For cash: input cashGiven, show changeAmount
  - Submit payment button
  - Success confirmation with change display

#### F7.2 Payment Service
- **Owner:** Frontend  
- **Deliverable:** API service for payments
- **Details:**
  - Create `apps/frontend/src/services/payment.service.ts`
  - Methods:
    - `processPayment(data)` - POST /payments
    - `getCashDrawer()` - GET /payments/cash-drawer
    - `openCashDrawer(data)` - POST /payments/cash-drawer/open
    - `closeCashDrawer(data)` - POST /payments/cash-drawer/close
  - Idempotency-Key generation for processPayment

#### F7.3 Payment Store
- **Owner:** Frontend  
- **Deliverable:** Zustand store for payment state
- **Details:**
  - Create `apps/frontend/src/stores/paymentStore.ts`
  - State: `currentPayment`, `cashDrawer`, `isProcessing`
  - Actions:
    - `processPayment(data)`
    - `fetchCashDrawer()`
    - `openCashDrawer(openingBalance)`
    - `closeCashDrawer(declaredBalance)`
  - Selector: `changeAmount`, `canCloseDrawer`

#### F7.4 Cash Drawer Management Page
- **Owner:** Frontend  
- **Deliverable:** Cash drawer page at `/cash-drawer`
- **Details:**
  - Create `apps/frontend/src/modules/accounting/cash-drawer/CashDrawerPage.tsx`
  - Display current drawer status (open/closed)
  - Show openingBalance, currentBalance, cashSales, cardSales
  - Open drawer button (if closed)
  - Close drawer button (if open) with declaredBalance input
  - Show difference on close

#### F7.5 Payment Confirmation Modal
- **Owner:** Frontend  
- **Deliverable:** Payment success component
- **Details:**
  - Create `apps/frontend/src/components/pos/PaymentConfirmation.tsx`
  - Display payment success message
  - Show change amount (for cash)
  - Show loyalty points earned
  - Print receipt button (optional)
  - Close and return to POS

#### F7.6 Handle sale:new Socket Event
- **Owner:** Frontend  
- **Deliverable:** Real-time sale notifications
- **Details:**
  - In CashDrawerPage, listen for `sale:new` event
  - Update cash drawer balances in real-time
  - Show toast notification for new sale

#### F7.7 Navigation Updates
- **Owner:** Frontend  
- **Deliverable:** Updated navigation for payments
- **Details:**
  - Update EmployeeLayout sidebar:
    - Add "Cash Drawer" link for manager/owner
  - Update POS to include payment flow
  - Add payment section in navigation

---

### Definition of Done – Phase 7

- [ ] Payments can be processed for orders (cash, card, mobile)
- [ ] Cash payments calculate change correctly
- [ ] Card and mobile payments are recorded
- [ ] Loyalty points are credited on payment
- [ ] Order status updates to "paid" on payment
- [ ] Cash drawer can be opened with opening balance
- [ ] Cash drawer can be closed with declared balance (difference shown)
- [ ] sale:new event notifies admin of new sale
- [ ] Idempotency prevents duplicate payments
- [ ] Manual test: Create order → process payment → verify order status paid → points credited
- [ ] Manual test: Open drawer → process cash sales → close drawer → verify difference
- [ ] All integration tests pass

---

## Phase 8 – Dashboards & Reports

**Duration:** 2 weeks  
**Goal:** Real-time KPIs and report generation  
**Dependencies:** Phases 2, 7 complete

### Backend Tasks

#### B8.1 Dashboard Module Setup
- **Owner:** Backend  
- **Deliverable:** Dashboard module structure
- **Details:**
  - Create `apps/backend/src/modules/dashboard/` directory
  - Implement `dashboard.service.ts` with KPI calculation logic
  - Implement `dashboard.controller.ts` with HTTP handlers
  - Implement `dashboard.routes.ts` with Express routes
  - Wire routes in `server.ts`

#### B8.2 Reports Module Setup
- **Owner:** Backend  
- **Deliverable:** Reports module structure
- **Details:**
  - Create `apps/backend/src/modules/reports/` directory
  - Implement `reports.service.ts` with report generation logic
  - Implement `reports.controller.ts` with HTTP handlers
  - Implement `reports.routes.ts` with Express routes
  - Wire routes in `server.ts`

#### B8.3 GET /dashboard/employee
- **Owner:** Backend  
- **Deliverable:** Employee KPIs endpoint (API Contract §11.1)
- **Details:**
  - Requires authentication
  - Calculate today's orders count
  - Calculate today's revenue
  - Calculate today's average ticket
  - Count active tables
  - Count pending kitchen orders
  - Cache result for 5 minutes
  - Response: `{ todayOrdersCount, todayRevenue, todayAverageTicket, activeTables, pendingKitchenOrders }`

#### B8.4 GET /dashboard/manager
- **Owner:** Backend  
- **Deliverable:** Manager KPIs endpoint (API Contract §11.2)
- **Details:**
  - Requires `manager` or `owner` role
  - Query param: `period` (day, week, month, year)
  - Calculate revenue total and comparison with previous period
  - Calculate orders count and average ticket
  - Get top products by quantity and revenue
  - Calculate table utilization rate
  - Count alerts (critical, out of stock)
  - Cache result for 5 minutes
  - Response: `{ revenue, orders, topProducts, tableUtilization, alertsCount }`

#### B8.5 GET /reports/sales
- **Owner:** Backend  
- **Deliverable:** Sales report endpoint (API Contract §11.3)
- **Details:**
  - Requires `manager` or `owner` role
  - Query params: `from`, `to`, `format` (pdf, xlsx)
  - Aggregate sales data by date
  - Include: total sales, orders count, average ticket, payment method breakdown
  - Generate report file (PDF or Excel)
  - Return file with Content-Disposition: attachment

#### B8.6 GET /reports/profitability
- **Owner:** Backend  
- **Deliverable:** Profitability report endpoint (API Contract §11.4)
- **Details:**
  - Requires `owner` role
  - Query params: `from`, `to`, `format`
  - Calculate revenue from payments
  - Calculate expenses from inventory (stock purchases)
  - Calculate profit = revenue - expenses
  - Generate report file
  - Return file with Content-Disposition: attachment

#### B8.7 GET /reports/stock-usage
- **Owner:** Backend  
- **Deliverable:** Stock usage report endpoint (API Contract §11.5)
- **Details:**
  - Requires `stock_manager`, `manager`, or `owner` role
  - Query params: `from`, `to`, `format`
  - Aggregate stock movements by type (replenishment, deduction, waste)
  - Calculate consumption per inventory item
  - Identify waste patterns
  - Generate report file
  - Return file with Content-Disposition: attachment

#### B8.8 Redis Caching for KPIs
- **Owner:** Backend  
- **Deliverable:** Cache service for dashboard data
- **Details:**
  - Create `apps/backend/src/services/cache.service.ts`
  - Implement `getCached(key)` and `setCached(key, value, ttl)`
  - Use for dashboard endpoints (TTL: 5 minutes)
  - Invalidate cache on relevant data changes
  - Handle Redis errors gracefully

#### B8.9 Report Export Service
- **Owner:** Backend  
- **Deliverable:** PDF and Excel generation
- **Details:**
  - Create `apps/backend/src/services/export.service.ts`
  - Implement PDF generation (using Puppeteer or pdfkit)
  - Implement Excel generation (using exceljs)
  - Create report templates
  - Handle file streaming for large reports

#### B8.10 MongoDB Aggregations
- **Owner:** Backend  
- **Deliverable:** Aggregation pipelines for reports
- **Details:**
  - Sales aggregation by date range
  - Revenue aggregation with comparison
  - Top products aggregation
  - Stock usage aggregation
  - Profitability calculation aggregation

#### B8.11 Socket.IO Dashboard Emission
- **Owner:** Backend  
- **Deliverable:** Dashboard update socket events
- **Details:**
  - Emit `dashboard:update` to admin room
  - Trigger on: new payment, order status change, stock alert
  - Payload: `{ dailyOrdersCount, dailyRevenue, activeTables, pendingKitchenOrders, alertsCount }`
  - Integrate with existing emitters.ts

#### B8.12 Integration Tests for Dashboard & Reports
- **Owner:** Backend  
- **Deliverable:** Test suite for dashboard and reports
- **Details:**
  - Test GET /dashboard/employee
  - Test GET /dashboard/manager with periods
  - Test GET /reports/sales with date range
  - Test GET /reports/profitability
  - Test GET /reports/stock-usage
  - Test report export (PDF, Excel)
  - Test caching behavior

---

### Frontend Tasks

#### F8.1 Employee Dashboard
- **Owner:** Frontend  
- **Deliverable:** Employee dashboard at `/dashboard`
- **Details:**
  - Create `apps/frontend/src/modules/dashboard/EmployeeDashboard.tsx`
  - Display today's orders count
  - Display today's revenue
  - Display average ticket
  - Display active tables count
  - Display pending kitchen orders
  - Auto-refresh every 30 seconds

#### F8.2 Manager Dashboard
- **Owner:** Frontend  
- **Deliverable:** Manager dashboard at `/dashboard/manager`
- **Details:**
  - Create `apps/frontend/src/modules/dashboard/ManagerDashboard.tsx`
  - Period selector (day, week, month, year)
  - Revenue card with comparison to previous period
  - Orders count and average ticket
  - Top products list
  - Table utilization chart
  - Alerts count (critical, out of stock)

#### F8.3 Dashboard Service
- **Owner:** Frontend  
- **Deliverable:** API service for dashboard
- **Details:**
  - Create `apps/frontend/src/services/dashboard.service.ts`
  - Methods:
    - `getEmployeeDashboard()` - GET /dashboard/employee
    - `getManagerDashboard(period)` - GET /dashboard/manager

#### F8.4 Dashboard Store
- **Owner:** Frontend  
- **Deliverable:** Zustand store for dashboard state
- **Details:**
  - Create `apps/frontend/src/stores/dashboardStore.ts`
  - State: `employeeKPIs`, `managerKPIs`, `selectedPeriod`, `isLoading`
  - Actions:
    - `fetchEmployeeKPIs()`
    - `fetchManagerKPIs(period)`
    - `setPeriod(period)`
  - Selector: `revenueChange`, `topProducts`

#### F8.5 Reports Page
- **Owner:** Frontend  
- **Deliverable:** Reports page at `/reports`
- **Details:**
  - Create `apps/frontend/src/modules/reports/ReportsPage.tsx`
  - Report type selector (sales, profitability, stock-usage)
  - Date range picker (from, to)
  - Export format selector (PDF, Excel)
  - Export button with loading state

#### F8.6 Reports Service
- **Owner:** Frontend  
- **Deliverable:** API service for reports
- **Details:**
  - Create `apps/frontend/src/services/reports.service.ts`
  - Methods:
    - `getSalesReport(from, to, format)` - GET /reports/sales
    - `getProfitabilityReport(from, to, format)` - GET /reports/profitability
    - `getStockUsageReport(from, to, format)` - GET /reports/stock-usage
  - Handle file download

#### F8.7 Dashboard Cards Component
- **Owner:** Frontend  
- **Deliverable:** Reusable dashboard card components
- **Details:**
  - Create `apps/frontend/src/components/dashboard/KPICard.tsx`
  - Props: title, value, change, icon, loading
  - Display with loading skeleton
  - Show change percentage (positive/negative)

#### F8.8 Period Selector Component
- **Owner:** Frontend  
- **Deliverable:** Time period filter component
- **Details:**
  - Create `apps/frontend/src/components/dashboard/PeriodSelector.tsx`
  - Options: day, week, month, year
  - Highlight selected period
  - onChange callback

#### F8.9 Handle dashboard:update Socket Event
- **Owner:** Frontend  
- **Deliverable:** Real-time dashboard updates
- **Details:**
  - In EmployeeDashboard and ManagerDashboard, listen for `dashboard:update` event
  - Update KPIs in real-time
  - Show subtle animation on value change

#### F8.10 Navigation Updates
- **Owner:** Frontend  
- **Deliverable:** Updated navigation for dashboards and reports
- **Details:**
  - Update EmployeeLayout sidebar:
    - Add "Dashboard" link for all roles
    - Add "Reports" link for manager/owner
  - Update AdminLayout if needed

---

### Definition of Done – Phase 8

- [ ] Employee dashboard shows today's orders, revenue, active tables
- [ ] Manager dashboard shows revenue, orders, top products, table utilization
- [ ] Period selector filters data (day/week/month/year)
- [ ] Sales report can be exported as PDF/Excel
- [ ] Profitability report shows revenue - expenses
- [ ] Stock usage report shows ingredient consumption
- [ ] Dashboard data is cached (5 min TTL)
- [ ] dashboard:update event refreshes dashboard in real-time
- [ ] Manual test: View dashboard → change period → verify data changes → export report
- [ ] All integration tests pass

---

## Summary

### Phase 7 Total Tasks
- **Backend:** 11 tasks (B7.1 - B7.11)
- **Frontend:** 7 tasks (F7.1 - F7.7)

### Phase 8 Total Tasks
- **Backend:** 12 tasks (B8.1 - B8.12)
- **Frontend:** 10 tasks (F8.1 - F8.10)

### Combined Total
- **Backend:** 23 tasks
- **Frontend:** 17 tasks
- **Total:** 40 tasks

### Estimated Effort
- Phase 7: ~2 weeks (10 working days)
- Phase 8: ~2 weeks (10 working days)
- Total: ~4 weeks (20 working days)

### Dependencies
- Phase 7 depends on: Phase 2 (Orders for payment association)
- Phase 8 depends on: Phase 2 (Orders data) and Phase 7 (Payment data)
- Phase 7 and Phase 8 can be developed sequentially
- Phase 8 reports require payment data from Phase 7

---

**Document prepared for RestoManager technical team – June 2026**
