# RestoManager – Phase 3 & Phase 4 Task Breakdown

**Version 1.0 – June 2026**

---

## Phase 3 – Kitchen & Order Management

**Duration:** 2 weeks  
**Goal:** Real-time kitchen queue management and order coordination  
**Dependencies:** Phase 2 complete

### Backend Tasks

#### B3.1 Kitchen Module Setup
- **Owner:** Backend  
- **Deliverable:** Kitchen module structure (controller, service, routes)
- **Details:** 
  - Create `apps/backend/src/modules/kitchen/` directory
  - Implement `kitchen.service.ts` with queue management logic
  - Implement `kitchen.controller.ts` with HTTP handlers
  - Implement `kitchen.routes.ts` with Express routes
  - Wire routes in `server.ts`

#### B3.2 GET /kitchen/queue
- **Owner:** Backend  
- **Deliverable:** Kitchen queue list endpoint (API Contract §6.1)
- **Details:**
  - Query params: `status` (pending, preparing, ready), `priority`
  - Response: List of KitchenQueueDTO with order details
  - Filter by chef's assigned orders if needed
  - Sort by priority (high first), then by creation time

#### B3.3 PATCH /kitchen/queue/:id/start
- **Owner:** Backend  
- **Deliverable:** Start preparation endpoint (API Contract §6.2)
- **Details:**
  - Requires `chef` role
  - Update kitchen queue status: pending → preparing
  - Set `startTime` to current timestamp
  - Emit Socket.IO event `order:status-update` to assigned server
  - Validate queue item exists and is in 'pending' status

#### B3.4 PATCH /kitchen/queue/:id/ready
- **Owner:** Backend  
- **Deliverable:** Mark as ready endpoint (API Contract §6.3)
- **Details:**
  - Requires `chef` role
  - Update kitchen queue status: preparing → ready
  - Set `endTime` to current timestamp
  - Emit Socket.IO event `order:status-update` to assigned server
  - Trigger notification to server (in-app + push if configured)

#### B3.5 GET /kitchen/queue/priority
- **Owner:** Backend  
- **Deliverable:** Priority queue endpoint (API Contract §6.4)
- **Details:**
  - Return orders with `priority: 1` (VIP, delivery, etc.)
  - Sort by priority descending, then by creation time ascending
  - Include order details (items, table, customer if available)

#### B3.6 POST /orders/:id/cancel
- **Owner:** Backend  
- **Deliverable:** Order cancellation endpoint (API Contract §5.6)
- **Details:**
  - Requires `manager` or `owner` role
  - Request body: `{ reason: string }`
  - Validate order can be cancelled (not already served/paid)
  - Restore inventory stock (reverse recipe deduction)
  - Update table status to 'free' if no other active orders
  - Update kitchen queue status to 'cancelled'
  - Emit Socket.IO event `order:cancelled` to kitchen
  - Log cancellation in logs collection

#### B3.7 Socket.IO Server Setup
- **Owner:** Backend  
- **Deliverable:** Socket.IO server with JWT authentication (§10)
- **Details:**
  - Install `socket.io` package
  - Create `apps/backend/src/socket/socket.server.ts`
  - Implement JWT verification middleware for Socket.IO
  - Attach user to socket: `socket.user = decoded`
  - Auto-join rooms based on role:
    - `kitchen` room for chefs
    - `admin` room for managers/owners
    - `user:{userId}` room for all users
    - `branch:{branchId}` room for branch-specific events

#### B3.8 Socket.IO Event Emitters
- **Owner:** Backend  
- **Deliverable:** Event emission functions (§15.2)
- **Details:**
  - Create `apps/backend/src/socket/emitters.ts`
  - Implement `emitNewOrder(io, orderData)` → emits to `kitchen` room
  - Implement `emitStatusUpdate(io, orderId, status, serverId)` → emits to `user:{serverId}` room
  - Implement `emitOrderCancelled(io, orderId)` → emits to `kitchen` room
  - Include timestamp in all events
  - Use TypeScript interfaces for event payloads

