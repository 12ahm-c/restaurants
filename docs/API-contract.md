RestoManager — API Contract

Version 1.0
Document de référence pour l’équipe frontend/backend
Juin 2026

Ce document est la source de vérité des échanges HTTP et Socket.IO entre le frontend (React) et le backend (Node.js). Tout écart entre ce contrat et l’implémentation doit être corrigé immédiatement.

---

Table des matières

1. Conventions générales
2. Authentification & comptes
3. Utilisateurs (employés)
4. Tables
5. Commandes (Orders)
6. Cuisine (Kitchen)
7. Menu & Produits
8. Stocks & Inventaire
9. Clients & Fidélité
10. Paiements & Caisse
11. Rapports & Tableau de bord
12. Paramètres & Administration
13. Notifications
14. Appendice A — DTOs partagés
15. Appendice B — Événements Socket.IO

---

1. Conventions générales

1.1 Base URL & versionnement

```
Production : https://api.restomanager.com/v1
Staging    : https://api.staging.restomanager.com/v1
Local      : http://localhost:3001/v1
```

Le serveur WebSocket (Socket.IO) utilise le même port en production (port 3001 avec upgrade), mais peut être séparé en développement sur http://localhost:3002.

1.2 Authentification

Tous les endpoints nécessitent un JWT access token sauf mention explicite Public.

```
Authorization: Bearer <accessToken>
```

· Access token : durée de vie 15 minutes ; contient { sub: userId, role, branchId, iat, exp }.
· Refresh token : durée de vie 30 jours ; stocké dans un cookie httpOnly (ou corps de requête si nécessaire).
· Endpoint POST /auth/refresh pour obtenir un nouveau couple.
· À la déconnexion, le refresh token est révoqué (Redis). L’access token reste valide jusqu’à expiration.

1.3 Idempotence

Les endpoints qui modifient des ressources critiques DOIVENT être appelés avec un header Idempotency-Key :

```
Idempotency-Key: <uuid-v4>
```

Endpoints concernés :

· POST /orders
· POST /payments
· PATCH /inventory/adjust

Comportement :

· Même Idempotency-Key + même corps → rejoue la réponse originale (200) pendant 24h.
· Même clé + corps différent → 409 IDEMPOTENCY_KEY_REUSED.

1.4 Enveloppe de réponse standard

Succès

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": null
}
```

Erreur

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERR_CODE",
    "message": "Description lisible",
    "fields": { "field": "raison" }
  },
  "meta": null
}
```

Pagination (dans meta)

```json
"meta": {
  "page": 1,
  "limit": 20,
  "total": 150,
  "nextCursor": "65f2a1b3c4d5e6f7a8b9c0d1",
  "hasMore": true
}
```

1.5 Codes HTTP

Code Utilisation
200 Succès (GET, PUT, POST avec réponse)
201 Création
204 Suppression réussie, pas de corps
400 Erreur de validation (Zod)
401 Non authentifié (token manquant/invalide/expiré)
403 Authentifié mais rôle insuffisant
404 Ressource non trouvée
409 Conflit (idempotence, état invalide, doublon)
422 Logique métier non satisfaite (ex. stock insuffisant, table occupée)
429 Trop de requêtes
500 Erreur interne
502 Erreur externe (WhatsApp, PDF, impression)

1.6 Codes d’erreur métier

Code HTTP Description
AUTH_REQUIRED 401 Token absent
TOKEN_EXPIRED 401 Access token expiré → appeler /auth/refresh
TOKEN_INVALID 401 Signature invalide ou token révoqué
FORBIDDEN 403 Rôle insuffisant
VALIDATION_ERROR 400 Échec validation Zod (fields détaille)
NOT_FOUND 404 Ressource inexistante
INSUFFICIENT_STOCK 422 Quantité demandée > stock disponible
TABLE_OCCUPIED 409 Table déjà occupée
INVALID_STATE 409 Transition interdite (ex. annuler une commande déjà servie)
IDEMPOTENCY_KEY_REUSED 409 Même clé avec corps différent
WHATSAPP_ERROR 502 Échec d’envoi via API Business
PDF_GENERATION_FAILED 502 Échec de génération du PDF
PRINTER_ERROR 502 Échec d’impression

