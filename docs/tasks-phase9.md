# RestoManager – Phase 9 & Phase 10 Task Breakdown

**Version 1.0 – June 2026**

---

## Phase 9 – Notifications & Realtime

**Duration:** 1 week  
**Goal:** Complete notification system with in-app and push  
**Dependencies:** Phase 3 complete

### Backend Tasks

#### B9.1 Notification Model
- **Owner:** Backend  
- **Deliverable:** Notification model (API Contract §14.10)
- **Details:**
  - Create `apps/backend/src/models/Notification.ts`
  - Fields:
    - userId: ObjectId (ref User, required)
    - title: String (required)
    - message: String (required)
    - type: enum['order_ready', 'stock_critical', 'loyalty_earned', 'loyalty_redeemed', 'system', 'payment_received'] (required)
    - isRead: Boolean (default: false)
    - entity: String (optional - 'order', 'inventory', 'customer', etc.)
    - entityId: ObjectId (optional)
    - metadata: Mixed (optional - additional data)
    - createdAt: Date
  - Create indexes: userId + createdAt, isRead + userId

#### B9.2 Notification Module Setup
- **Owner:** Backend  
- **Deliverable:** Notification module structure
- **Details:**
  - Create `apps/backend/src/modules/notifications/` directory
  - Implement `notification.service.ts` with CRUD and generation logic
  - Implement `notification.controller.ts` with HTTP handlers
  - Implement `notification.routes.ts` with Express routes
  - Wire routes in `server.ts`

#### B9.3 GET /notifications/me
- **Owner:** Backend  
- **Deliverable:** User notifications list (API Contract §13.1)
- **Details:**
  - Requires authentication
  - Query params: page (default 1), limit (default 20), unreadOnly (default false)
  - Return paginated notifications with meta: { page, limit, total, unreadCount }
  - Sort by createdAt descending

#### B9.4 PATCH /notifications/:id/read
- **Owner:** Backend  
- **Deliverable:** Mark notification as read (API Contract §13.2)
- **Details:**
  - Requires authentication
  - Validate notification belongs to user
  - Update isRead = true
  - Return updated NotificationDTO

#### B9.5 PATCH /notifications/read-all
- **Owner:** Backend  
- **Deliverable:** Mark all notifications as read (API Contract §13.3)
- **Details:**
  - Requires authentication
  - Update all user's unread notifications: isRead = true
  - Return { updatedCount }

#### B9.6 Notification Generation Service
- **Owner:** Backend  
- **Deliverable:** Auto-generate notifications on events
- **Details:**
  - Create `apps/backend/src/services/notification.service.ts`
  - Methods:
    - `createNotification(userId, title, message, type, entity?, entityId?, metadata?)`
    - `createOrderReadyNotification(orderId, tableNumber, userId)`
    - `createStockCriticalNotification(inventoryId, productName, quantity, threshold)`
    - `createLoyaltyEarnedNotification(customerId, points, orderId)`
    - `createPaymentReceivedNotification(orderId, amount, method)`
  - Emit `notification:new` via Socket.IO after creation

#### B9.7 Socket.IO Notification Emission
- **Owner:** Backend  
- **Deliverable:** Real-time notification delivery
- **Details:**
  - Add `emitNotificationNew` to `emitters.ts`
  - Emit to `user:{userId}` room for targeted delivery
  - Payload: `{ notificationId, title, message, type, createdAt }`
  - Update existing emitters (order, stock, payment) to trigger notifications

#### B9.8 WhatsApp Business Integration (Optional)
- **Owner:** Backend  
- **Deliverable:** WhatsApp notification service
- **Details:**
  - Create `apps/backend/src/services/whatsapp.service.ts`
  - Implement `sendWhatsAppMessage(phone, message)`
  - Use WhatsApp Business API (REST)
  - Send for: order ready, payment confirmation
  - Handle API errors gracefully

#### B9.9 Email Notification Service (Optional)
- **Owner:** Backend  
- **Deliverable:** Email notification service
- **Details:**
  - Create `apps/backend/src/services/email.service.ts`
  - Configure Nodemailer with SMTP settings
  - Implement `sendEmail(to, subject, html)`
  - Send for: loyalty earned, payment receipt
  - Handle errors gracefully