#### B3.9 Integrate Socket.IO with Order Pipeline
- **Owner:** Backend  
- **Deliverable:** Socket emission in order creation flow
- **Details:**
  - In `order.service.ts` createOrder function:
    - After transaction commit, emit `order:new` to kitchen
    - Include orderId, tableName, items, priority in payload
  - In `kitchen.service.ts`:
    - After status update, emit appropriate events
  - Pass `io` instance through service calls or use singleton

#### B3.10 Kitchen Queue Priority Logic
- **Owner:** Backend  
- **Deliverable:** Priority calculation logic
- **Details:**
  - Priority 1 (high): Delivery orders, VIP customers, orders with "urgent" note
  - Priority 0 (normal): Standard dine-in orders
  - Add `priority` field to KitchenQueue model (default: 0)
  - Allow chef to manually set priority when starting preparation

#### B3.11 Integration Tests for Kitchen Flow
- **Owner:** Backend  
- **Deliverable:** Test suite for kitchen module
- **Details:**
  - Test GET /kitchen/queue with filters
  - Test PATCH /kitchen/queue/:id/start (happy path + invalid state)
  - Test PATCH /kitchen/queue/:id/ready (happy path + invalid state)
  - Test POST /orders/:id/cancel (with stock restoration)
  - Test Socket.IO connection and room assignment
  - Test priority queue ordering

---

### Frontend Tasks

#### F3.1 Kitchen Queue Page Setup
- **Owner:** Frontend  
- **Deliverable:** Kitchen queue view at `/kitchen`
- **Details:**
  - Create `apps/frontend/src/modules/kitchen/KitchenPage.tsx`
  - Add route to `App.tsx` with `allowedRoles={['chef', 'manager']}`
  - Layout: Header with status filter, grid of order cards
  - Mobile-responsive design for kitchen display

#### F3.2 Kitchen Queue Card Component
- **Owner:** Frontend  
- **Deliverable:** `KitchenOrderCard.tsx` component
- **Details:**
  - Display: Order ID, table name, items list, time elapsed
  - Status badge (pending: blue, preparing: yellow, ready: green)
  - Priority badge (high: red, normal: gray)
  - Action buttons based on status:
    - Pending → "Start Preparation"
    - Preparing → "Mark Ready"
  - Visual timer showing minutes since order creation

#### F3.3 Integrate GET /kitchen/queue
- **Owner:** Frontend  
- **Deliverable:** Kitchen queue data fetching
- **Details:**
  - Create `apps/frontend/src/services/kitchen.service.ts`
  - Implement `getQueue(filters?)` function
  - Add status filter dropdown (All, Pending, Preparing, Ready)
  - Auto-refresh every 30 seconds as fallback
  - Loading and error states

#### F3.4 Integrate PATCH /kitchen/queue/:id/start
- **Owner:** Frontend  
- **Deliverable:** Start preparation action
- **Details:**
  - "Start Preparation" button on pending orders
  - Optimistic UI update (show "preparing" immediately)
  - Call API to persist change
  - Show toast on success/error
  - Disable button while processing

#### F3.5 Integrate PATCH /kitchen/queue/:id/ready
- **Owner:** Frontend  
- **Deliverable:** Mark ready action
- **Details:**
  - "Mark Ready" button on preparing orders
  - Optimistic UI update (show "ready" immediately)
  - Call API to persist change
  - Show toast on success/error
  - Play sound notification (optional, configurable)

#### F3.6 Integrate GET /kitchen/queue/priority
- **Owner:** Frontend  
- **Deliverable:** Priority orders view
- **Details:**
  - Add "Priority" tab/filter to kitchen page
  - Highlight priority orders with red border/badge
  - Sort by priority descending
  - Separate section or inline with visual distinction

#### F3.7 Socket.IO Client Hook
- **Owner:** Frontend  
- **Deliverable:** `useSocket.ts` hook
- **Details:**
  - Create `apps/frontend/src/hooks/useSocket.ts`
  - Connect to backend with JWT token from auth store
  - Handle connection/disconnection/reconnection
  - Return socket instance and connection status
  - Auto-disconnect on logout

#### F3.8 Handle order:new Event
- **Owner:** Frontend  
- **Deliverable:** Real-time kitchen queue updates
- **Details:**
  - In KitchenPage, listen for `order:new` event
  - Add new order to queue (prepend to list)
  - Play sound notification (configurable)
  - Show toast: "New order from {tableName}"
  - Update pending orders count in header