1.7 Pagination

· Basée sur curseur : ?cursor=<lastId>&limit=20.
· Basée sur page (défaut) : ?page=1&limit=20 (max 100).

1.8 Rate limiting

Endpoint Limite
POST /auth/login 5 tentatives / 15 min par IP
POST /orders 60 requêtes / min par utilisateur
GET /reports/* 10 requêtes / min par admin
Tous les autres 100 requêtes / min par IP

---

2. Authentification & comptes

2.1 POST /auth/login – Public

Authentification par email / mot de passe.

Requête

```json
{
  "email": "server@restomanager.mr",
  "password": "string"
}
```

Réponse (200)

```json
{
  "success": true,
  "data": {
    "user": { /* UserDTO */ },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "accessTokenExpiresAt": "2026-06-27T14:47:11.000Z",
    "refreshTokenExpiresAt": "2026-07-27T14:32:11.000Z"
  }
}
```

Erreurs

Code Condition
VALIDATION_ERROR Email ou mot de passe manquant
AUTH_REQUIRED Identifiants incorrects
FORBIDDEN Compte désactivé (isActive: false)

---

2.2 POST /auth/refresh – Public

Rafraîchir l’access token.

Réponse (200)

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "accessTokenExpiresAt": "...",
    "refreshTokenExpiresAt": "..."
  }
}
```

Erreur : TOKEN_INVALID

---

2.3 POST /auth/logout – Bearer

Déconnexion.

Réponse (204) – pas de corps.

---

2.4 GET /auth/me – Bearer

Obtenir l’utilisateur authentifié.

Réponse (200) – UserDTO (voir §14.1).

---

3. Utilisateurs (employés)

3.1 GET /users/me – Bearer

Alias de /auth/me.

---

3.2 PATCH /users/me – Bearer

Modifier son propre profil.

Requête (champs optionnels)

```json
{
  "name": "Nouveau nom",
  "email": "new@restomanager.mr",
  "language": "fr"
}
```

Réponse (200) – UserDTO mis à jour.

---

3.3 (Admin/Owner) GET /admin/employees – Bearer

Lister tous les employés.

Query params : page, limit, isActive, role.

Réponse (200) – liste de UserDTO.

---

3.4 (Admin/Owner) POST /admin/employees – Bearer

Créer un nouvel employé.

Requête

```json
{
  "name": "Jean Dupont",
  "email": "jean@restomanager.mr",
  "password": "temp1234",
  "role": "server"
}
```

Rôles valides : owner, manager, cashier, server, chef, stock_manager

Réponse (201) – UserDTO.

---

3.5 (Admin/Owner) PATCH /admin/employees/:id – Bearer

Modifier un employé.

Requête

```json
{
  "isActive": false,
  "role": "chef",
  "password": "newpassword"
}
```

Réponse (200) – UserDTO.

---

4. Tables

4.1 GET /tables – Bearer

Lister toutes les tables de la succursale.

Query params : status (free, occupied, reserved, in-service), zone.

Réponse (200) – liste de TableDTO (voir §14.2).

---

4.2 GET /tables/status – Bearer

Obtenir un résumé des états des tables.

Réponse (200)

```json
{
  "success": true,
  "data": {
    "free": 8,
    "occupied": 5,
    "reserved": 2,
    "inService": 1,
    "total": 16
  }
}
```

---

4.3 GET /tables/:id – Bearer

Détail d’une table.

Réponse (200) – TableDTO avec currentOrderId.

---

4.4 PATCH /tables/:id/status – Bearer

Changer l’état d’une table.

Requête

```json
{
  "status": "occupied",
  "serverId": "65f..." // optionnel
}
```

