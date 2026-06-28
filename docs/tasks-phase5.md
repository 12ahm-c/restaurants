# RestoManager – Phase 5 & Phase 6 Task Breakdown

**Version 1.0 – June 2026**

---

## Phase 5 – Inventory & Stock Management

**Duration:** 2 weeks  
**Goal:** Full inventory tracking with alerts and adjustments  
**Dependencies:** Phase 4 complete

### Backend Tasks

#### B5.1 Inventory Module Setup
- **Owner:** Backend  
- **Deliverable:** Inventory module structure (controller, service, routes)
- **Details:** 
  - Create `apps/backend/src/modules/inventory/` directory
  - Implement `inventory.service.ts` with stock management logic
  - Implement `inventory.controller.ts` with HTTP handlers
  - Implement `inventory.routes.ts` with Express routes
  - Wire routes in `server.ts`

#### B5.2 GET /inventory
- **Owner:** Backend  
- **Deliverable:** Inventory list endpoint (API Contract §8.1)
- **Details:**
  - Query params: `category`, `belowThreshold`, `search`, `page`, `limit`
  - Response: List of InventoryDTO with pagination
  - Filter by category name
  - Filter items below threshold (quantity ≤ threshold)
  - Text search on name
  - Sort by name, quantity, or createdAt

#### B5.3 GET /inventory/:id
- **Owner:** Backend  
- **Deliverable:** Inventory detail endpoint (API Contract §8.2)
- **Details:**
  - Return single InventoryDTO
  - Include supplier information
  - Include expiry date if available
  - Include last updated timestamp

#### B5.4 GET /inventory/alerts
- **Owner:** Backend  
- **Deliverable:** Stock alerts endpoint (API Contract §8.3)
- **Details:**
  - Return items where quantity ≤ threshold
  - Include alert type: 'critical' (quantity ≤ threshold/2) or 'low' (quantity ≤ threshold)
  - Sort by urgency (critical first)
  - Include calculated shortage amount

#### B5.5 POST /inventory
- **Owner:** Backend  
- **Deliverable:** Create inventory item endpoint (API Contract §8.4)
- **Details:**
  - Required fields: name, category, unit, quantity, threshold, unitPrice
  - Optional: supplier, expiryDate
  - Validate quantity ≥ 0
  - Validate threshold ≥ 0
  - Validate unitPrice > 0
  - Check for duplicate name (optional, warn)
  - Return InventoryDTO (201)

#### B5.6 PATCH /inventory/adjust
- **Owner:** Backend  
- **Deliverable:** Stock adjustment endpoint (API Contract §8.5)
- **Details:**
  - Requires `stock_manager` or `owner` role
  - Idempotency-Key required
  - Request: `{ inventoryId, quantity, reason }`
  - Set quantity to new value (physical inventory count)
  - Log adjustment in stock_movements collection
  - Calculate and log difference from previous quantity
  - Check threshold after adjustment
  - Emit alert:stock_critical if below threshold
  - Return updated InventoryDTO

#### B5.7 PATCH /inventory/:id/increment
- **Owner:** Backend  
- **Deliverable:** Stock replenishment endpoint (API Contract §8.6)
- **Details:**
  - Requires `stock_manager` or `owner` role
  - Request: `{ quantity, unitPrice?, supplier? }`
  - Add quantity to current stock
  - Optionally update unitPrice and supplier
  - Log replenishment in stock_movements collection
  - Check threshold after increment
  - Return updated InventoryDTO

#### B5.8 GET /inventory/stock-value
- **Owner:** Backend  
- **Deliverable:** Stock value endpoint (API Contract §8.7)
- **Details:**
  - Requires `owner` or `manager` role
  - Calculate: sum(quantity × unitPrice) for all items
  - Return: `{ totalValue, itemsCount }`
  - Cache result for 5 minutes