#### F3.9 Handle order:status-update Event
- **Owner:** Frontend  
- **Deliverable:** Real-time status updates
- **Details:**
  - In KitchenPage, listen for `order:status-update` event
  - Update order status in queue (optimistic or refetch)
  - If status is "ready", play sound and show prominent notification
  - In ActiveOrdersPage, listen for status updates
  - Update order card status without full refresh

#### F3.10 Integrate POST /orders/:id/cancel
- **Owner:** Frontend  
- **Deliverable:** Cancel order action (manager only)
- **Details:**
  - Add "Cancel Order" button on order detail page
  - Show confirmation modal with reason input
  - Only visible to manager/owner roles
  - Call API with reason
  - Update order status to "cancelled"
  - Show toast with stock restoration info

#### F3.11 Kitchen Queue Store
- **Owner:** Frontend  
- **Deliverable:** Zustand store for kitchen state
- **Details:**
  - Create `apps/frontend/src/stores/kitchenStore.ts`
  - State: `queue`, `isLoading`, `error`, `filters`
  - Actions: `fetchQueue`, `startPreparation`, `markReady`, `updateFromSocket`
  - Selector: `pendingCount`, `preparingCount`, `readyCount`
  - Optimistic updates for better UX

#### F3.12 Toast Notifications for Kitchen Events
- **Owner:** Frontend  
- **Deliverable:** Sound and visual notifications
- **Details:**
  - Create notification sound files (new order, ready)
  - Play sounds on Socket.IO events (configurable in settings)
  - Show toast notifications with order details
  - Add volume control in user settings
  - Fallback to browser notifications if sounds disabled

---

### Definition of Done – Phase 3

- [ ] Kitchen queue shows pending orders with priority badges
- [ ] Chef can start preparation (status → preparing) with timestamp
- [ ] Chef can mark as ready (status → ready) with timestamp
- [ ] Priority orders appear at top of queue with visual distinction
- [ ] Manager can cancel orders (with stock restoration confirmation)
- [ ] `order:new` event triggers kitchen queue refresh in real-time
- [ ] `order:status-update` event updates order status without page refresh
- [ ] Socket.IO connection is authenticated with JWT
- [ ] Room assignment works (kitchen room for chefs, admin room for managers)
- [ ] Sound notifications play for new orders and ready status
- [ ] Manual test: Create order → chef sees it → start prep → mark ready → server sees update
- [ ] Manual test: Cancel order → verify stock restored → table status updated
- [ ] All integration tests pass

---

## Phase 4 – Menu & Products Management

**Duration:** 2 weeks  
**Goal:** Full product CRUD with recipe management  
**Dependencies:** Phase 2 complete

### Backend Tasks

#### B4.1 Product CRUD Endpoints
- **Owner:** Backend  
- **Deliverable:** POST, PUT, DELETE endpoints for products
- **Details:**
  - **POST /menu/products** (§7.4): Create new product
    - Required fields: name, categoryId, price, prepTime
    - Optional: description, imageUrl, recipe[]
    - Validate category exists
    - Return ProductDTO (201)
  
  - **PUT /menu/products/:id** (§7.5): Update product
    - All fields optional (partial update)
    - Validate product exists
    - Validate category if changed
    - Return updated ProductDTO
  
  - **DELETE /menu/products/:id** (§7.6): Soft delete
    - Set status to 'discontinued'
    - Do not physically delete
    - Return 204 No Content

#### B4.2 Recipe Validation
- **Owner:** Backend  
- **Deliverable:** Recipe validation logic
- **Details:**
  - Validate each recipe item has valid `inventoryId`
  - Validate `quantity` is positive number
  - Check inventory items exist
  - Return detailed validation errors (which inventory item not found)
  - Allow empty recipe array (for products without ingredients)

#### B4.3 Product Image Upload
- **Owner:** Backend  
- **Deliverable:** Image upload service
- **Details:**
  - Install `multer` for file upload handling
  - Create `apps/backend/src/services/upload.service.ts`
  - Store images in local `uploads/` directory (MVP)
  - Generate unique filename: `{productId}-{timestamp}.{ext}`
  - Return image URL: `/uploads/products/{filename}`
  - Validate file type (jpg, png, webp)
  - Validate file size (max 5MB)
  - Add route: `POST /upload/product-image`