#### B9.10 Integration Tests
- **Owner:** Backend  
- **Deliverable:** Test suite for notifications
- **Details:**
  - Test GET /notifications/me (pagination, unreadOnly filter)
  - Test PATCH /notifications/:id/read
  - Test PATCH /notifications/read-all
  - Test notification creation on order ready
  - Test notification creation on stock critical
  - Test Socket.IO emission

---

### Frontend Tasks

#### F9.1 Notifications Center Page
- **Owner:** Frontend  
- **Deliverable:** Notifications page at `/notifications`
- **Details:**
  - Create `apps/frontend/src/modules/notifications/NotificationsPage.tsx`
  - Display notification list with icons per type
  - Show unread/read status (bold/highlight for unread)
  - Click notification to mark as read
  - "Mark all as read" button
  - Pagination with infinite scroll or page buttons

#### F9.2 Notification Service
- **Owner:** Frontend  
- **Deliverable:** API service for notifications
- **Details:**
  - Create `apps/frontend/src/services/notification.service.ts`
  - Methods:
    - `getNotifications(page, limit, unreadOnly)` - GET /notifications/me
    - `markAsRead(notificationId)` - PATCH /notifications/:id/read
    - `markAllAsRead()` - PATCH /notifications/read-all

#### F9.3 Notification Store
- **Owner:** Frontend  
- **Deliverable:** Zustand store for notifications
- **Details:**
  - Create `apps/frontend/src/stores/notificationStore.ts`
  - State: `notifications`, `unreadCount`, `isLoading`, `hasMore`, `page`
  - Actions:
    - `fetchNotifications(page?, unreadOnly?)`
    - `markAsRead(notificationId)`
    - `markAllAsRead()`
    - `addNotification(notification)` - for Socket.IO events
    - `incrementUnreadCount()`
    - `resetUnreadCount()`

#### F9.4 Notification Badge Component
- **Owner:** Frontend  
- **Deliverable:** Badge for nav showing unread count
- **Details:**
  - Create `apps/frontend/src/components/notifications/NotificationBadge.tsx`
  - Display unread count (hide if 0, show "99+" if > 99)
  - Pulse animation for new notifications
  - Link to /notifications

#### F9.5 Toast Notification System
- **Owner:** Frontend  
- **Deliverable:** Toast notifications for real-time events
- **Details:**
  - Create `apps/frontend/src/components/notifications/ToastNotification.tsx`
  - Display toast for Socket.IO events (order ready, stock critical, payment)
  - Auto-dismiss after 5 seconds
  - Click to navigate to related entity
  - Stack multiple toasts

#### F9.6 Socket.IO Notification Handler
- **Owner:** Frontend  
- **Deliverable:** Handle notification:new Socket.IO event
- **Details:**
  - In useSocket hook or App.tsx, listen for `notification:new`
  - Add notification to store
  - Increment unread count
  - Show toast notification
  - Play sound for critical notifications

#### F9.7 Notification Type Icons
- **Owner:** Frontend  
- **Deliverable:** Icons for notification types
- **Details:**
  - order_ready: 🍽️ (utensils)
  - stock_critical: ⚠️ (warning)
  - loyalty_earned: ⭐ (star)
  - loyalty_redeemed: 🎁 (gift)
  - system: ℹ️ (info)
  - payment_received: 💰 (money)

#### F9.8 Navigation Updates
- **Owner:** Frontend  
- **Deliverable:** Updated navigation for notifications
- **Details:**
  - Add NotificationBadge to EmployeeLayout nav
  - Add "Notifications" link in sidebar
  - Position badge on bell icon

---

### Definition of Done – Phase 9

- [ ] In-app notifications created for key events (order ready, stock critical, payment)
- [ ] Notifications list shows pagination, read/unread status
- [ ] Individual "mark as read" works
- [ ] Bulk "mark all as read" works
- [ ] Unread count badge updates in real-time
- [ ] Toast notifications appear for critical events
- [ ] Socket.IO emits notification:new to target user
- [ ] Manual test: Create order → mark ready → server receives notification
- [ ] Manual test: Stock below threshold → notification appears in real-time
- [ ] All integration tests pass

---

## Phase 10 – Administration & Settings

**Duration:** 1.5 weeks  
**Goal:** System configuration, log viewing, advanced admin  
**Dependencies:** Phase 1 complete

### Backend Tasks

