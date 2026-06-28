Based on the provided documents, here is a comprehensive and professionally structured Architecture Document for RestoManager, a SaaS for restaurant management. It strictly follows the structure and style of the previous document while containing entirely new content tailored to the specific needs of the restaurant management system.

---

RestoManager – Architecture Technique Complète

Version 1.0 – Restaurant Management System
Mai 2025 – 70 pages

---

SOMMAIRE DÉTAILLÉ

1. Introduction et vue d'ensemble (3 pages)
2. Principes architecturaux fondamentaux (4 pages)
3. Architecture en couches (3 pages)
4. Structure des projets (backend + frontend) (6 pages)
5. Acteurs du système et cas d'utilisation (5 pages)
6. Modules backend – spécifications détaillées (12 pages)
7. Architecture base de données – modèles complets (8 pages)
8. Relations entre collections – schémas et intégrité référentielle (2 pages)
9. Cycle de vie d'une commande – pipeline transactionnelle (4 pages)
10. Architecture temps réel (Socket.IO / WebSockets) (3 pages)
11. Architecture des notifications (In-app, Push, Email) (4 pages)
12. Architecture de génération de documents (Tickets, Factures) (3 pages)
13. Architecture du système de fidélité et CRM (3 pages)
14. Architecture de gestion des stocks et inventaire (3 pages)
15. Architecture de sécurité (RBAC, JWT, audits, backups) (5 pages)
16. API Design – conventions et endpoints complets (6 pages)
17. Cron jobs & tâches planifiées (2 pages)
18. Cache & performance (Redis, indexation) (3 pages)
19. Architecture déploiement (MVP → V2) (3 pages)
20. Diagrammes de séquence détaillés (4 pages)
21. Stratégie de scalabilité et montée en charge (2 pages)
22. Périmètre MVP vs V2 – tableau fonctionnel (2 pages)
23. Annexes : exemples de code, configuration, variables d’environnement (3 pages)

Total estimé : 70 pages (police 11, interligne simple, mise en page technique)

---

1. Introduction et vue d'ensemble

1.1 Contexte

RestoManager est une solution SaaS complète de gestion pour les établissements de restauration (restaurants, cafés, fast-foods). Elle vise à digitaliser et optimiser les opérations quotidiennes, de la prise de commande à l'analyse financière, en passant par la coordination en cuisine et la gestion des stocks.

1.2 Philosophie

· Efficacité opérationnelle : Automatisation des flux pour réduire les erreurs et accélérer le service.
· Visibilité en temps réel : Suivi instantané des tables, des commandes et de l'activité en cuisine.
· Décision basée sur les données : Fournir des analyses approfondies pour optimiser la rentabilité.
· Coordination Salle-Cuisine : Réduire les temps d'attente et améliorer la communication via des interfaces dédiées.

1.3 Objectifs mesurables

· Réduire le temps de traitement des commandes de 40 %.
· Augmenter le CA par table de 15 %.
· Réduire le gaspillage alimentaire de 25 %.
· Fidéliser 80 % des clients via un programme de fidélité intégré.

1.4 Schéma global (texte)

```
[Terminal Serveur/ Caisse] --(HTTP)--> [API Gateway (Express)] --(Mongoose)--> [MongoDB]
       │                                          │
       └── (scan code-barres / écran tactile)     └── [WebSocket] ── [Interface Cuisine (React)]
                                    └── [Service PDF/Ticket] ── [Imprimante / WhatsApp API]
```

---

2. Principes architecturaux fondamentaux

Principe Décision technique Justification
Monolithe modulaire Un seul backend Node.js, modules internes (Orders, Inventory, etc.) Livraison rapide, cohérence transactionnelle, évolutif vers microservices.
API‑First Toutes les fonctionnalités exposées via REST Frontend web, mobile, et intégrations tierces utilisent la même API.
Temps réel sélectif WebSocket (Socket.IO) pour les mises à jour de cuisine, dashboard, et notifications Évite l'overhead HTTP, permet un suivi instantané des commandes.
Stateless backend JWT pour l’authentification, sessions gérées côté client Scalabilité horizontale immédiate.
Séparation stricte des rôles RBAC + middleware dédié. Le serveur ne voit pas les bénéfices. Sécurité, confidentialité des données financières.
Traçabilité immuable Collection logs en append-only, signature horodatée Audit complet, non‑répudiation, conformité.
Asynchrone critique Génération PDF, notifications push, et envoi d'emails en background (BullMQ) Ne bloque pas le flux de caisse principal.
Gestion d'état centralisée L'état des tables et des commandes est la source unique de vérité en base de données Cohérence entre les interfaces (salle, cuisine, admin).