#### B4.4 Category CRUD Endpoints
- **Owner:** Backend  
- **Deliverable:** Category management endpoints
- **Details:**
  - **POST /menu/categories**: Create category
    - Fields: name, sortOrder (optional, default: 0)
    - Return CategoryDTO (201)
  
  - **PUT /menu/categories/:id**: Update category
    - Fields: name, sortOrder
    - Return updated CategoryDTO
  
  - **DELETE /menu/categories/:id**: Delete category
    - Check if any products use this category
    - If yes, return 409 CONFLICT with error
    - If no, delete and return 204

#### B4.5 Text Index for Product Search
- **Owner:** Backend  
- **Deliverable:** MongoDB text index on product name
- **Details:**
  - Add text index on `Product.name` field
  - Support search via `$text: { $search: query }`
  - Combine with category filter in GET /menu/products
  - Add case-insensitive search option
  - Index name: `product_name_text`

#### B4.6 Product Status Management
- **Owner:** Backend  
- **Deliverable:** Status toggle logic
- **Details:**
  - Valid statuses: 'available', 'unavailable', 'discontinued'
  - `discontinued` is set by DELETE endpoint
  - `available` ↔ `unavailable` toggle via PATCH
  - Add PATCH /menu/products/:id/status endpoint
  - Validate status transitions:
    - available → unavailable (allowed)
    - unavailable → available (allowed)
    - Any → discontinued (only via DELETE)
    - discontinued → any (not allowed)

#### B4.7 Product Variant Support
- **Owner:** Backend  
- **Deliverable:** Product variant handling (optional MVP)
- **Details:**
  - Add `variants` field to Product model:
    ```typescript
    variants: [{
      name: string,      // e.g., "Small", "Medium", "Large"
      price: number,
      sku?: string
    }]
    ```
  - Validate variant prices are positive
  - Allow products without variants (single price)
  - Update ProductDTO to include variants

#### B4.8 Inventory Integration for Products
- **Owner:** Backend  
- **Deliverable:** Recipe ↔ Inventory linking
- **Details:**
  - When creating/updating product with recipe:
    - Validate all inventoryIds exist
    - Store inventory name in recipe for display
  - Add GET /menu/products/:id with full recipe details:
    ```json
    {
      "product": { /* ProductDTO */ },
      "recipe": [
        { "inventoryId": "65f...", "name": "Tomate", "quantity": 0.2, "unit": "kg" }
      ]
    }
    ```
  - Join with Inventory collection to get current name/unit

#### B4.9 Product Listing Enhancements
- **Owner:** Backend  
- **Deliverable:** Enhanced product list endpoint
- **Details:**
  - Update GET /menu/products to support:
    - `status` filter (available, unavailable, discontinued)
    - `search` text query (using text index)
    - `minPrice`, `maxPrice` filters
    - `sortBy` (name, price, createdAt) and `sortOrder` (asc, desc)
  - Include category name in response (populate categoryId)
  - Add `totalCount` to meta for pagination

#### B4.10 Integration Tests for Menu Management
- **Owner:** Backend  
- **Deliverable:** Test suite for menu module
- **Details:**
  - Test POST /menu/products (valid + invalid data)
  - Test PUT /menu/products/:id (partial updates)
  - Test DELETE /menu/products/:id (soft delete)
  - Test POST /menu/categories (create + duplicate name)
  - Test DELETE /menu/categories/:id (with/without products)
  - Test product search with text index
  - Test recipe validation (invalid inventoryId)
  - Test image upload (valid + invalid file types)

---

### Frontend Tasks

#### F4.1 Product List Page
- **Owner:** Frontend  
- **Deliverable:** Product management page at `/menu/products`
- **Details:**
  - Create `apps/frontend/src/modules/menu/products/ProductListPage.tsx`
  - Table/grid view with columns: Name, Category, Price, Status, Actions
  - Search bar for text search
  - Category filter dropdown
  - Status filter (All, Available, Unavailable, Discontinued)
  - Pagination (20 items per page)
  - Action buttons: Edit, Delete (with confirmation)