#### B10.1 Settings Model
- **Owner:** Backend  
- **Deliverable:** System settings model
- **Details:**
  - Create `apps/backend/src/models/Settings.ts`
  - Fields (singleton document):
    - loyalty_points_per_100_mru: Number (default: 1)
    - loyalty_redeem_rate: Number (default: 1 - 1 point = 1 MRU)
    - taxRate: Number (default: 0)
    - currency: String (default: 'MRU')
    - company_name: String (default: 'RestoManager')
    - whatsapp_business_phone_id: String (optional)
    - smtp_host: String (optional)
    - smtp_port: Number (optional)
    - smtp_user: String (optional)
    - smtp_pass: String (optional)
    - fcm_server_key: String (optional)
    - createdAt: Date
    - updatedAt: Date
  - Ensure only one document exists (singleton pattern)

#### B10.2 Settings Module Setup
- **Owner:** Backend  
- **Deliverable:** Settings module structure
- **Details:**
  - Create `apps/backend/src/modules/admin/` directory
  - Implement `settings.service.ts` with get/update logic
  - Implement `settings.controller.ts` with HTTP handlers
  - Implement `settings.routes.ts` with Express routes
  - Wire routes in `server.ts`

#### B10.3 GET /admin/settings
- **Owner:** Backend  
- **Deliverable:** System settings read (API Contract §12.1)
- **Details:**
  - Requires `owner` role
  - Return singleton settings document
  - Create default settings if none exist
  - Response: `{ loyalty_points_per_100_mru, loyalty_redeem_rate, taxRate, currency, company_name, ... }`

#### B10.4 PUT /admin/settings
- **Owner:** Backend  
- **Deliverable:** System settings update (API Contract §12.2)
- **Details:**
  - Requires `owner` role
  - Request: partial settings object (only provided fields updated)
  - Validate taxRate (0-100)
  - Validate loyalty rates (positive numbers)
  - Update settings document
  - Return updated settings
  - Log the settings change

#### B10.5 Log Service
- **Owner:** Backend  
- **Deliverable:** Log querying service
- **Details:**
  - Create `apps/backend/src/services/log.service.ts`
  - Methods:
    - `getLogs(filters)` with cursor pagination
    - `createLog(data)` using Log model static method
  - Query params: cursor, limit (max 50), userId, action, from, to
  - Cursor-based pagination (use _id as cursor)

#### B10.6 GET /admin/logs
- **Owner:** Backend  
- **Deliverable:** Log list endpoint (API Contract §12.3)
- **Details:**
  - Requires `owner` role
  - Query params: cursor, limit (max 50), userId, action, from, to
  - Return paginated logs with nextCursor
  - Response: `{ logs: [...], nextCursor, hasMore }`

#### B10.7 Branch Management (V2)
- **Owner:** Backend  
- **Deliverable:** Branch listing endpoint (API Contract §12.4)
- **Details:**
  - Requires `owner` role
  - Create `apps/backend/src/models/Branch.ts` if not exists
  - Fields: name, address, phone, isActive, createdAt
  - GET /admin/branches - return all branches
  - Future: branch-specific settings

#### B10.8 Backup Service
- **Owner:** Backend  
- **Deliverable:** Automated backup service
- **Details:**
  - Create `apps/backend/src/services/backup.service.ts`
  - Implement `createBackup()` - dump MongoDB to JSON/JSONL
  - Implement `scheduleBackups()` - daily cron job
  - Store backups in /backups directory
  - Keep last 7 days of backups
  - Log backup events

#### B10.9 Integration Tests
- **Owner:** Backend  
- **Deliverable:** Test suite for admin features
- **Details:**
  - Test GET /admin/settings (default settings, read)
  - Test PUT /admin/settings (update, validation)
  - Test GET /admin/logs (pagination, filters)
  - Test GET /admin/branches
  - Test log immutability (cannot update logs)
  - Test settings singleton (only one document)

---

### Frontend Tasks

#### F10.1 Settings Page
- **Owner:** Frontend  
- **Deliverable:** Settings page at `/admin/settings`
- **Details:**
  - Create `apps/frontend/src/modules/admin/settings/SettingsPage.tsx`
  - Display current settings in form
  - Fields: loyalty rates, tax rate, currency, company name
  - WhatsApp/Email configuration section
  - Save button with loading state
  - Success/error feedback

#### F10.2 Settings Service
- **Owner:** Frontend  
- **Deliverable:** API service for settings
- **Details:**
  - Create `apps/frontend/src/services/settings.service.ts`
  - Methods:
    - `getSettings()` - GET /admin/settings
    - `updateSettings(data)` - PUT /admin/settings