Réponse (200) – TableDTO mis à jour.

---

4.5 PATCH /tables/:id/transfer – Bearer (manager)

Transférer une table vers un autre serveur.

Requête

```json
{
  "targetServerId": "65f..."
}
```

Réponse (200) – TableDTO mis à jour.

---

4.6 POST /tables/merge – Bearer (manager)

Fusionner deux tables.

Requête

```json
{
  "sourceTableId": "65f...",
  "targetTableId": "65f..."
}
```

Réponse (200) – { success: true, mergedTable: TableDTO }

---

4.7 (Admin) POST /tables – Bearer (admin)

Créer une nouvelle table.

Requête

```json
{
  "name": "Table 12",
  "capacity": 4,
  "zone": "Terrasse",
  "position": { "x": 120, "y": 80 }
}
```

Réponse (201) – TableDTO.

---

5. Commandes (Orders)

5.1 POST /orders – Bearer

Pipeline transactionnelle d’une commande. Idempotency-Key requis.

Requête

```json
{
  "tableId": "65f...",
  "customerId": "65f...", // optionnel
  "type": "dine-in",
  "items": [
    {
      "productId": "65f...",
      "quantity": 2,
      "variant": "Grande",
      "options": [
        { "name": "Extra fromage", "price": 50 }
      ],
      "notes": "Sans oignons"
    }
  ],
  "notes": "Commande pour anniversaire"
}
```

Type de commande : dine-in, takeaway, delivery

Réponse (200)

```json
{
  "success": true,
  "data": {
    "orderId": "65f...",
    "tableStatus": "occupied",
    "kitchenQueueId": "65f...",
    "ticketUrl": "https://storage.restomanager.com/tickets/abc.pdf"
  }
}
```

Effets de bord (transaction ACID) :

· Création de la commande (status: new)
· Création des OrderItems
· Mise à jour de table.status = occupied
· Déduction des matières premières (Inventory)
· Création d’une entrée dans KitchenQueue (status: pending)
· Génération du ticket PDF (async)
· Émission Socket.IO order:new vers la cuisine

Erreurs :

· INSUFFICIENT_STOCK : quantité > stock disponible
· TABLE_OCCUPIED : table déjà occupée
· NOT_FOUND : produit ou table inexistant

---

5.2 GET /orders – Bearer

Lister les commandes.

Query params : status, tableId, customerId, from, to, page, limit.

Réponse (200) – liste de OrderDTO (voir §14.3).

---

5.3 GET /orders/active – Bearer (server)

Commandes actives (non servies) pour le serveur connecté.

Réponse (200) – liste de OrderDTO avec items.

---

5.4 GET /orders/:id – Bearer

Détail d’une commande.

Réponse (200)

```json
{
  "success": true,
  "data": {
    "order": { /* OrderDTO */ },
    "items": [ /* OrderItemDTO[] */ ],
    "table": { /* TableDTO */ },
    "customer": { /* CustomerDTO */ }
  }
}
```

---

5.5 PATCH /orders/:id/status – Bearer

Mettre à jour le statut d’une commande.

Requête

```json
{
  "status": "preparing"
}
```

Statuts valides : new, preparing, ready, served, paid, cancelled

Réponse (200) – OrderDTO mis à jour.

Effets de bord :

· new → preparing : notification en cuisine
· preparing → ready : notification au serveur (Push + In-app)
· ready → served : notification caisse

---

5.6 POST /orders/:id/cancel – Bearer (manager)

Annuler une commande (soft delete, avec remboursement du stock).

Requête

```json
{
  "reason": "Client parti"
}
```

Réponse (200) – OrderDTO avec status: cancelled.

---

6. Cuisine (Kitchen)

6.1 GET /kitchen/queue – Bearer (chef)

File d’attente des commandes en cuisine.

Query params : status (pending, preparing, ready), priority.

Réponse (200) – liste de KitchenQueueDTO (voir §14.4).