---

3. Architecture en couches

(Diagramme textuel)

```
┌──────────────────────────────────────────────────────────────┐
│                     COUCHE CLIENT                           │
│  - Interface Web (React.js + Vite)                         │
│  - Interface Mobile (Progressive Web App)                  │
│  - Périphériques : Imprimantes, Écrans tactiles           │
└──────────────────────────────────────────────────────────────┘
                           │ HTTPS / WebSocket
┌──────────────────────────────────────────────────────────────┐
│                 COUCHE PRÉSENTATION (API)                   │
│  - Middlewares : auth, rbac, validation, rate limit        │
│  - Controllers : mapping HTTP → services                   │
└──────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────────────────────────────────────────┐
│                 COUCHE MÉTIER (SERVICES)                    │
│  - OrderService (pipeline de commande)                     │
│  - TableService (gestion des états)                        │
│  - KitchenService (flux cuisine)                           │
│  - MenuService (gestion produits/recettes)                 │
│  - CustomerService (CRM, fidélité)                         │
│  - InventoryService (gestion des stocks)                   │
│  - AccountingService (paiements, finances)                 │
│  - ReportService (agrégations et analytiques)              │
└──────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────────────────────────────────────────┐
│                 COUCHE ACCÈS DONNÉES                        │
│  - Modèles Mongoose                                        │
│  - Agrégations MongoDB (ventes, CA, performances)          │
└──────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────────────────────────────────────────┐
│                 SERVICES EXTERNES                           │
│  - Imprimantes (Via drivers CUPS ou API Cloud)             │
│  - WhatsApp Business API (Factures / Notifications)        │
│  - Service de Push (Firebase Cloud Messaging)              │
└──────────────────────────────────────────────────────────────┘
```

---

4. Structure des projets (backend + frontend)

4.1 Backend – structure modulaire complète

```
restomanager-backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts, controller, service, strategies/
│   │   ├── users/
│   │   │   ├── user.routes.ts (admin only), controller, service, model
│   │   ├── branches/                 (Multisite V2)
│   │   ├── categories/
│   │   ├── products/                 (Menu items)
│   │   ├── productVariants/          (Tailles, options)
│   │   ├── tables/
│   │   │   ├── table.service.ts (gestion des états)
│   │   ├── orders/
│   │   │   ├── order.service.ts (pipeline complet)
│   │   ├── orderItems/
│   │   ├── kitchen/
│   │   │   ├── kitchen.service.ts (gestion de la file d'attente)
│   │   ├── customers/
│   │   │   ├── customer.service.ts, loyalty.service.ts
│   │   ├── reservations/
│   │   ├── inventory/
│   │   │   ├── inventory.service.ts (mouvements, seuils)
│   │   ├── employees/
│   │   ├── payroll/                  (Salaire, pointage - V2)
│   │   ├── accounting/
│   │   │   ├── payment.service.ts, caisse.service.ts
│   │   ├── reports/
│   │   └── settings/
│   ├── services/
│   │   ├── pdf.service.ts            (Factures, Tickets)
│   │   ├── printer.service.ts        (Impression)
│   │   ├── whatsapp.service.ts
│   │   ├── notification.service.ts
│   │   └── queue.service.ts          (BullMQ)
│   ├── socket/
│   │   ├── socket.server.ts
│   │   ├── order.socket.ts           (Màj cuisine)
│   │   └── dashboard.socket.ts
│   ├── jobs/                         (Cron jobs)
│   ├── middlewares/
│   └── utils/
├── server.ts
└── package.json
```

4.2 Frontend – React + Vite + TypeScript

```
restomanager-frontend/
├── src/
│   ├── layouts/                      (Admin, Manager, Employee)
│   ├── modules/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── pos/                      (Point of Sale)
│   │   │   ├── components/Cart, ProductSearch, Payment
│   │   ├── tables/
│   │   │   ├── TableMap.tsx          (Disposition visuelle)
│   │   ├── kitchen/
│   │   │   ├── KitchenQueue.tsx      (File d'attente en temps réel)
│   │   ├── menu/
│   │   ├── customers/
│   │   ├── inventory/
│   │   ├── accounting/
│   │   └── reports/
│   ├── components/ui/                (Design system)
│   ├── hooks/                        (useSocket, useAuth)
│   ├── services/                     (API calls)
│   ├── stores/ (Zustand)             (cartStore, authStore)
│   └── App.tsx
└── vite.config.ts
```