#### F4.2 Product Detail Page
- **Owner:** Frontend  
- **Deliverable:** Product detail view at `/menu/products/:id`
- **Details:**
  - Create `apps/frontend/src/modules/menu/products/ProductDetailPage.tsx`
  - Display: Name, description, image, category, price, prep time
  - Show recipe table (inventory item, quantity, unit)
  - Status badge (green=available, yellow=unavailable, red=discontinued)
  - Action buttons: Edit, Delete, Toggle Status
  - Breadcrumb navigation: Menu > Products > {Product Name}

#### F4.3 Product Creation Form
- **Owner:** Frontend  
- **Deliverable:** Product creation form
- **Details:**
  - Create `apps/frontend/src/modules/menu/products/ProductCreatePage.tsx`
  - Form fields:
    - Name (required, max 100 chars)
    - Description (optional, max 500 chars)
    - Category (required, dropdown)
    - Price (required, positive number)
    - Prep Time in minutes (required, positive integer)
    - Image upload (drag & drop or click)
    - Recipe items (dynamic list):
      - Inventory item (dropdown, searchable)
      - Quantity (number input)
      - Add/Remove recipe item buttons
  - Form validation with error messages
  - Submit button with loading state
  - Cancel button returns to list

#### F4.4 Product Edit Form
- **Owner:** Frontend  
- **Deliverable:** Product edit form
- **Details:**
  - Create `apps/frontend/src/modules/menu/products/ProductEditPage.tsx`
  - Reuse form from creation (shared component)
  - Pre-populate with existing product data
  - Load recipe items with inventory names
  - Handle image replacement (keep existing if not changed)
  - Show "Last updated" timestamp
  - Discard changes confirmation on navigate away

#### F4.5 Product Delete Confirmation
- **Owner:** Frontend  
- **Deliverable:** Delete confirmation modal
- **Details:**
  - Create `apps/frontend/src/components/ui/ConfirmDialog.tsx`
  - Reusable confirmation dialog component
  - Props: title, message, confirmText, onConfirm, onCancel
  - Product delete shows: "Are you sure you want to delete {name}?"
  - Warning: "This will mark the product as discontinued"
  - Confirm button: "Delete" (red)
  - Cancel button: "Cancel" (gray)

#### F4.6 Product Status Toggle
- **Owner:** Frontend  
- **Deliverable:** Status toggle component
- **Details:**
  - Create `apps/frontend/src/components/ui/StatusBadge.tsx`
  - Display status with color coding:
    - available: green
    - unavailable: yellow
    - discontinued: red
  - Toggle button for manager/owner roles
  - Confirmation for status change
  - Optimistic UI update

#### F4.7 Recipe Editor Component
- **Owner:** Frontend  
- **Deliverable:** Recipe editing component
- **Details:**
  - Create `apps/frontend/src/components/menu/RecipeEditor.tsx`
  - Dynamic list of recipe items
  - Each item: Inventory dropdown + Quantity input + Remove button
  - "Add Ingredient" button at bottom
  - Validate: No duplicate inventory items
  - Validate: Quantity > 0
  - Show total cost per unit (sum of ingredient costs)
  - Inventory dropdown with search functionality

#### F4.8 Category Management Page
- **Owner:** Frontend  
- **Deliverable:** Category CRUD page at `/menu/categories`
- **Details:**
  - Create `apps/frontend/src/modules/menu/categories/CategoryListPage.tsx`
  - Table view with columns: Name, Sort Order, Products Count, Actions
  - Add Category button (opens modal or inline form)
  - Edit category (inline editing or modal)
  - Delete category (with product count check)
  - Drag & drop to reorder categories (optional)

#### F4.9 Category Form Component
- **Owner:** Frontend  
- **Deliverable:** Category creation/edit form
- **Details:**
  - Create `apps/frontend/src/components/menu/CategoryForm.tsx`
  - Fields: Name (required), Sort Order (optional, default 0)
  - Validate: Name unique (check on blur)
  - Handle create and update modes
  - Show error if category has products (on delete)

