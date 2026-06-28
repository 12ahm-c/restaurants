# RestoManager – Phase 2 Tasks
## Point of Sale (Core Ordering)

**Duration:** 3 weeks  
**Dependencies:** Phase 1 (Auth & User Management) complete  
**Critical path:** Core business functionality

---

## 1. Backend Tasks

### 1.1 Models

| # | Task | Owner | Deliverable | Ref |
|---|------|-------|-------------|-----|
| B2.1 | Create Table model (free/occupied/reserved/in-service, position x/y) | Backend | `models/Table.ts` | architecture §7.4, API-contract §14.2 |
| B2.2 | Create Category model (name, branchId, sortOrder) | Backend | `models/Category.ts` | API-contract §14.6 |
| B2.3 | Create Product model with recipe (name, price, categoryId, recipe[], status) | Backend | `models/Product.ts` | architecture §7.3, API-contract §14.5 |
| B2.4 | Create Order model (tableId, type, status, totalHT, totalTTC) | Backend | `models/Order.ts` | architecture §7.5, API-contract §14.3 |
| B2.5 | Create OrderItem model (orderId, productId, quantity, unitPrice, options, notes) | Backend | `models/OrderItem.ts` | architecture §7.6 |
| B2.6 | Create Inventory model (name, quantity, threshold, unitPrice) | Backend | `models/Inventory.ts` | architecture §7.8, API-contract §14.7 |

### 1.2 Table Endpoints

| # | Task | Owner | Deliverable | Ref |
|---|------|-------|-------------|-----|
| B2.7 | Implement GET /tables (list with status/zone filter) | Backend | Table controller + service | API-contract §4.1 |
| B2.8 | Implement GET /tables/status (summary: free/occupied/reserved/inService/total) | Backend | Table status endpoint | API-contract §4.2 |
| B2.9 | Implement GET /tables/:id (detail with currentOrderId) | Backend | Table detail endpoint | API-contract §4.3 |
| B2.10 | Implement PATCH /tables/:id/status (change status, assign server) | Backend | Table status update | API-contract §4.4 |

### 1.3 Menu Endpoints

| # | Task | Owner | Deliverable | Ref |
|---|------|-------|-------------|-----|
| B2.11 | Implement GET /menu/products (list with categoryId, status, search filters) | Backend | Product list endpoint | API-contract §7.1 |
| B2.12 | Implement GET /menu/products/:id (detail with recipe) | Backend | Product detail endpoint | API-contract §7.2 |
| B2.13 | Implement GET /menu/categories (list categories) | Backend | Category list endpoint | API-contract §7.3 |

### 1.4 Order Endpoints (Critical Path)

| # | Task | Owner | Deliverable | Ref |
|---|------|-------|-------------|-----|
| B2.14 | Implement POST /orders with idempotency (ACID transaction) | Backend | Order creation endpoint | API-contract §5.1 |
| B2.15 | Implement GET /orders (list with status/tableId/date filters) | Backend | Order list endpoint | API-contract §5.2 |
| B2.16 | Implement GET /orders/active (active orders for connected server) | Backend | Active orders endpoint | API-contract §5.3 |
| B2.17 | Implement GET /orders/:id (detail with items, table, customer) | Backend | Order detail endpoint | API-contract §5.4 |
| B2.18 | Implement PATCH /orders/:id/status (status transition validation) | Backend | Order status update | API-contract §5.5 |

### 1.5 Order Pipeline (Critical - Transaction)

| # | Task | Owner | Deliverable | Ref |
|---|------|-------|-------------|-----|
| B2.19 | Implement OrderService.createOrder() with MongoDB transaction | Backend | Order service | architecture §6.2 |
| B2.20 | Implement stock deduction in order creation (Inventory service) | Backend | Stock deduction logic | API-contract §5.1 |
| B2.21 | Implement Table → Order transaction (table status → occupied) | Backend | Table status update | architecture §6.2 |
| B2.22 | Create KitchenQueue entry in order pipeline | Backend | Kitchen queue integration | architecture §6.2 |

### 1.6 Idempotency

| # | Task | Owner | Deliverable | Ref |
|---|------|-------|-------------|-----|
| B2.23 | Implement Idempotency-Key middleware (24h TTL, same key = replay) | Backend | Idempotency middleware | API-contract §1.3 |

### 1.7 Tests

| # | Task | Owner | Deliverable | Ref |
|---|------|-------|-------------|-----|
| B2.24 | Write integration tests for table CRUD | Backend | Test suite | master-plan §5 |
| B2.25 | Write integration tests for product/category CRUD | Backend | Test suite | master-plan §5 |
| B2.26 | Write integration tests for complete order flow (create → stock deduction → table occupied) | Backend | Test suite | master-plan §5 |
| B2.27 | Write integration tests for idempotency (duplicate key prevention) | Backend | Test suite | master-plan §5 |

---

## 2. Frontend Tasks

### 2.1 Table Map