---

6.2 PATCH /kitchen/queue/:id/start – Bearer (chef)

Démarrer la préparation d’une commande.

Requête

```json
{
  "priority": 1
}
```

Réponse (200) – KitchenQueueDTO avec status: preparing.

---

6.3 PATCH /kitchen/queue/:id/ready – Bearer (chef)

Marquer une commande comme prête.

Réponse (200) – KitchenQueueDTO avec status: ready.

Effets de bord :

· Émission order:status-update vers le serveur
· Notification Push au serveur

---

6.4 GET /kitchen/queue/priority – Bearer (chef)

Commandes prioritaires (livraison rapide, clients VIP).

Réponse (200) – liste de KitchenQueueDTO triée par priorité.

---

7. Menu & Produits

7.1 GET /menu/products – Bearer

Lister les produits (actifs uniquement).

Query params : categoryId, status, search, page, limit.

Réponse (200) – liste de ProductDTO (voir §14.5).

---

7.2 GET /menu/products/:id – Bearer

Détail d’un produit avec recette.

Réponse (200)

```json
{
  "success": true,
  "data": {
    "product": { /* ProductDTO */ },
    "recipe": [
      { "inventoryId": "65f...", "name": "Tomate", "quantity": 2 }
    ]
  }
}
```

---

7.3 GET /menu/categories – Bearer

Lister les catégories de produits.

Réponse (200) – liste de CategoryDTO (voir §14.6).

---

7.4 (Admin) POST /menu/products – Bearer (admin)

Créer un nouveau produit.

Requête

```json
{
  "name": "Pizza Margherita",
  "description": "Sauce tomate, mozzarella, basilic",
  "categoryId": "65f...",
  "price": 180,
  "prepTime": 15,
  "recipe": [
    { "inventoryId": "65f...", "quantity": 0.2 },
    { "inventoryId": "65f...", "quantity": 0.15 }
  ]
}
```

Réponse (201) – ProductDTO.

---

7.5 (Admin) PUT /menu/products/:id – Bearer (admin)

Mettre à jour un produit.

Requête (champs optionnels)

```json
{
  "price": 200,
  "status": "unavailable",
  "recipe": [
    { "inventoryId": "65f...", "quantity": 0.25 }
  ]
}
```

Réponse (200) – ProductDTO.

---

7.6 (Admin) DELETE /menu/products/:id – Bearer (admin)

Désactivation (soft delete) : status: discontinued.

Réponse (204)

---

8. Stocks & Inventaire

8.1 GET /inventory – Bearer (stock_manager)

Lister les stocks de la succursale.

Query params : category, belowThreshold, search, page, limit.

Réponse (200) – liste de InventoryDTO (voir §14.7).

---

8.2 GET /inventory/:id – Bearer

Détail d’un article en stock.

Réponse (200) – InventoryDTO.

---

8.3 GET /inventory/alerts – Bearer

Alertes de stock critique.

Réponse (200)

```json
{
  "success": true,
  "data": [
    {
      "inventoryId": "65f...",
      "name": "Tomate",
      "quantity": 5,
      "threshold": 20,
      "type": "critical"
    }
  ]
}
```

---

8.4 (Admin) POST /inventory – Bearer (admin)

Créer un article en stock.

Requête

```json
{
  "name": "Tomate",
  "category": "Légumes",
  "unit": "kg",
  "quantity": 100,
  "threshold": 20,
  "unitPrice": 80,
  "supplier": "Fournisseur Local"
}
```

Réponse (201) – InventoryDTO.

---

8.5 PATCH /inventory/adjust – Bearer (stock_manager)

Ajuster le stock (inventaire physique). Idempotency-Key requis.

Requête

```json
{
  "inventoryId": "65f...",
  "quantity": 85,
  "reason": "Inventaire physique"
}
```

Réponse (200) – InventoryDTO mis à jour.

Effets de bord : Journalisation de l’écart dans logs.

---