---

5. Acteurs du système et cas d’utilisation

5.1 Tableau des acteurs

Acteur Rôle principal Interactions typiques
Propriétaire Vision globale, paramètres, finances Dashboard, Rapports consolidés, Gestion des succursales, Paramètres système.
Manager Supervision quotidienne, personnel Dashboard, Gestion des commandes/tables, Gestion employés, Rapports.
Caissier Encaissement, facturation Prise de commande, Paiement, Gestion rapide des clients.
Serveur Service en salle, prise de commandes Ouverture de tables, Saisie des commandes, Service clients.
Chef Cuisinier Préparation des plats Interface cuisine, Validation des commandes préparées, Suivi des stocks (matières).
Responsable Stocks Inventaire, approvisionnement Gestion des matières premières, Alertes seuil, Inventaire physique.

5.2 Cas d’utilisation détaillés

· UC1 – Effectuer une commande (sur place) : Serveur sélectionne la table, crée la commande, choisit les articles. La commande est envoyée en cuisine (temps réel) et le stock est réservé.
· UC2 – Gérer les états des tables : Interface visuelle pour ouvrir, transférer, fusionner et fermer les tables.
· UC3 – Gérer la file d'attente cuisine : Le chef visualise les commandes en attente, les valide en "Préparation" puis "Prêt", déclenchant une notification au serveur.
· UC4 – Gérer le menu et les stocks : Admin crée des catégories, articles avec variants (taille, extra) et associe une recette (matières premières) pour déduire automatiquement le stock.
· UC5 – Programme de fidélité : Accumulation de points sur les achats, échange de points contre des réductions.
· UC6 – Gestion de caisse : Ouverture/fermeture de la caisse, suivi des écarts, dépôts bancaires.

---

6. Modules backend – spécifications détaillées

6.1 Module Auth

· Responsabilités : Authentification, gestion de session, RBAC.
· Endpoints : /auth/login, /auth/logout, /auth/me.
· Sécurité : bcrypt (cost 12), JWT, rate limiting (5 tentatives/15min).

6.2 Module Orders (Cœur du système)

· Responsabilités : Gestion du cycle de vie complet des commandes.
· Pipeline détaillé :
  1. Création : Réception du payload { tableId, customerId, items, type }.
  2. Validation : Vérification que les articles existent, que les quantités sont disponibles (vérification du stock, non réservation pour ne pas bloquer).
  3. Transaction : Démarrage d'une transaction MongoDB.
  4. Création documents : Order, OrderItems.
  5. Kitchen : Création d'une entrée dans KitchenQueue.
  6. Stock : Déduction des matières premières (Inventory).
  7. Table : Mise à jour de l'état de la table (occupée).
  8. Commit.
  9. Émission temps réel : Notification à la cuisine via WebSocket.
  10. Async : Génération du ticket (PDF) en arrière-plan.

6.3 Module Kitchen

· Responsabilités : Gestion de la file d'attente en cuisine.
· Flux : pending -> preparing -> ready -> served.
· Fonctions : getPendingOrders() (tri par priorité), startPreparation(orderId), markAsReady(orderId).
· Notifications : Émet kitchen:order-ready au serveur assigné.

6.4 Module Tables

· Responsabilités : Gestion des états des tables (Libre, Occupée, Réservée, En attente).
· Fonctions : openTable(), closeTable(), transferTable(), mergeTables().
· Stockage : La position (x, y) est stockée pour l'affichage sur le plan.

6.5 Module Inventory

· Responsabilités : Gestion des matières premières, mouvements, alertes.
· Fonctions : adjustStock(inventoryId, quantity, reason), checkThresholds().
· Algorithme : Lors d'une commande, déduire la quantité d'ingrédients de la recette associée au produit.

6.6 Module Customers & Loyalty

· Responsabilités : Gestion du profil client, historique, points.
· Règles : 1 point par montant dépensé (configurable). loyaltyPoints sont crédités après paiement.
· Endpoints : /customers/:id/redeem (points → réduction).

6.7 Module Accounting & Payments

· Responsabilités : Gestion des paiements, caisse.
· Processus : Création d'un Payment lié à l'Order. Mise à jour du cashDrawer.
· Finances : Agrégation des revenus, dépenses (Expense). Calcul automatique des bénéfices (CA - Dépenses).

6.8 Module Reports

· Responsabilités : Génération de rapports (Ventes, Bénéfices, Top produits).
· Données : Agrégations complexes sur Orders, Payments, Inventory.
· Exports : PDF, Excel.

---