#### B5.9 Stock Movements Collection
- **Owner:** Backend  
- **Deliverable:** Stock movement logging model
- **Details:**
  - Create `apps/backend/src/models/StockMovement.ts`
  - Fields:
    - inventoryId: ObjectId (ref Inventory)
    - type: enum['adjustment', 'replenishment', 'deduction', 'waste']
    - quantity: Number (positive for add, negative for subtract)
    - previousQuantity: Number
    - newQuantity: Number
    - reason: String
    - userId: ObjectId (ref User)
    - orderId?: ObjectId (ref Order, for deductions)
    - timestamp: Date
  - Create indexes: inventoryId, timestamp, type

#### B5.10 Threshold Alert Service
- **Owner:** Backend  
- **Deliverable:** Alert checking logic
- **Details:**
  - Create function `checkThreshold(inventoryId)`
  - After any stock movement, check if quantity ≤ threshold
  - If critical (quantity ≤ threshold/2): emit alert:stock_critical
  - If low (quantity ≤ threshold): log warning
  - Return alert status

#### B5.11 Socket.IO Alert Emission
- **Owner:** Backend  
- **Deliverable:** Stock alert socket events
- **Details:**
  - Emit `alert:stock_critical` to admin room
  - Payload: `{ inventoryId, productName, quantity, threshold, alertId }`
  - Integrate with existing emitters.ts
  - Trigger on adjustment and replenishment if below threshold

#### B5.12 Integration Tests for Inventory
- **Owner:** Backend  
- **Deliverable:** Test suite for inventory module
- **Details:**
  - Test GET /inventory with filters
  - Test GET /inventory/alerts
  - Test POST /inventory (valid + invalid data)
  - Test PATCH /inventory/adjust (with idempotency)
  - Test PATCH /inventory/:id/increment
  - Test GET /inventory/stock-value
  - Test threshold alerts trigger
  - Test stock_movements logging

---

### Frontend Tasks

#### F5.1 Inventory List Page
- **Owner:** Frontend  
- **Deliverable:** Inventory management page at `/inventory`
- **Details:**
  - Create `apps/frontend/src/modules/inventory/InventoryListPage.tsx`
  - Table view with columns: Name, Category, Quantity, Unit, Threshold, Status, Actions
  - Search bar for text search
  - Category filter dropdown
  - Below threshold filter toggle
  - Pagination (20 items per page)
  - Highlight rows where quantity ≤ threshold (red background)
  - Action buttons: View, Adjust, Replenish

#### F5.2 Inventory Detail Page
- **Owner:** Frontend  
- **Deliverable:** Inventory detail view at `/inventory/:id`
- **Details:**
  - Create `apps/frontend/src/modules/inventory/InventoryDetailPage.tsx`
  - Display: Name, category, unit, quantity, threshold, unitPrice
  - Show supplier information
  - Show expiry date if available
  - Show stock value (quantity × unitPrice)
  - Action buttons: Adjust, Replenish
  - Stock movement history (recent 10 movements)

#### F5.3 Inventory Creation Form
- **Owner:** Frontend  
- **Deliverable:** Inventory creation form
- **Details:**
  - Create `apps/frontend/src/modules/inventory/InventoryFormPage.tsx`
  - Form fields:
    - Name (required, max 100 chars)
    - Category (required, text input or dropdown)
    - Unit (required, e.g., kg, L, pieces)
    - Quantity (required, ≥ 0)
    - Threshold (required, ≥ 0)
    - Unit Price (required, > 0)
    - Supplier (optional)
    - Expiry Date (optional)
  - Form validation with error messages
  - Submit button with loading state

#### F5.4 Stock Adjustment Modal
- **Owner:** Frontend  
- **Deliverable:** Stock adjustment component
- **Details:**
  - Create `apps/frontend/src/components/inventory/AdjustmentModal.tsx`
  - Display current quantity
  - Input: New quantity (physical count)
  - Input: Reason for adjustment
  - Show difference from current quantity
  - Confirmation before saving
  - Idempotency-Key generation
  - Success toast with adjustment details