| # | Task | Owner | Deliverable | Ref |
|---|------|-------|-------------|-----|
| F2.1 | Create Table Map view (/tables) with visual layout | Frontend | `modules/tables/TableMap.tsx` | frontend-plan §6 |
| F2.2 | Integrate GET /tables with status filter | Frontend | Table list | API-contract §4.1 |
| F2.3 | Integrate GET /tables/status for summary cards | Frontend | Status summary | API-contract §4.2 |
| F2.4 | Integrate PATCH /tables/:id/status for status changes | Frontend | Table status management | API-contract §4.4 |

### 2.2 POS Screen

| # | Task | Owner | Deliverable | Ref |
|---|------|-------|-------------|-----|
| F2.5 | Create POS screen (/pos) layout with product grid | Frontend | `modules/pos/POSPage.tsx` | frontend-plan §6 |
| F2.6 | Integrate GET /menu/products with search | Frontend | Product search | API-contract §7.1 |
| F2.7 | Integrate GET /menu/categories for category filter | Frontend | Category filter | API-contract §7.3 |

### 2.3 Cart

| # | Task | Owner | Deliverable | Ref |
|---|------|-------|-------------|-----|
| F2.8 | Build Cart component (add/remove/adjust quantity/notes) | Frontend | `modules/pos/components/Cart.tsx` | frontend-plan §6 |
| F2.9 | Create Cart Zustand store (items, customer, orderType, notes) | Frontend | `stores/cartStore.ts` | frontend-plan §7 |
| F2.10 | Build Table selection (dropdown or visual map) | Frontend | Table selector component | frontend-plan §6 |
| F2.11 | Build Order type selection (dine-in/takeaway/delivery) | Frontend | Order type picker | frontend-plan §6 |

### 2.4 Order Submission

| # | Task | Owner | Deliverable | Ref |
|---|------|-------|-------------|-----|
| F2.12 | Integrate POST /orders with Idempotency-Key | Frontend | Order submission | API-contract §5.1 |
| F2.13 | Build Order success confirmation with ticket preview | Frontend | Order confirmation | frontend-plan §6 |

### 2.5 Active Orders

| # | Task | Owner | Deliverable | Ref |
|---|------|-------|-------------|-----|
| F2.14 | Build Active Orders list for servers (GET /orders/active) | Frontend | Active orders view | API-contract §5.3 |
| F2.15 | Build Order detail view (GET /orders/:id) | Frontend | Order detail | API-contract §5.4 |
| F2.16 | Build Order status update (PATCH /orders/:id/status) | Frontend | Status buttons | API-contract §5.5 |

### 2.6 State Management

| # | Task | Owner | Deliverable | Ref |
|---|------|-------|-------------|-----|
| F2.17 | Create Table Zustand store (current table, table statuses) | Frontend | `stores/tableStore.ts` | frontend-plan §7 |

### 2.7 Responsive Design

| # | Task | Owner | Deliverable | Ref |
|---|------|-------|-------------|-----|
| F2.18 | Implement mobile-responsive design for POS (tablet-optimized) | Frontend | Responsive layouts | frontend-plan §6 |

---

## 3. API Contract Reference (Phase 2 Endpoints)

### Tables
- `GET /tables` – Bearer (status, zone filters)
- `GET /tables/status` – Bearer (summary)
- `GET /tables/:id` – Bearer
- `PATCH /tables/:id/status` – Bearer
- `PATCH /tables/:id/transfer` – Bearer (manager)
- `POST /tables/merge` – Bearer (manager)
- `POST /tables` – Bearer (admin)

### Menu
- `GET /menu/products` – Bearer (categoryId, status, search)
- `GET /menu/products/:id` – Bearer (with recipe)
- `GET /menu/categories` – Bearer
- `POST /menu/products` – Bearer (admin)
- `PUT /menu/products/:id` – Bearer (admin)
- `DELETE /menu/products/:id` – Bearer (admin, soft delete)

### Orders
- `POST /orders` – Bearer (Idempotency-Key required)
- `GET /orders` – Bearer (status, tableId, from, to)
- `GET /orders/active` – Bearer (server)
- `GET /orders/:id` – Bearer
- `PATCH /orders/:id/status` – Bearer
- `POST /orders/:id/cancel` – Bearer (manager)

---

## 4. Business Rules

| Rule | Value | Source |
|------|-------|--------|
| Table statuses | free, occupied, reserved, in-service | architecture §7.4 |
| Product statuses | available, unavailable, discontinued | architecture §7.3 |
| Order types | dine-in, takeaway, delivery | API-contract §5.1 |
| Order statuses | new → preparing → ready → served → paid → cancelled | API-contract §5.5 |
| Status transition | new → preparing → ready → served (linear) | architecture §6.2 |
| Idempotency TTL | 24 hours | API-contract §1.3 |
| Price calculation | sum(orderItem.quantity × orderItem.unitPrice + options) | architecture §7.6 |
| Stock deduction | Deduct recipe ingredients from Inventory on order creation | architecture §6.5 |
| Table on order | Table status → occupied when order created | architecture §6.2 |
| Kitchen queue | Created automatically when order is placed (status: pending) | architecture §6.2 |
| Product search | MongoDB text index on name | backend-plan §6 |