8.6 PATCH /inventory/:id/increment – Bearer (stock_manager)

Ajouter du stock (réapprovisionnement).

Requête

```json
{
  "quantity": 50,
  "unitPrice": 85,
  "supplier": "Nouveau fournisseur"
}
```

Réponse (200) – InventoryDTO.

---

8.7 GET /inventory/stock-value – Bearer (admin)

Valeur totale du stock.

Réponse (200)

```json
{
  "success": true,
  "data": {
    "totalValue": 187500,
    "itemsCount": 45
  }
}
```

---

9. Clients & Fidélité

9.1 POST /customers – Bearer

Créer un nouveau client.

Requête

```json
{
  "firstName": "Fatimata",
  "lastName": "Diallo",
  "phone": "+22236123456",
  "email": "fatimata@example.com",
  "address": "Tevragh Zeina",
  "preferences": "Végétarien"
}
```

Réponse (201) – CustomerDTO (voir §14.8).

---

9.2 GET /customers/search – Bearer

Rechercher un client par téléphone, email ou nom.

Query param : q.

Réponse (200) – liste de CustomerDTO.

---

9.3 GET /customers/:id – Bearer

Fiche client complète.

Réponse (200)

```json
{
  "success": true,
  "data": {
    "customer": { /* CustomerDTO */ },
    "loyaltyPoints": 240,
    "totalSpent": 12400,
    "lastPurchaseAt": "2026-06-15T10:00:00Z",
    "purchaseHistory": [ /* SaleDTO[] limité à 20 */ ]
  }
}
```

---

9.4 POST /customers/:id/loyalty/redeem – Bearer

Utiliser des points fidélité.

Requête

```json
{
  "pointsToRedeem": 50
}
```

Réponse (200)

```json
{
  "success": true,
  "data": {
    "discountAmount": 50,
    "remainingPoints": 190,
    "transactionId": "65f..."
  }
}
```

1 point = 1 MRU de réduction (configurable).

---

9.5 GET /customers/loyalty/ranking – Bearer (manager)

Classement des meilleurs clients.

Réponse (200)

```json
{
  "success": true,
  "data": [
    { "customerId": "65f...", "name": "Fatimata Diallo", "points": 340, "totalSpent": 16800 }
  ]
}
```

---

10. Paiements & Caisse

10.1 POST /payments – Bearer (cashier)

Enregistrer un paiement pour une commande. Idempotency-Key requis.

Requête

```json
{
  "orderId": "65f...",
  "amount": 380,
  "method": "cash",
  "cashGiven": 500 // requis si method = cash
}
```

Méthodes : cash, card, mobile

Réponse (200)

```json
{
  "success": true,
  "data": {
    "paymentId": "65f...",
    "changeAmount": 120,
    "orderStatus": "paid",
    "loyaltyPointsEarned": 3
  }
}
```

Effets de bord :

· Mise à jour order.status = paid
· Mise à jour order.paid = true
· Création de la transaction de fidélité
· Génération de la facture PDF (async)
· Envoi par WhatsApp (async)
· Émission sale:new vers l’admin

---

10.2 GET /payments/cash-drawer – Bearer (manager)

État de la caisse.

Réponse (200)

```json
{
  "success": true,
  "data": {
    "openingBalance": 5000,
    "currentBalance": 12450,
    "cashSales": 7450,
    "cardSales": 0,
    "cashOut": 0
  }
}
```

---

10.3 POST /payments/cash-drawer/open – Bearer (manager)

Ouvrir la caisse.

Requête

```json
{
  "openingBalance": 5000
}
```

Réponse (200) – état de la caisse.

---

10.4 POST /payments/cash-drawer/close – Bearer (manager)

Fermer la caisse.

Requête

```json
{
  "declaredBalance": 12450
}
```

Réponse (200)

```json
{
  "success": true,
  "data": {
    "expectedBalance": 12450,
    "declaredBalance": 12450,
    "difference": 0,
    "cashSales": 7450
  }
}
```