#### F5.5 Stock Replenishment Modal
- **Owner:** Frontend  
- **Deliverable:** Stock replenishment component
- **Details:**
  - Create `apps/frontend/src/components/inventory/ReplenishmentModal.tsx`
  - Input: Quantity to add
  - Input: Unit Price (optional, update if provided)
  - Input: Supplier (optional, update if provided)
  - Show new total after replenishment
  - Confirmation before saving
  - Success toast with replenishment details

#### F5.6 Stock Alerts Page
- **Owner:** Frontend  
- **Deliverable:** Stock alerts view at `/inventory/alerts`
- **Details:**
  - Create `apps/frontend/src/modules/inventory/AlertsPage.tsx`
  - List items below threshold
  - Sort by urgency (critical first)
  - Show shortage amount for each item
  - Quick action: Replenish button for each item
  - Auto-refresh every 60 seconds

#### F5.7 Stock Value Card Component
- **Owner:** Frontend  
- **Deliverable:** Stock value summary component
- **Details:**
  - Create `apps/frontend/src/components/inventory/StockValueCard.tsx`
  - Display: Total stock value, items count
  - Show on dashboard and inventory list page
  - Loading state while fetching
  - Format currency (MRU)

#### F5.8 Inventory Store
- **Owner:** Frontend  
- **Deliverable:** Zustand store for inventory state
- **Details:**
  - Create `apps/frontend/src/stores/inventoryStore.ts`
  - State: `items`, `alerts`, `stockValue`, `isLoading`, `filters`, `pagination`
  - Actions:
    - `fetchItems(filters)`
    - `fetchAlerts()`
    - `fetchStockValue()`
    - `createItem(data)`
    - `adjustStock(data)`
    - `replenishStock(id, data)`
  - Selector: `belowThresholdItems`, `criticalAlerts`

#### F5.9 Inventory Service
- **Owner:** Frontend  
- **Deliverable:** API service for inventory
- **Details:**
  - Create `apps/frontend/src/services/inventory.service.ts`
  - Methods:
    - `getItems(filters)` - GET /inventory
    - `getItemById(id)` - GET /inventory/:id
    - `getAlerts()` - GET /inventory/alerts
    - `createItem(data)` - POST /inventory
    - `adjustStock(data)` - PATCH /inventory/adjust
    - `replenishStock(id, data)` - PATCH /inventory/:id/increment
    - `getStockValue()` - GET /inventory/stock-value
  - Idempotency-Key for adjust endpoint

#### F5.10 Handle Stock Alert Socket Event
- **Owner:** Frontend  
- **Deliverable:** Real-time stock alerts
- **Details:**
  - In InventoryListPage and AlertsPage, listen for `alert:stock_critical` event
  - Add alert to alerts list
  - Show toast notification with product name and quantity
  - Update item in inventory list if visible
  - Play sound for critical alerts (configurable)

#### F5.11 Navigation Updates
- **Owner:** Frontend  
- **Deliverable:** Updated navigation for inventory
- **Details:**
  - Update EmployeeLayout sidebar:
    - Add "Inventory" link for stock_manager role
    - Add "Alerts" sub-link if there are critical alerts
  - Update AdminLayout if needed
  - Add badge for alerts count

---

### Definition of Done – Phase 5

- [ ] Inventory list shows all items with current quantity
- [ ] Items below threshold are highlighted (red)
- [ ] Stock adjustment logs quantity changes with reason
- [ ] Stock replenishment adds quantity
- [ ] Critical alerts are generated when quantity ≤ threshold
- [ ] Alert notification is sent via Socket.IO
- [ ] Stock value is calculated correctly (quantity × unitPrice)
- [ ] Stock movements are logged for all changes
- [ ] Manual test: Create inventory item → adjust stock below threshold → alert triggers
- [ ] Manual test: Replenish stock → verify quantity updated → value recalculated
- [ ] All integration tests pass

---

## Phase 6 – Customers & Loyalty

**Duration:** 2 weeks  
**Goal:** Customer management and loyalty points system  
**Dependencies:** Phase 2 complete

### Backend Tasks