#### F4.10 Image Upload Component
- **Owner:** Frontend  
- **Deliverable:** Product image upload
- **Details:**
  - Create `apps/frontend/src/components/ui/ImageUpload.tsx`
  - Drag & drop zone with preview
  - Click to browse files
  - Show upload progress
  - Display current image (for edit mode)
  - Remove image button
  - Validate: File type (jpg, png, webp), size (max 5MB)
  - Show error for invalid files

#### F4.11 Menu Store
- **Owner:** Frontend  
- **Deliverable:** Zustand store for menu state
- **Details:**
  - Create `apps/frontend/src/stores/menuStore.ts`
  - State: `products`, `categories`, `isLoading`, `filters`, `pagination`
  - Actions:
    - `fetchProducts(filters)`
    - `fetchCategories()`
    - `createProduct(data)`
    - `updateProduct(id, data)`
    - `deleteProduct(id)`
    - `createCategory(data)`
    - `updateCategory(id, data)`
    - `deleteCategory(id)`
  - Selector: `availableProducts`, `productsByCategory`

#### F4.12 Product Search with Debounce
- **Owner:** Frontend  
- **Deliverable:** Debounced search input
- **Details:**
  - Create `apps/frontend/src/hooks/useDebounce.ts`
  - Debounce search input by 300ms
  - Update URL query params with search term
  - Clear search button
  - Show "No products found" for empty results
  - Preserve search term on page navigation

#### F4.13 Product Form Validation
- **Owner:** Frontend  
- **Deliverable:** Form validation logic
- **Details:**
  - Create `apps/frontend/src/utils/validations.ts`
  - Product schema (using Zod or custom):
    - name: string, required, 1-100 chars
    - description: string, optional, max 500 chars
    - categoryId: string, required
    - price: number, required, > 0
    - prepTime: number, required, > 0, integer
    - recipe: array of { inventoryId, quantity > 0 }
  - Category schema:
    - name: string, required, 1-50 chars
    - sortOrder: number, optional, >= 0
  - Show inline validation errors

#### F4.14 Menu Navigation Updates
- **Owner:** Frontend  
- **Deliverable:** Updated navigation menus
- **Details:**
  - Update `EmployeeLayout` sidebar:
    - Add "Menu" section with "Products" and "Categories" links
    - Show only for manager/owner roles
  - Update `AdminLayout` if needed
  - Add breadcrumb navigation for menu pages
  - Highlight active menu item

---

### Definition of Done – Phase 4

- [ ] Products can be created with name, price, category, recipe
- [ ] Products can be updated (all fields, including recipe)
- [ ] Products can be soft-deleted (status → discontinued)
- [ ] Product search works by name (text index)
- [ ] Categories can be managed (CRUD)
- [ ] Recipe shows inventory items with quantities and units
- [ ] Image upload works for products (jpg, png, webp)
- [ ] Status toggle works (available ↔ unavailable)
- [ ] Form validation shows inline errors
- [ ] Pagination works on product list
- [ ] Category deletion prevents if products exist
- [ ] Manual test: Create product with recipe → edit product → delete product
- [ ] Manual test: Create category → add products → delete category (blocked)
- [ ] Manual test: Upload product image → view in detail page
- [ ] All integration tests pass

---

## Summary

### Phase 3 Total Tasks
- **Backend:** 11 tasks (B3.1 - B3.11)
- **Frontend:** 12 tasks (F3.1 - F3.12)

### Phase 4 Total Tasks
- **Backend:** 10 tasks (B4.1 - B4.10)
- **Frontend:** 14 tasks (F4.1 - F4.14)

### Combined Total
- **Backend:** 21 tasks
- **Frontend:** 26 tasks
- **Total:** 47 tasks

### Estimated Effort
- Phase 3: ~2 weeks (10 working days)
- Phase 4: ~2 weeks (10 working days)
- Total: ~4 weeks (20 working days)

### Dependencies
- Phase 3 depends on: Phase 2 (Orders, Tables, Models)
- Phase 4 depends on: Phase 2 (Products, Categories models)
- Phase 3 and Phase 4 can be developed in parallel

---

**Document prepared for RestoManager technical team – June 2026**