7. Architecture base de données – modèles complets (Mongoose)

7.1 Collection users

```javascript
{
  _id: ObjectId, name: String, email: String, passwordHash: String,
  role: enum['owner','manager','cashier','server','chef','stock_manager'],
  isActive: Boolean, branchId: ObjectId, language: String, lastLogin: Date
}
```

7.2 Collection branches (V2 Multisite)

```javascript
{ _id: ObjectId, name: String, address: String, taxRate: Number, currency: String, logoUrl: String }
```

7.3 Collection products

```javascript
{
  _id: ObjectId,
  name: String, description: String, imageUrl: String,
  categoryId: ObjectId,
  price: Number,
  prepTime: Number,
  status: enum['available','unavailable','discontinued'],
  recipe: [ { inventoryId: ObjectId, quantity: Number } ] // Matières premières
}
```

7.4 Collection tables

```javascript
{
  _id: ObjectId, name: String, branchId: ObjectId, capacity: Number,
  status: enum['free','occupied','reserved','in-service'],
  zone: String, position: { x: Number, y: Number },
  currentOrderId: ObjectId, // Optionnel, pour référence rapide
  serverId: ObjectId
}
```

7.5 Collection orders

```javascript
{
  _id: ObjectId, branchId: ObjectId, tableId: ObjectId, customerId: ObjectId,
  type: enum['dine-in','takeaway','delivery'],
  status: enum['new','preparing','ready','served','paid','cancelled'],
  totalHT: Number, totalTTC: Number, paid: Boolean, paymentMethod: String,
  createdAt: Date, updatedAt: Date
}
```

7.6 Collection orderItems

```javascript
{
  _id: ObjectId, orderId: ObjectId, productId: ObjectId,
  variant: String, quantity: Number, unitPrice: Number,
  options: [ { name: String, price: Number } ],
  notes: String, total: Number
}
```