#### B6.1 Customer Module Setup
- **Owner:** Backend  
- **Deliverable:** Customer module structure (controller, service, routes)
- **Details:** 
  - Create `apps/backend/src/modules/customers/` directory
  - Implement `customer.service.ts` with CRM logic
  - Implement `customer.controller.ts` with HTTP handlers
  - Implement `customer.routes.ts` with Express routes
  - Wire routes in `server.ts`

#### B6.2 Customer Model
- **Owner:** Backend  
- **Deliverable:** Customer model (API Contract §14.8)
- **Details:**
  - Create `apps/backend/src/models/Customer.ts`
  - Fields:
    - firstName: String (required)
    - lastName: String (required)
    - phone: String (unique, indexed)
    - email: String (optional, indexed)
    - address: String (optional)
    - preferences: String (optional)
    - loyaltyPoints: Number (default: 0)
    - birthDate: Date (optional)
    - branchId: ObjectId (optional)
    - createdAt: Date
    - updatedAt: Date
  - Create indexes: phone, email, loyaltyPoints

#### B6.3 LoyaltyTransaction Model
- **Owner:** Backend  
- **Deliverable:** Loyalty transaction history model
- **Details:**
  - Create `apps/backend/src/models/LoyaltyTransaction.ts`
  - Fields:
    - customerId: ObjectId (ref Customer)
    - type: enum['earn', 'redeem', 'adjustment']
    - points: Number (positive for earn, negative for redeem)
    - orderId?: ObjectId (ref Order)
    - description: String
    - userId: ObjectId (ref User)
    - timestamp: Date
  - Create indexes: customerId, timestamp

#### B6.4 POST /customers
- **Owner:** Backend  
- **Deliverable:** Customer creation endpoint (API Contract §9.1)
- **Details:**
  - Request: `{ firstName, lastName, phone, email?, address?, preferences?, birthDate? }`
  - Validate phone format (international format preferred)
  - Validate email format if provided
  - Check for duplicate phone number
  - Initialize loyaltyPoints to 0
  - Return CustomerDTO (201)

#### B6.5 GET /customers/search
- **Owner:** Backend  
- **Deliverable:** Customer search endpoint (API Contract §9.2)
- **Details:**
  - Query param: `q` (search term)
  - Search by: phone (partial match), email (partial match), firstName/lastName (partial match)
  - Use MongoDB text search or regex
  - Return list of CustomerDTO
  - Limit to 20 results

#### B6.6 GET /customers/:id
- **Owner:** Backend  
- **Deliverable:** Customer detail endpoint (API Contract §9.3)
- **Details:**
  - Return customer profile with:
    - CustomerDTO
    - loyaltyPoints
    - totalSpent (aggregated from orders)
    - lastPurchaseAt
    - purchaseHistory (last 20 orders)
  - Populate order details if available

#### B6.7 POST /customers/:id/loyalty/redeem
- **Owner:** Backend  
- **Deliverable:** Loyalty redemption endpoint (API Contract §9.4)
- **Details:**
  - Request: `{ pointsToRedeem }`
  - Validate customer has enough points
  - Calculate discount amount (1 point = 1 MRU, configurable)
  - Create loyalty transaction (type: 'redeem')
  - Deduct points from customer
  - Return: `{ discountAmount, remainingPoints, transactionId }`

#### B6.8 GET /customers/loyalty/ranking
- **Owner:** Backend  
- **Deliverable:** Customer ranking endpoint (API Contract §9.5)
- **Details:**
  - Requires `manager` or `owner` role
  - Return top customers by loyalty points
  - Include: customerId, name, points, totalSpent
  - Sort by points descending
  - Limit to top 50 customers

#### B6.9 Loyalty Service
- **Owner:** Backend  
- **Deliverable:** Loyalty points calculation service
- **Details:**
  - Create function `earnPoints(customerId, orderId, amount)`
  - Calculate points: floor(amount / 100) × pointsPer100MRU
  - Default: 1 point per 100 MRU (configurable)
  - Create loyalty transaction (type: 'earn')
  - Update customer loyaltyPoints
  - Return points earned

