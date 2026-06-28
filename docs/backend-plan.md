Backend Team Plan – [Project Name]

Version 1.0 – [Month Year]
Internal document – backend team

---

1. Purpose

Ce document permet à l'équipe backend de travailler en parallèle du frontend tout en protégeant :

· le contrat API (source de vérité)
· les règles métier (architecture)
· l'intégrité des données (transactions, audits)
· la sécurité (RBAC, logs, idempotence)

La source de vérité backend est :

· Contrat API : docs/API-Contract.md
· Architecture & règles métier : docs/architecture.md
· Infrastructure & déploiement : docs/infra-plan.md
· Séquençage global : docs/master-plan.md

Aucune implémentation ne doit dévier du contrat API sans validation préalable.

---

2. Ownership

L'équipe backend possède :

· apps/backend/** (API REST + Socket.IO)
· apps/worker/** (jobs cron, BullMQ)
· Tous les modèles Mongoose (ou ORM équivalent)
· Tous les services métier
· Les tests backend (unitaires + intégration)
· Les exports partagés dans packages/shared/** (DTOs, types, validation Zod)

L'équipe backend ne modifie pas l'UI frontend.

---

3. Current Runtime

Depuis la racine du projet :

```bash
npm run dev          # frontend + backend (API REST + Socket.IO)
npm run dev:worker   # jobs planifiés (notifications, backups, rapports)
```

Dépendances locales :

```text
MongoDB    : mongodb://localhost:27017/[project]
Redis      : redis://localhost:6379
```

---

4. Backend Rules (strictes)

Règle Explication
Controllers = couche HTTP uniquement Validation (Zod), appel service, réponse standard
Services = toute la logique métier Commande, stock, fidélité, notifications, génération documents
Modèles = schémas + indexes + hooks Pas de logique métier
Transaction MongoDB pour toute opération critique session.startTransaction() sur opérations financières / stock
Réponse standard { success, data, error, meta } (sauf 204)
Codes erreur = contrat API Pas d'invention
RBAC centralisé requireRole('admin', 'manager', 'employee')
Aucun fichier sur le filesystem local PDF/Images → S3 ou stockage objet
Idempotence obligatoire Idempotency-Key sur endpoints de création/modification critique

---

5. Contract Compatibility Rule

L'équipe backend implémente exactement le contrat API.

Règles de compatibilité :

· Path, méthode, auth, requête, réponse, codes erreur → identiques
· Toute réponse = { success, data, error, meta } sauf 204
· Pagination : curseur (nextCursor, hasMore) ou offset (page, limit, total)
· ObjectId = chaîne hex 24
· Timestamps = ISO 8601 UTC
· Montants = entiers (unité monétaire)
· Téléphone = E.164 (+222XXXXXXXX)

Handoff au frontend :
Pour chaque endpoint terminé, fournir :

· méthode + path
· rôle requis
· exemple de réponse succès
· codes erreur possibles
· identifiants de test (ex. employee@... / admin@...)

Si le backend ne peut pas respecter le contrat → stop et demande de clarification.

---

6. Phase-by-Phase Backend Work

Phase 1 — Authentification & comptes

Livrables :

· Modèle User + refresh token (Redis)
· Endpoints :
  · POST /auth/login
  · POST /auth/refresh
  · POST /auth/logout
  · GET /auth/me
· Middlewares auth, rbac
· Log des connexions (collection logs)

Règles critiques :

· Access JWT : 15 min, payload { sub, role, branchId, iat, exp }
· Refresh token : 30 jours, stocké httpOnly ou en base
· Rotation + détection de rejeu (invalidation de famille)
· Rate limiting : 5 tentatives / 15 min par IP

✅ Review sécurité obligatoire

---

Phase 2 — Utilisateurs & gestion des employés

Livrables :

· Modèles User (admin/manager/employee)
· Endpoints :
  · GET /users/me
  · PATCH /users/me
  · GET /admin/employees (admin/manager)
  · POST /admin/employees (admin/manager)
  · PATCH /admin/employees/:id (admin/manager)

Règles :

· Chiffrement mot de passe : bcrypt (cost 12)
· isActive : désactivation soft
· Seuls admin/manager voient la liste des employés

---

Phase 3 — Ressources de base (Tables / Produits / Catégories)

Livrables :

· Modèles Table, Product, Category
· Endpoints :
  · GET /tables (list + statut)
  · GET /tables/:id
  · PATCH /tables/:id/status
  · POST /tables (admin)
  · GET /menu/products (search + filtre)
  · GET /menu/products/:id
  · POST /menu/products (admin)
  · PUT /menu/products/:id (admin)
  · DELETE /menu/products/:id (soft delete)
  · GET /menu/categories

Règles :

· Index text sur name pour recherche rapide
· status : available / unavailable / discontinued
· Une table ne peut pas être créée sans capacity et zone

---

Phase 4 — Commandes (coeur métier)

Livrables :

· Modèles Order, OrderItem
· Service OrderService.createOrder() avec transaction
· Endpoint :
  · POST /orders (idempotent)
  · GET /orders (admin/manager)
  · GET /orders/active (serveur)
  · GET /orders/:id
  · PATCH /orders/:id/status
  · POST /orders/:id/cancel (manager)

Déroulement transactionnel (ACID) :

1. Validation des articles (existence, prix)
2. Vérification disponibilité stock (pour les recettes)
3. Démarrage session MongoDB
4. Création Order + OrderItems
5. Mise à jour Table.status = 'occupied'
6. Déduction des matières premières (Inventory)
7. Création entrée KitchenQueue (status pending)
8. Commit
9. Déclenchement asynchrone : génération ticket PDF + notifications + Socket.IO

Règles :

· type : dine-in, takeaway, delivery
· Émission order:new (Socket.IO room cuisine)
· Transition status : new → preparing → ready → served → paid

✅ Review sécurité / transaction obligatoire

---

Phase 5 — Cuisine (Kitchen)

Livrables :

· Modèle KitchenQueue
· Endpoints :
  · GET /kitchen/queue (chef)
  · PATCH /kitchen/queue/:id/start (chef)
  · PATCH /kitchen/queue/:id/ready (chef)
  · GET /kitchen/queue/priority (chef)

Règles :

· status : pending → preparing → ready
· priority : 0 (normal), 1 (prioritaire)
· Émission order:status-update vers serveur assigné
· Stockage startTime, endTime pour suivi

---

Phase 6 — Clients & Fidélité

Livrables :

· Modèle Customer + points fidélité
· Service LoyaltyService (earn / redeem)
· Endpoints :
  · POST /customers
  · GET /customers/search
  · GET /customers/:id
  · POST /customers/:id/loyalty/redeem
  · GET /customers/loyalty/ranking (manager)

Règles :

· 1 point = 100 MRU d'achat (loyalty_points_per_100_mru)
· 1 point = 1 MRU de remise (loyalty_redeem_rate)
· Les points sont convertis en réduction avant validation de la commande
· Historique des transactions fidélité stocké

---

Phase 7 — Paiements & Caisse

Livrables :

· Modèle Payment
· Service PaymentService.processPayment() avec transaction
· Endpoints :
  · POST /payments (idempotent)
  · GET /payments/cash-drawer (manager)
  · POST /payments/cash-drawer/open (manager)
  · POST /payments/cash-drawer/close (manager)

Règles :

· cashGiven requis si method = cash
· changeAmount calculé
· Mise à jour Order.status = 'paid'
· Crédit des points fidélité (si customerId)
· Émission sale:new (Socket.IO room admin)

✅ Review sécurité / transaction obligatoire

---

Phase 8 — Stocks & Inventaire

Livrables :

· Modèle Inventory
· Service InventoryService (ajustement, alertes)
· Endpoints :
  · GET /inventory (stock_manager)
  · GET /inventory/:id
  · GET /inventory/alerts
  · POST /inventory (admin)
  · PATCH /inventory/adjust (idempotent)
  · PATCH /inventory/:id/increment (stock_manager)
  · GET /inventory/stock-value (admin)

Règles :

· Alerte critique quand quantity ≤ threshold
· Historique des mouvements stock (stock_movements)
· Vérification des seuils après chaque opération
· Émission alert:stock_critical (Socket.IO)

---

Phase 9 — Factures, PDF & Notifications

Livrables :

· Service PDFService (Puppeteer + S3)
· Service NotificationService (in-app + push)
· Service WhatsAppService (Cloud API)
· Endpoints :
  · GET /invoices/:id (URL signée)
  · GET /invoices/sale/:orderId
  · POST /invoices/:id/resend

Règles :

· Numéro séquentiel : FAC-YYYY-XXXXX
· PDF généré en arrière-plan (Promise non bloquante)
· PDF stocké sur S3
· Envoi asynchrone, log d'échec
· Réenvoi manuel possible
· Notifications in-app + push via FCM

---

Phase 10 — Dashboard & Rapports

Livrables :

· Endpoints :
  · GET /dashboard/employee
  · GET /dashboard/manager
  · GET /reports/sales
  · GET /reports/profitability
  · GET /reports/stock-usage
· Agrégations MongoDB optimisées
· Export PDF/Excel

Règles :

· Les employés voient uniquement leurs KPIs
· Les rapports Excel = exceljs
· Mise en cache Redis des KPIs (TTL 5 min)

---

Phase 11 — Admin, logs & paramètres

Livrables :

· Modèle Log (append‑only), Notification
· Endpoints :
  · GET /admin/settings / PUT /admin/settings (admin)
  · GET /admin/logs (pagination par curseur)
  · GET /notifications/me
  · PATCH /notifications/:id/read
  · PATCH /notifications/read-all

Règles critiques :

· Logs = immuables (pas d'update/delete)
· Une alerte ne se répète pas plus d'une fois par heure
· Backup automatique quotidien (cron) + retention 30 jours
· Seuls admin voient les logs et les settings

✅ Review sécurité obligatoire

---

Phase 12 — Realtime & Socket.IO

Livrables :

· Serveur Socket.IO avec auth JWT
· Rooms : kitchen, admin, user:{userId}, branch:{branchId}
· Événements :
  · order:new
  · order:status-update
  · sale:new
  · alert:stock_critical
  · dashboard:update

Règles :

· Middleware Socket.IO vérifie le token
· Pas d'écriture via Socket.IO (seulement REST)
· Heartbeat toutes les 30s

---

Phase 13 — Production hardening

Livrables :

· Tests d'intégration : commande complète, stock négatif interdit
· Rate limiting (express-rate-limit + Redis)
· Logs structurés (pino ou winston)
· Monitoring : healthcheck GET /health
· Scripts de backup / restauration
· Checklist staging → production

---

7. Backend Definition of Done

· L'endpoint existe dans le contrat API avant d'écrire une ligne de code
· La structure de la réponse est identique au contrat
· La règle métier est documentée dans l'architecture
· Validation Zod centralisée
· La logique métier est dans un service, pas dans le controller
· Les modules critiques (commandes, paiements, stock) ont été relus
· npm run lint, npm run typecheck, npm run test:integration passent
· La transaction MongoDB est utilisée pour toute opération critique
· L'idempotence est implémentée pour les endpoints identifiés

---

Fin du document – Backend Team Plan v1.0