#### F10.3 Settings Store
- **Owner:** Frontend  
- **Deliverable:** Zustand store for settings
- **Details:**
  - Create `apps/frontend/src/stores/settingsStore.ts`
  - State: `settings`, `isLoading`, `isSaving`
  - Actions:
    - `fetchSettings()`
    - `updateSettings(data)`
    - `getTaxRate()` - helper for calculations
    - `getLoyaltyRate()` - helper for points calculation

#### F10.4 Logs Viewer Page
- **Owner:** Frontend  
- **Deliverable:** Logs page at `/admin/logs`
- **Details:**
  - Create `apps/frontend/src/modules/admin/logs/LogsPage.tsx`
  - Display logs table with columns: timestamp, user, action, entity, details
  - Cursor-based pagination (Load More button)
  - Filter sidebar: userId, action, date range
  - Expandable row for details JSON
  - Real-time filtering

#### F10.5 Logs Service
- **Owner:** Frontend  
- **Deliverable:** API service for logs
- **Details:**
  - Create `apps/frontend/src/services/logs.service.ts`
  - Methods:
    - `getLogs(filters)` - GET /admin/logs with cursor pagination
  - Handle cursor-based pagination

#### F10.6 Log Filters Component
- **Owner:** Frontend  
- **Deliverable:** Reusable log filter component
- **Details:**
  - Create `apps/frontend/src/components/admin/LogFilters.tsx`
  - Filters: userId (search), action (dropdown), date range (from/to)
  - Clear filters button
  - Apply filters callback

#### F10.7 Admin Layout
- **Owner:** Frontend  
- **Deliverable:** Admin layout with navigation
- **Details:**
  - Update `apps/frontend/src/layouts/AdminLayout.tsx`
  - Add sidebar navigation: Settings, Logs, Employees
  - Active state highlighting
  - Role-based visibility (Settings/Logs for owner only)

#### F10.8 Branch Management (V2)
- **Owner:** Frontend  
- **Deliverable:** Branch list component
- **Details:**
  - Create `apps/frontend/src/modules/admin/branches/BranchListPage.tsx`
  - Display branches table
  - Basic info: name, address, phone, status
  - Future: branch selector for multi-branch

#### F10.9 Navigation Updates
- **Owner:** Frontend  
- **Deliverable:** Updated navigation for admin
- **Details:**
  - Update EmployeeLayout sidebar:
    - Add "Settings" link for owner
    - Add "Logs" link for owner
  - Update AdminLayout with new routes
  - Add branch management link

---

### Definition of Done – Phase 10

- [ ] Settings can be viewed and updated (loyalty rates, tax, currency)
- [ ] Settings changes are logged
- [ ] Logs are immutable and paginated by cursor
- [ ] Log filtering works (userId, action, date range)
- [ ] Branch list is accessible (V2 foundation)
- [ ] Admin layout has proper navigation
- [ ] Manual test: Update settings → verify changes persist → verify log entry
- [ ] Manual test: Filter logs by user → verify results → clear filters
- [ ] All integration tests pass

---

## Summary

### Phase 9 Total Tasks
- **Backend:** 10 tasks (B9.1 - B9.10)
- **Frontend:** 8 tasks (F9.1 - F9.8)

### Phase 10 Total Tasks
- **Backend:** 9 tasks (B10.1 - B10.9)
- **Frontend:** 9 tasks (F10.1 - F10.9)

### Combined Total
- **Backend:** 19 tasks
- **Frontend:** 17 tasks
- **Total:** 36 tasks

### Estimated Effort
- Phase 9: ~1 week (5 working days)
- Phase 10: ~1.5 weeks (7-8 working days)
- Total: ~2.5 weeks (12-13 working days)

### Dependencies
- Phase 9 depends on: Phase 3 (Kitchen for order ready notifications)
- Phase 10 depends on: Phase 1 (Auth for admin access)
- Phase 9 and Phase 10 can be developed in parallel
- Phase 10 settings can influence Phase 9 notification behavior

### Key Integrations
- **Phase 9 ↔ Phase 3:** Order ready triggers notification
- **Phase 9 ↔ Phase 5:** Stock critical triggers notification
- **Phase 9 ↔ Phase 7:** Payment received triggers notification
- **Phase 10 ↔ Phase 6:** Settings control loyalty rates
- **Phase 10 ↔ All:** Logs capture all user actions

---

**Document prepared for RestoManager technical team – June 2026**