#### B6.10 Integrate Loyalty with Payment
- **Owner:** Backend  
- **Deliverable:** Points earning on payment
- **Details:**
  - In payment processing (Phase 7):
    - After successful payment, call loyaltyService.earnPoints()
    - If customer attached to order
    - Include points earned in payment response
  - Return: `{ loyaltyPointsEarned }` in payment response

#### B6.11 Socket.IO Customer Events
- **Owner:** Backend  
- **Deliverable:** Customer-related socket events
- **Details:**
  - Emit `customer:points_earned` when points are credited
  - Emit `customer:points_redeemed` when points are redeemed
  - Target: specific user room or admin room
  - Payload: customerId, points, type

#### B6.12 Integration Tests for Customers
- **Owner:** Backend  
- **Deliverable:** Test suite for customer module
- **Details:**
  - Test POST /customers (valid + duplicate phone)
  - Test GET /customers/search (by phone, name, email)
  - Test GET /customers/:id (with purchase history)
  - Test POST /customers/:id/loyalty/redeem (valid + insufficient points)
  - Test GET /customers/loyalty/ranking
  - Test points earning calculation
  - Test duplicate phone prevention

---

### Frontend Tasks

#### F6.1 Customer Search Page
- **Owner:** Frontend  
- **Deliverable:** Customer search page at `/customers`
- **Details:**
  - Create `apps/frontend/src/modules/customers/CustomerSearchPage.tsx`
  - Search input with debounce (300ms)
  - Search by phone, name, or email
  - Results list with: Name, Phone, Email, Points
  - Click to view customer detail
  - "Add Customer" button

#### F6.2 Customer Detail Page
- **Owner:** Frontend  
- **Deliverable:** Customer detail view at `/customers/:id`
- **Details:**
  - Create `apps/frontend/src/modules/customers/CustomerDetailPage.tsx`
  - Display: Name, phone, email, address, preferences
  - Show loyalty points balance
  - Show total spent
  - Show last purchase date
  - Purchase history list (last 20 orders)
  - Action buttons: Edit, Redeem Points

#### F6.3 Customer Creation Form
- **Owner:** Frontend  
- **Deliverable:** Customer creation form
- **Details:**
  - Create `apps/frontend/src/modules/customers/CustomerFormPage.tsx`
  - Form fields:
    - First Name (required)
    - Last Name (required)
    - Phone (required, format validation)
    - Email (optional, format validation)
    - Address (optional)
    - Preferences (optional, textarea)
    - Birth Date (optional)
  - Form validation with error messages
  - Success redirect to customer detail

#### F6.4 Customer Edit Form
- **Owner:** Frontend  
- **Deliverable:** Customer edit form (reuse creation form)
- **Details:**
  - Reuse CustomerFormPage with edit mode
  - Pre-populate with existing customer data
  - Handle update via PUT /customers/:id
  - Show "Last updated" timestamp

#### F6.5 Loyalty Redemption Modal
- **Owner:** Frontend  
- **Deliverable:** Points redemption component
- **Details:**
  - Create `apps/frontend/src/components/customers/RedemptionModal.tsx`
  - Display current points balance
  - Input: Points to redeem
  - Show discount amount (1 point = 1 MRU)
  - Validate: Cannot redeem more than available
  - Confirmation before redemption
  - Success toast with discount amount

#### F6.6 Loyalty Ranking Page
- **Owner:** Frontend  
- **Deliverable:** Customer ranking view at `/customers/loyalty/ranking`
- **Details:**
  - Create `apps/frontend/src/modules/customers/LoyaltyRankingPage.tsx`
  - Table view: Rank, Name, Points, Total Spent
  - Sort by points descending
  - Highlight top 3 customers
  - Pagination if needed
  - Manager/Owner access only