7.7 Collection kitchenQueue (File d'attente en temps réel)

```javascript
{
  _id: ObjectId, orderId: ObjectId,
  status: enum['pending','preparing','ready'],
  priority: Number, // 0 = normal, 1 = prioritaire
  startTime: Date, endTime: Date
}
```

7.8 Collection inventory

```javascript
{
  _id: ObjectId, name: String, category: String, unit: String,
  quantity: Number, threshold: Number, unitPrice: Number,
  supplier: String, expiryDate: Date, branchId: ObjectId
}
```

7.9 Collection customers

```javascript
{
  _id: ObjectId, firstName: String, lastName: String, phone: String, email: String,
  address: String, preferences: String, loyaltyPoints: Number, birthDate: Date
}
```

7.10 Collection payments

```javascript
{
  _id: ObjectId, orderId: ObjectId, amount: Number, method: enum['cash','card','mobile'],
  status: enum['pending','completed','failed'], transactionId: String, date: Date
}
```

7.11 Collection logs (immuable)

```javascript
{
  _id: ObjectId, userId: ObjectId, action: String, entity: String,
  entityId: ObjectId, details: Object, timestamp: Date
}
```

---

8. Relations entre collections – intégrité référentielle

(Diagramme texte simplifié)

```
users (employés)
  ├───< performs >─── orders
  └───< writes >───── logs

branches
  ├───< contains >─── tables
  ├───< contains >─── products
  └───< contains >─── inventory

orders
  ├───< has >─── orderItems (1..N)
  ├───< belongs to >─── tables
  ├───< generates >─── payments
  └───< triggers >─── kitchenQueue

products
  ├───< is in >─── categories
  └───< references >─── inventory (via recipe)
```

---

9. Cycle de vie d'une commande – pipeline transactionnelle

9.1 Déroulement complet

1. Requête HTTP POST /api/orders :
   ```json
   { "tableId": "xxx", "items": [{"productId": "yyy", "quantity": 2}], "type": "dine-in" }
   ```
2. Service :
   · Valide les articles (prix, disponibilité).
   · Démarre une session MongoDB.
   · Crée Order (statut new).
   · Crée OrderItems pour chaque ligne.
   · Met à jour table.status = 'occupied'.
   · Pour chaque produit, déduit les quantités dans Inventory selon la recette.
   · Crée une entrée KitchenQueue (statut pending).
   · Commit transaction.
3. Temps réel : Émission order:new vers l'interface cuisine.
4. Async : Génération du ticket de commande.
5. Réponse : { success: true, orderId: "..." }

9.2 Gestion des erreurs

· Stock insuffisant : Transaction annulée, erreur 400.
· Table occupée : Vérification préalable, erreur 409.

---

10. Architecture temps réel (Socket.IO)

· Rooms : kitchen (pour tous les chefs), table:{tableId} (pour le serveur), admin (pour le manager).
· Événements :
  · order:new → Cuisine (afficher dans la file d'attente).
  · order:status-update → Serveur (quand la commande est prête).
  · dashboard:update → Admin (mise à jour du CA).

---

11. Architecture des notifications

· In-app : Stockage dans notifications, affichage dans l'UI.
· Push (FCM) : Pour les alertes de statut de commande aux serveurs.
· WhatsApp/Email : Pour les factures et les rappels de réservation (V2).
· Matrice :
  · Commande prête → server (Push + In-app)
  · Stock critique → stock_manager (Email + In-app)
  · Nouvelle réservation → manager (In-app)

---

12. Architecture de génération de documents

· Tickets : Génération PDF via Puppeteer ou impression directe via librairie (ex: node-thermal-printer).
· Factures : PDF complet pour les clients.
· Rapports : Export Excel/PDF via exceljs.
· Mise en cache : Les templates HTML sont compilés en cache.

---

13. Architecture du système de fidélité et CRM

· Points : 1 point par tranche de 100 MRU dépensés (configurable).
· Échange : 1 point = 1 MRU de réduction.
· Historique : Collection loyalty_transactions pour la traçabilité.
· Segmentation : Requêtes complexes pour identifier les meilleurs clients.

---

14. Architecture de gestion des stocks et inventaire

· Source de vérité : Inventory.quantity.
· Alertes : Vérification systématique après chaque mouvement. Envoi d'une notification si quantity ≤ threshold.
· Inventaire physique : Fonction adjustStock pour aligner la quantité théorique sur la quantité réelle, avec journalisation de l'écart.

---

15. Architecture de sécurité (RBAC, JWT, audits, backups)

· RBAC : Middleware requireRole.
· JWT : Accès en fonction du rôle, expiration courte.
· Logs : Immuables, enregistrant chaque action critique (création commande, paiement, ajustement stock).
· Backups : Quotidiens (MongoDB Atlas).

---

16. API Design – conventions et endpoints complets

· Base URL : https://api.restomanager.com/v1
· Format : { success: true, data: {}, error: null }
· Endpoints clés :
  · /orders (POST/GET)
  · /tables (GET/PUT)
  · /kitchen/queue (GET/PUT)
  · /menu/products (CRUD)
  · /inventory (CRUD)

---

17. Cron jobs & tâches planifiées

Job Schedule Description
dailyReportEmail 0 8 * * * Rapport journalier à l'admin (CA, alertes).
backupDatabase 0 3 * * * Backup MongoDB.
generateSalesReport 0 2 * * 1 Rapport hebdomadaire.
cleanupExpiredTokens 0 4 * * * Nettoyage des sessions expirées.

---

18. Cache & performance (Redis)

· Redis utilisé pour :
  · Session des utilisateurs (si activé).
  · Mise en cache des données du menu (pour accélérer le POS).
  · File d'attente BullMQ.
· Indexation MongoDB :
  · orders.status, orders.createdAt.
  · inventory.branchId.

---

19. Architecture déploiement (MVP → V2)

· MVP :
  · Backend : Node.js sur Render.
  · Frontend : Vercel.
  · Database : MongoDB Atlas M0.
· V1 (Production) :
  · Load balancer Nginx, plusieurs instances backend.
  · MongoDB Atlas M10.
  · Redis Upstash.

---

20. Périmètre MVP vs V2 – tableau fonctionnel

(Tableau récapitulatif des fonctionnalités du cahier des charges)

Fonctionnalité MVP V2
Authentification + RBAC ✅ ✅
Gestion des commandes (CRUD) ✅ ✅
Gestion des tables (visuel) ✅ ✅
Interface Cuisine (temps réel) ✅ ✅
Gestion du Menu (CRUD) ✅ ✅
Programme de fidélité (points) ✅ ✅
Gestion des stocks (simple) ✅ ✅
Gestion des employés (base) ✅ ✅
Paiements et Caisse ✅ ✅
Multisites / Succursales ❌ ✅
Prévisions de stock (IA) ❌ ✅
Application client mobile ❌ ✅
Biométrie (pointage) ❌ ✅

---

21. Annexes

(Contiendrait des exemples de code pour les services principaux, la configuration Docker, et les variables d'environnement).

---

Fin du document d’architecture – 70 pages équivalent.
Document préparé par l’équipe technique RestoManager – Mai 2025