---

11. Rapports & Tableau de bord

11.1 GET /dashboard/employee – Bearer

KPIs pour l’employé connecté.

Réponse (200)

```json
{
  "success": true,
  "data": {
    "todayOrdersCount": 12,
    "todayRevenue": 8740,
    "todayAverageTicket": 380,
    "activeTables": 5,
    "pendingKitchenOrders": 3
  }
}
```

---

11.2 GET /dashboard/manager – Bearer (manager)

KPIs pour le manager.

Query params : period (day, week, month, year).

Réponse (200)

```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 124000,
      "comparePrevious": 0.12
    },
    "orders": {
      "count": 340,
      "averageTicket": 365
    },
    "topProducts": [
      { "productId": "...", "name": "Pizza Margherita", "quantity": 240, "revenue": 43200 }
    ],
    "tableUtilization": 0.68,
    "alertsCount": { "critical": 2, "outOfStock": 1 }
  }
}
```

---

11.3 GET /reports/sales – Bearer (manager)

Rapport de ventes.

Query params : from, to, format (pdf, xlsx).

Réponse – fichier brut avec Content-Disposition: attachment.

---

11.4 GET /reports/profitability – Bearer (owner)

Rapport de rentabilité (CA - dépenses).

Query params : from, to, format.

---

11.5 GET /reports/stock-usage – Bearer (stock_manager)

Rapport d’utilisation des matières premières.

Query params : from, to, format.

---

12. Paramètres & Administration

12.1 (Admin) GET /admin/settings – Bearer (admin)

Récupérer la configuration système.

Réponse (200)

```json
{
  "success": true,
  "data": {
    "loyalty_points_per_100_mru": 1,
    "loyalty_redeem_rate": 1,
    "taxRate": 0,
    "currency": "MRU",
    "company_name": "RestoManager",
    "whatsapp_business_phone_id": "xxx"
  }
}
```

---

12.2 (Admin) PUT /admin/settings – Bearer (admin)

Mettre à jour la configuration.

Requête (champs optionnels)

```json
{
  "loyalty_points_per_100_mru": 2,
  "taxRate": 0.07,
  "currency": "MRU"
}
```

Réponse (200) – objet settings complet.

---

12.3 (Admin) GET /admin/logs – Bearer (admin)

Logs immuables (append-only).

Query params : cursor, limit (max 50), userId, action, from, to.

Réponse (200) – liste de LogDTO (voir §14.9).

---

12.4 (Owner) GET /admin/branches – Bearer (owner)

Lister les succursales (V2).

Réponse (200) – liste de BranchDTO.

---

13. Notifications

13.1 GET /notifications/me – Bearer

Lister les notifications in-app.

Query params : page, limit, unreadOnly.

Réponse (200)

```json
{
  "success": true,
  "data": [ /* NotificationDTO[] */ ],
  "meta": { "page": 1, "limit": 20, "total": 45, "unreadCount": 3 }
}
```

---

13.2 PATCH /notifications/:id/read – Bearer

Marquer une notification comme lue.

Réponse (200) – NotificationDTO avec isRead: true.

---

13.3 PATCH /notifications/read-all – Bearer

Marquer toutes les notifications comme lues.

Réponse (200)

```json
{
  "success": true,
  "data": { "updatedCount": 12 }
}
```

---

14. Appendice A — DTOs partagés

14.1 UserDTO

```json
{
  "_id": "65f2a1b3c4d5e6f7a8b9c0d1",
  "name": "Jean Dupont",
  "email": "jean@restomanager.mr",
  "role": "server",
  "isActive": true,
  "branchId": "65f...",
  "language": "fr",
  "lastLogin": "2026-06-27T08:14:22.000Z",
  "createdAt": "2026-01-10T00:00:00.000Z"
}
```

14.2 TableDTO

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

14.3 OrderDTO

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

14.4 KitchenQueueDTO