#### F6.7 Customer Search Component for POS
- **Owner:** Frontend  
- **Deliverable:** Customer attachment in POS
- **Details:**
  - Create `apps/frontend/src/components/pos/CustomerSearch.tsx`
  - Search input in POS cart
  - Search by phone (primary) or name
  - Select customer to attach to order
  - Display attached customer name in cart
  - Show loyalty points available
  - Option to remove customer

#### F6.8 Points Display in POS
- **Owner:** Frontend  
- **Deliverable:** Loyalty points display
- **Details:**
  - Show customer points in POS cart when attached
  - Show points that will be earned for this order
  - Show available discount from points
  - Update after payment

#### F6.9 Points Earned Toast
- **Owner:** Frontend  
- **Deliverable:** Post-payment points notification
- **Details:**
  - After successful payment, show toast:
    - "Customer earned X points!"
    - "New balance: Y points"
  - Include customer name in toast

#### F6.10 Customer Store
- **Owner:** Frontend  
- **Deliverable:** Zustand store for customer state
- **Details:**
  - Create `apps/frontend/src/stores/customerStore.ts`
  - State: `customers`, `selectedCustomer`, `ranking`, `isLoading`, `searchQuery`
  - Actions:
    - `searchCustomers(query)`
    - `fetchCustomerById(id)`
    - `createCustomer(data)`
    - `updateCustomer(id, data)`
    - `redeemPoints(id, points)`
    - `fetchRanking()`
  - Selector: `customerPoints`, `canRedeem`

#### F6.11 Customer Service
- **Owner:** Frontend  
- **Deliverable:** API service for customers
- **Details:**
  - Create `apps/frontend/src/services/customer.service.ts`
  - Methods:
    - `searchCustomers(query)` - GET /customers/search
    - `getCustomerById(id)` - GET /customers/:id
    - `createCustomer(data)` - POST /customers
    - `updateCustomer(id, data)` - PUT /customers/:id
    - `redeemPoints(id, data)` - POST /customers/:id/loyalty/redeem
    - `getRanking()` - GET /customers/loyalty/ranking

#### F6.12 Navigation Updates
- **Owner:** Frontend  
- **Deliverable:** Updated navigation for customers
- **Details:**
  - Update EmployeeLayout sidebar:
    - Add "Customers" link for all roles
    - Add "Loyalty Ranking" sub-link for manager/owner
  - Update POS to include customer search
  - Add customer section in navigation

---

### Definition of Done – Phase 6

- [ ] Customers can be created with phone, name, email
- [ ] Customer search works by phone, name, or email
- [ ] Customer detail shows profile, points, purchase history
- [ ] Loyalty points are earned on payment (1 point per 100 MRU)
- [ ] Loyalty points can be redeemed for discounts (1 point = 1 MRU)
- [ ] Customer ranking shows top customers
- [ ] Customer can be attached to POS order
- [ ] Points earned toast shows after payment
- [ ] Manual test: Create customer → make purchase → verify points earned → redeem points
- [ ] Manual test: Search customer → attach to order → process payment → verify points
- [ ] All integration tests pass

---

## Summary

### Phase 5 Total Tasks
- **Backend:** 12 tasks (B5.1 - B5.12)
- **Frontend:** 11 tasks (F5.1 - F5.11)

### Phase 6 Total Tasks
- **Backend:** 12 tasks (B6.1 - B6.12)
- **Frontend:** 12 tasks (F6.1 - F6.12)

### Combined Total
- **Backend:** 24 tasks
- **Frontend:** 23 tasks
- **Total:** 47 tasks

### Estimated Effort
- Phase 5: ~2 weeks (10 working days)
- Phase 6: ~2 weeks (10 working days)
- Total: ~4 weeks (20 working days)

### Dependencies
- Phase 5 depends on: Phase 4 (Inventory model exists, Product recipe integration)
- Phase 6 depends on: Phase 2 (Orders for purchase history)
- Phase 5 and Phase 6 can be developed in parallel
- Phase 6 loyalty integration with payments requires Phase 7

---

**Document prepared for RestoManager technical team – June 2026**