---

## 5. Error Codes (Phase 2)

| Code | HTTP | Description |
|------|------|-------------|
| INSUFFICIENT_STOCK | 422 | Quantity requested > available stock |
| TABLE_OCCUPIED | 409 | Table already occupied |
| INVALID_STATE | 409 | Status transition forbidden |
| IDEMPOTENCY_KEY_REUSED | 409 | Same key with different body |
| NOT_FOUND | 404 | Product, table, or order not found |
| VALIDATION_ERROR | 400 | Zod validation failure |

---

## 6. DTOs (Phase 2)

### TableDTO
```json
{
  "_id": "65f...",
  "name": "Table 12",
  "branchId": "65f...",
  "capacity": 4,
  "status": "occupied",
  "zone": "Terrasse",
  "position": { "x": 120, "y": 80 },
  "currentOrderId": "65f...",
  "serverId": "65f..."
}
```

### ProductDTO
```json
{
  "_id": "65f...",
  "name": "Pizza Margherita",
  "description": "Sauce tomate, mozzarella, basilic",
  "imageUrl": "https://storage.restomanager.com/products/pizza.jpg",
  "categoryId": "65f...",
  "price": 180,
  "prepTime": 15,
  "status": "available",
  "createdAt": "2026-04-01T00:00:00.000Z",
  "updatedAt": "2026-05-01T00:00:00.000Z"
}
```

### CategoryDTO
```json
{
  "_id": "65f...",
  "name": "Pizzas",
  "branchId": "65f...",
  "sortOrder": 1
}
```

### OrderDTO
```json
{
  "_id": "65f...",
  "branchId": "65f...",
  "tableId": "65f...",
  "customerId": "65f...",
  "type": "dine-in",
  "status": "preparing",
  "totalHT": 340,
  "totalTTC": 340,
  "paid": false,
  "paymentMethod": null,
  "notes": "Sans oignons",
  "createdAt": "2026-06-27T14:32:11.000Z",
  "updatedAt": "2026-06-27T14:35:00.000Z"
}
```

---

## 7. Order Pipeline Flow (ACID Transaction)

```
POST /orders { tableId, items, type }
    │
    ├─ 1. Validate items (existence, price)
    ├─ 2. Check stock availability (recipe ingredients)
    ├─ 3. Start MongoDB transaction
    ├─ 4. Create Order (status: new)
    ├─ 5. Create OrderItems
    ├─ 6. Update Table.status → occupied
    ├─ 7. Deduct Inventory (recipe quantities)
    ├─ 8. Create KitchenQueue entry (status: pending)
    ├─ 9. Commit transaction
    ├─ 10. Emit Socket.IO order:new → kitchen
    └─ 11. Async: Generate ticket PDF
```

---

## 8. Definition of Done – Phase 2

### Backend
- [ ] Table list shows status (free/occupied/reserved/in-service)
- [ ] Table status can be changed (free ↔ occupied)
- [ ] Products can be searched and filtered by category
- [ ] Product detail includes recipe ingredients
- [ ] Order submission creates order with ACID transaction
- [ ] Stock is deducted when order is created
- [ ] Table status updates to "occupied" on order creation
- [ ] KitchenQueue entry created automatically
- [ ] Idempotency prevents duplicate orders
- [ ] Active orders list shows current orders for server
- [ ] Order detail page shows all items and status
- [ ] Order status can be updated (new → preparing → ready → served)
- [ ] `npm run lint`, `npm run typecheck`, `npm run test:integration` pass

### Frontend
- [ ] Table map shows visual layout with status colors
- [ ] Table status filter works
- [ ] POS screen displays products with search
- [ ] Category filter works
- [ ] Cart supports add/remove/adjust quantity/notes
- [ ] Order type selection (dine-in/takeaway/delivery)
- [ ] Order submission uses Idempotency-Key
- [ ] Order success confirmation displays
- [ ] Active orders list visible for servers
- [ ] Order detail view shows items
- [ ] Order status update buttons work
- [ ] Mobile-responsive on tablet
- [ ] `npm run lint`, `npm run typecheck`, `npm run build` pass

### Integration
- [ ] Manual test: Table selection → add products → submit order → verify stock deduction
- [ ] Manual test: Idempotency-Key prevents duplicate submission
- [ ] Manual test: Table status changes to occupied after order
- [ ] Manual test: KitchenQueue entry created

---

## 9. Security Checklist

- [ ] All endpoints require Bearer token
- [ ] Table/Order mutations validate ownership
- [ ] Stock deduction is atomic (transaction)
- [ ] Idempotency-Key enforced on POST /orders
- [ ] No negative stock allowed (422 on insufficient)
- [ ] Order status transitions validated server-side
- [ ] Price calculated server-side (not from client)

---

*Document prepared for RestoManager – Phase 2: Point of Sale (Core Ordering)*