```json
{
  "_id": "65f...",
  "orderId": "65f...",
  "status": "preparing",
  "priority": 0,
  "startTime": "2026-06-27T14:35:00.000Z",
  "endTime": null
}
```

14.5 ProductDTO

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

14.6 CategoryDTO

```json
{
  "_id": "65f...",
  "name": "Pizzas",
  "branchId": "65f...",
  "sortOrder": 1
}
```

14.7 InventoryDTO

```json
{
  "_id": "65f...",
  "name": "Tomate",
  "category": "Légumes",
  "unit": "kg",
  "quantity": 45,
  "threshold": 20,
  "unitPrice": 80,
  "supplier": "Fournisseur Local",
  "expiryDate": "2026-07-15T00:00:00.000Z",
  "branchId": "65f..."
}
```

14.8 CustomerDTO

```json
{
  "_id": "65f...",
  "firstName": "Fatimata",
  "lastName": "Diallo",
  "phone": "+22236123456",
  "email": "fatimata@example.com",
  "address": "Tevragh Zeina",
  "preferences": "Végétarien",
  "loyaltyPoints": 240,
  "birthDate": "1990-05-15T00:00:00.000Z",
  "createdAt": "2026-02-10T00:00:00.000Z"
}
```

14.9 LogDTO

```json
{
  "_id": "65f...",
  "userId": "65f...",
  "action": "order_created",
  "entity": "Order",
  "entityId": "65f...",
  "details": { "orderAmount": 380, "itemsCount": 2 },
  "timestamp": "2026-06-27T14:32:11.000Z"
}
```

14.10 NotificationDTO

```json
{
  "_id": "65f...",
  "type": "order_ready",
  "message": "Commande #123 prête",
  "targetUserId": "65f...",
  "isRead": false,
  "relatedEntity": { "orderId": "65f..." },
  "createdAt": "2026-06-27T14:35:00.000Z"
}
```

---

15. Appendice B — Événements Socket.IO

15.1 Connexion

```javascript
const socket = io("https://api.restomanager.com", {
  auth: { token: accessToken }
});
```

Middleware Socket.IO vérifie le JWT et attache l’utilisateur à des rooms :

· user:{userId}
· branch:{branchId}
· kitchen (si rôle chef)
· admin (si rôle manager ou owner)

15.2 Événements serveur → client

order:new – à la cuisine (chefs)

```json
{
  "orderId": "65f...",
  "tableName": "Table 12",
  "items": [
    { "name": "Pizza Margherita", "quantity": 2 }
  ],
  "priority": 0,
  "timestamp": "2026-06-27T14:32:11.000Z"
}
```

order:status-update – au serveur assigné

```json
{
  "orderId": "65f...",
  "status": "ready",
  "tableName": "Table 12",
  "timestamp": "2026-06-27T14:35:00.000Z"
}
```

sale:new – à tout admin connecté

```json
{
  "orderId": "65f...",
  "totalAmount": 380,
  "cashierName": "Jean Dupont",
  "timestamp": "2026-06-27T14:40:00.000Z"
}
```

alert:stock_critical – au stock_manager et admin

```json
{
  "inventoryId": "65f...",
  "productName": "Tomate",
  "quantity": 5,
  "threshold": 20,
  "alertId": "65f..."
}
```

dashboard:update – à tout admin

```json
{
  "dailyOrdersCount": 23,
  "dailyRevenue": 8740,
  "activeTables": 8,
  "pendingKitchenOrders": 3,
  "alertsCount": 2
}
```

15.3 Événements client → serveur

Événement Payload Description
kitchen:subscribe {} Rejoindre la room kitchen (déjà fait à la connexion si rôle chef)
dashboard:subscribe {} Rejoindre la room admin (déjà fait à la connexion si rôle admin)

Aucune autre émission n’est requise : les mutations se font via les endpoints REST.

---

Fin du contrat API – RestoManager v1.0
Document à tenir à jour avec l’implémentation.