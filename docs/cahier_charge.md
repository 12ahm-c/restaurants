Cahier des Charges – Système de Gestion des Restaurants (Restaurant Management System)

---

SOMMAIRE

1. Présentation du Projet
2. Problématique et Objectifs
3. Acteurs et Rôles
4. Architecture du Système
5. Module 1 – Authentification
6. Module 2 – Tableau de Bord (Dashboard)
7. Module 3 – Gestion des Commandes (Orders)
8. Module 4 – Gestion des Tables
9. Module 5 – Gestion du Cuisine (Kitchen)
10. Module 6 – Gestion du Menu (Carte)
11. Module 7 – Gestion des Clients
12. Module 8 – Gestion des Réservations
13. Module 9 – Gestion des Stocks (Inventory)
14. Module 10 – Gestion des Employés
15. Module 11 – Comptabilité et Finances
16. Module 12 – Rapports et Analyses
17. Module 13 – Paramètres du Système
18. Architecture Technique
19. Modèle de Données
20. Flux Principaux du Système
21. Sécurité et Conformité
22. Périmètre de Livraison – MVP vs V2

---

1. Présentation du Projet

RestoManager est une application web et mobile complète dédiée à la gestion des établissements de restauration (restaurants, cafés, fast-foods). Elle centralise l'ensemble des opérations quotidiennes : gestion des commandes, suivi des tables, coordination avec la cuisine, contrôle des stocks, fidélisation des clients et analyse des performances.

La philosophie du système repose sur trois piliers :

· Efficacité opérationnelle : automatisation et digitalisation des processus pour réduire les erreurs et accélérer le service.
· Visibilité en temps réel : suivi instantané de toutes les activités du restaurant.
· Décision basée sur les données : analyses approfondies pour optimiser les opérations et maximiser la rentabilité.

L'application s'adresse aussi bien aux restaurateurs indépendants qu'aux chaînes de restaurants souhaitant standardiser et optimiser leur gestion.

---

2. Problématique et Objectifs

2.1 Problèmes identifiés dans la gestion actuelle

Problème Impact concret
Gestion manuelle des commandes (papier) Erreurs de saisie, perte de commandes, temps de transmission élevé
Absence de suivi en temps réel des tables Mauvaise répartition, perte de chiffre d'affaires
Stocks mal gérés Ruptures fréquentes, gaspillage, perte financière
Pas de fidélisation structurée des clients Opportunités de revenus manquées
Absence de données analytiques Décisions basées sur l'intuition uniquement
Coordination difficile entre salle et cuisine Attente prolongée des clients, insatisfaction

2.2 Objectifs du système

· Réduire le temps de traitement des commandes de 40 %.
· Augmenter le chiffre d'affaires par table de 15 % grâce à une meilleure gestion.
· Réduire le gaspillage alimentaire de 25 % via un suivi précis des stocks.
· Fidéliser 80 % des clients grâce à un programme de fidélité intégré.
· Offrir une visibilité complète sur les performances en temps réel.
· Faciliter la coordination entre le personnel de salle et de cuisine.

---

3. Acteurs et Rôles

Rôle Responsabilités principales Accès restreint
Propriétaire Accès total à toutes les fonctionnalités, paramètres système, rapports consolidés Aucune restriction
Manager Supervision quotidienne, gestion des employés, commandes, tables, rapports Comptabilité avancée, paramètres système
Caissier Gestion des commandes, encaissement, facturation, clients Stocks, cuisine, rapports, paramètres
Serveur Gestion des tables, prise de commandes, service clients Stocks, cuisine, rapports, paramètres
Chef cuisinier Gestion de la cuisine, suivi des commandes, préparation Tables, clients, comptabilité
Responsable cuisine Gestion de la cuisine, stocks (matières premières) Salle, clients, comptabilité
Responsable stocks Gestion des inventaires, approvisionnement Salle, clients, cuisine, comptabilité
Comptable Gestion financière, rapports comptables Opérations, personnel

---

4. Architecture du Système

L'application est structurée en modules fonctionnels indépendants, chacun accessible selon les permissions de l'utilisateur :

```
┌─────────────────────────────────────────────────────────────┐
│                     AUTHENTIFICATION                       │
│        (Login / Récupération / Sélection de langue)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   TABLEAU DE BORD (DASHBOARD)              │
│         Indicateurs clés, alertes, activité en temps réel  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────────────┐
        ▼                     ▼                             ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│   ORDRES     │  │     TABLES       │  │     CUISINE          │
│  Commandes   │  │  Plan et état    │  │  Suivi des plats     │
└──────────────┘  └──────────────────┘  └──────────────────────┘
        │                     │                             │
┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│    MENU      │  │    CLIENTS       │  │    RÉSERVATIONS      │
│   Carte      │  │  Fidélisation    │  │  Planification       │
└──────────────┘  └──────────────────┘  └──────────────────────┘
        │                     │                             │
┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│   STOCKS     │  │   EMPLOYÉS       │  │   COMPTABILITÉ       │
│  Inventaire  │  │  Personnel       │  │   Finances           │
└──────────────┘  └──────────────────┘  └──────────────────────┘
        │                     │                             │
        └─────────────────────┼─────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   RAPPORTS & ANALYSES                      │
│   Ventes, bénéfices, performances, tendances, projections  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PARAMÈTRES SYSTÈME                      │
│   Données du restaurant, utilisateurs, intégrations, backup │
└─────────────────────────────────────────────────────────────┘
```

---

5. Module 1 – Authentification

5.1 Fonctionnalités

· Connexion sécurisée : email/mot de passe avec validation JWT
· Récupération de mot de passe : par email sécurisé
· Sélection de la langue : arabe, français, anglais
· Sélection de la succursale : pour les chaînes multi-sites
· Première connexion : changement obligatoire du mot de passe temporaire

5.2 Règles de sécurité

· Verrouillage après 5 tentatives échouées
· Session expirant après X minutes d'inactivité (configurable)
· Double authentification (optionnelle) pour les administrateurs

5.3 Accès par rôle

Fonctionnalité Propriétaire Manager Caissier Serveur Chef Comptable
Connexion ✅ ✅ ✅ ✅ ✅ ✅
Réinitialisation MDP ✅ ✅ ✅ ✅ ✅ ✅
Sélection langue ✅ ✅ ✅ ✅ ✅ ✅
Sélection succursale ✅ ✅ ⚠️ ⚠️ ⚠️ ⚠️
Gestion utilisateurs ✅ ⚠️ ❌ ❌ ❌ ❌

---

6. Module 2 – Tableau de Bord (Dashboard)

6.1 Vue générale

Le tableau de bord offre une vision instantanée de l'activité du restaurant :

Indicateur Description Mise à jour
Ventes du jour Chiffre d'affaires total (HT/TTC) Temps réel
Nombre de commandes Total des commandes passées Temps réel
Nombre de clients Clients uniques servis aujourd'hui Temps réel
Tables occupées Nombre de tables actuellement occupées Temps réel
Nouvelles commandes Commandes récentes Temps réel
Commandes en cours En préparation en cuisine Temps réel
Commandes prêtes Prêtes à servir Temps réel
Commandes en livraison En cours de livraison Temps réel
Bénéfices du jour Estimation du bénéfice net Temps réel
Meilleurs produits Top 5 des articles les plus vendus Quotidien
Alertes stocks Produits proches de la rupture Temps réel
Notifications Alertes et annonces du système Temps réel

6.2 Accès par rôle

Fonctionnalité Propriétaire Manager Caissier Serveur Chef
Dashboard complet ✅ ✅ ✅ (simplifié) ❌ ⚠️ (cuisine)
Ventes/CA ✅ ✅ ✅ ❌ ❌
Suivi commandes ✅ ✅ ✅ ✅ ✅
Alertes stocks ✅ ✅ ❌ ❌ ⚠️

---

7. Module 3 – Gestion des Commandes (Orders)

7.1 Types de commandes

Type Description
Sur place Consommation immédiate dans l'établissement
À emporter Commandes à récupérer (takeaway)
Livraison Commandes livrées à l'extérieur
Drive Retrait sans descendre de voiture

7.2 Création d'une commande

Étape 1 – Sélection du client

· Recherche dans la base clients
· Création d'un nouveau client (rapide)
· Commande "client anonyme" (avec option d'enregistrement)

Étape 2 – Sélection des articles

· Navigation par catégories
· Recherche par mot-clé
· Affichage avec photos et descriptions
· Gestion des modifications :
  · Ajout d'articles
  · Modification des quantités
  · Suppression d'articles
  · Ajout d'extras/options
  · Notes spéciales (sans oignon, etc.)

Étape 3 – Validation et paiement

· Modes de paiement : espèces, carte bancaire, mobile money, chèque, crédit
· Gestion de la monnaie : calcul du rendu automatique
· TVA : calcul automatique selon le pays
· Facturation : génération PDF ou ticket imprimable
· Code promo : application de réductions

7.3 Suivi des commandes

État Description Responsable
Nouvelle Commandée reçue Serveur / Caissier
En préparation En cuisine Chef
Prête Servir ou embarquer Chef
Servie Livrée au client Serveur
Clôturée Paiement finalisé Caissier

7.4 Accès par rôle

Fonctionnalité Propriétaire Manager Caissier Serveur Chef
Création commande ✅ ✅ ✅ ✅ ❌
Modification commande ✅ ✅ ⚠️ ⚠️ ❌
Annulation commande ✅ ✅ ⚠️ ❌ ❌
Paiement ✅ ✅ ✅ ❌ ❌
Suivi des commandes ✅ ✅ ✅ ✅ ✅
Impression ticket ✅ ✅ ✅ ⚠️ ⚠️

---

8. Module 4 – Gestion des Tables

8.1 Plan du restaurant

· Interface visuelle avec disposition des tables
· Zones : salon, terrasse, salle privée, bar
· Zoom et navigation intuitive

8.2 États des tables

État Description Action possible
Libre Table non utilisée Assigner un serveur, asseoir des clients
Occupée Clients installés Prendre commande, transférer, fermer
Réservée Réservation confirmée Gérer la réservation
En attente Commande validée, en attente Voir l'état de la commande

8.3 Opérations sur les tables

· Ouvrir une table : assigner un serveur et des clients
· Transférer une table : changer de zone/serveur
· Fusionner des tables : pour grands groupes
· Diviser l'addition : paiement séparé par personne
· Fermer la table : clôturer la session

8.4 Accès par rôle

Fonctionnalité Manager Serveur Caissier
Visualisation ✅ ✅ ⚠️
Ouvrir/fermer ✅ ✅ ❌
Transférer ✅ ✅ ❌
Fusionner ✅ ⚠️ ❌
Diviser addition ✅ ⚠️ ✅

---

9. Module 5 – Gestion de la Cuisine (Kitchen)

9.1 Interface de la cuisine

Commandes en attente

· Affichage priorisé (commandes les plus anciennes en haut)
· Code couleur par type (sur place, emporter, livraison)
· Affichage de la table ou du client

En cours de préparation

· Temps écoulé depuis le début
· Indicateur de priorité (commandes urgentes)
· Possibilité d'ajouter des notes internes

Prêt à servir

· Commandes terminées
· Notification automatique au serveur
· Support pour l'emballage des plats à emporter

Détails des commandes

· Liste complète des articles avec quantités
· Options et modifications spécifiées
· Notes spéciales (allergies, préférences)
· Chronomètre de préparation

9.2 Fonctionnalités spécifiques

· Alerte de temps : notification si temps de préparation dépassé
· Gestion des commandes partiellement prêtes : servir en plusieurs fois
· Intégration avec les stocks : déduction automatique des ingrédients utilisés
· Mode "rush" : priorisation optimisée en période de forte affluence

9.3 Accès par rôle

Fonctionnalité Chef Responsable cuisine Manager
Vue des commandes ✅ ✅ ⚠️
Valider commande préparée ✅ ✅ ❌
Notes internes ✅ ✅ ❌
Suivi temps préparation ✅ ✅ ✅
Consulter stocks (matières) ⚠️ ✅ ✅

---

10. Module 6 – Gestion du Menu (Carte)

10.1 Catégories

· Organisation hiérarchique du menu
· Sections : entrées, plats principaux, desserts, boissons, extras
· Possibilité d'afficher/cacher des catégories

10.2 Articles du menu

Chaque article doit contenir :

Champ Obligatoire Description
Nom ✅ Libellé de l'article (ex: "Pizza Margherita")
Description ❌ Texte descriptif (ingrédients, origine)
Image ❌ Photo illustrative de l'article
Catégorie ✅ Association à une catégorie du menu
Prix ✅ Prix de vente (TTC)
Temps de préparation ❌ Durée estimée en minutes
Statut ✅ "Disponible", "Non disponible", "Arrêté"
Visibilité client ✅ "Visible", "Masqué"
Tags ❌ Mots-clés pour recherche (végétarien, sans gluten)

10.3 Options et variantes

Tailles disponibles

· Exemple : Petit / Moyen / Grand
· Prix différenciés par taille

Extras/Suppléments

· Exemple : fromage extra, sauce, légumes supplémentaires
· Prix additionnels
· Options multiples/combo

Compositions

· Sélection de composants (ex: choisir sa base, sa sauce)
· Livraison possible en kit "personnalisé"

10.4 Gestion des stocks et recettes

Ingrédients

· Association des matières premières nécessaires
· Quantité utilisée par unité (ex: 200g de farine)
· Déduction automatique du stock lors des commandes

Recettes

· Étapes de préparation
· Guides visuels (photos, vidéos)

10.5 Accès par rôle

Fonctionnalité Propriétaire Manager Responsable stocks
Créer/modifier article ✅ ✅ ❌
Gérer les catégories ✅ ✅ ❌
Gérer les prix ✅ ✅ ❌
Gérer la disponibilité ✅ ✅ ⚠️
Recettes/ingrédients ✅ ✅ ✅

---

11. Module 7 – Gestion des Clients

11.1 Profil client

Informations personnelles

· Nom, prénom, email, téléphone
· Adresse(s) de livraison (multiples)
· Préférences alimentaires
· Date d'enregistrement

Historique des commandes

· Commandes passées avec dates
· Montants dépensés
· Articles préférés

Programme de fidélité

· Points cumulés (par transaction, par montant)
· Niveaux de membre (Bronze, Argent, Or, Platine)
· Offres spéciales et récompenses
· Bon de réduction automatique (ex: 10€ offerts pour 100€ dépensés)
· Anniversaire : cadeau spécial

11.2 Fonctionnalités avancées

· Segmentation clients : par nombre de commandes, dépenses, statut
· Campagnes marketing : envoi d'offres personnalisées
· Avis et feedback : recueil des retours clients

11.3 Accès par rôle

Fonctionnalité Manager Caissier Serveur
Recherche client ✅ ✅ ✅
Créer/éditer client ✅ ✅ ⚠️
Historique commandes ✅ ✅ ⚠️
Programme fidélité ✅ ✅ ⚠️
Segmentation/Campagnes ✅ ❌ ❌

---

12. Module 8 – Gestion des Réservations

12.1 Création d'une réservation

Champ Obligatoire
Client ✅
Date et heure ✅
Nombre de personnes ✅
Table assignée ⚠️ (auto ou manuelle)
Notes spéciales ❌

12.2 Opérations

· Création de réservation
· Modification (date, heure, nombre de personnes)
· Annulation avec motif
· Notification automatique (rappels)
· Gestion des attentes (liste d'attente)
· Gestion des tables (planning)

12.3 Accès par rôle

Fonctionnalité Manager Serveur
Créer/modifier réservation ✅ ✅
Annuler réservation ✅ ✅
Voir planning des tables ✅ ✅
Notifications rappels ✅ ⚠️

---

13. Module 9 – Gestion des Stocks (Inventory)

13.1 Matières premières

Champ Obligatoire Description
Nom ✅ Libellé de la matière première
Catégorie ⚠️ Boissons, légumes, viandes, épices
Unité de mesure ✅ kg, L, pièce, caisse
Quantité en stock ✅ Stock actuel
Seuil d'alerte ✅ Quantité minimale avant réapprovisionnement
Prix unitaire ✅ Coût d'achat
Fournisseur ❌ Référence du fournisseur
Date d'expiration ❌ Pour gestion des péremptions

13.2 Mouvements de stock

Type Description
Entrée Réapprovisionnement, commande fournisseur
Sortie Utilisation en cuisine, vente directe
Ajustement Perte, casse, inventaire physique

13.3 Opérations

· Inventaire physique : comparaison théorique/réel
· Gestion des alertes : notification pour réapprovisionnement
· Suivi des expirations : alertes produits bientôt périmés
· Historique des mouvements : traçabilité complète
· Analyse de consommation : prévisions d'approvisionnement

13.4 Accès par rôle

Fonctionnalité Manager Responsable stocks Chef
Consultation ✅ ✅ ⚠️
Entrée/ajustement ✅ ✅ ❌
Sortie cuisine ⚠️ ✅ ✅
Alertes ✅ ✅ ⚠️
Inventaire physique ✅ ✅ ❌
Export des stocks ✅ ✅ ❌

---

14. Module 10 – Gestion des Employés

14.1 Fiche employé

Champ Obligatoire Description
Identité ✅ Nom, prénom, photo
Contact ✅ Téléphone, email
Poste ✅ Rôle dans le restaurant
Salaire ✅ Taux horaire / mensuel
Date d'embauche ✅ Début du contrat
Contrat ⚠️ CDI, CDD, saisonnier

14.2 Présences et horaires

· Gestion des horaires : plannings hebdomadaires
· Pointage : horaires d'arrivée et départ
· Absences : congés, maladie, formation
· Heures supplémentaires : suivi et validation

14.3 Gestion des permissions

Principe de moindre privilège : chaque employé n'accède qu'aux fonctionnalités nécessaires à ses tâches.

14.4 Évaluation des performances

· Objectifs : quotas de vente, qualité du service
· Évaluations : auto-évaluation + supérieur
· Formation : suivi des compétences acquises

14.5 Accès par rôle

Fonctionnalité Propriétaire Manager
Créer/modifier employé ✅ ⚠️
Gestion des salaires ✅ ⚠️
Plannings/présences ✅ ✅
Évaluations ✅ ✅
Gestion des permissions ✅ ❌

---

15. Module 11 – Comptabilité et Finances

15.1 Revenus

· Ventes par jour/semaine/mois : suivi du chiffre d'affaires
· Moyens de paiement : répartition par type (espèces, carte, etc.)
· Taux de TVA : calcul automatique selon le pays
· Comptes bancaires : suivi des transactions

15.2 Dépenses

Type Description
Fournisseurs Commandes de matières premières
Salaires Charges des employés
Services Eau, électricité, gaz, internet
Loyer Charges locatives
Maintenance Réparation et entretien

15.3 Gestion de caisse

· Caisse principale : fonds de caisse, ouverture/fermeture
· Caisses secondaires : plusieurs caisses par point de vente
· Écart de caisse : suivi des différences
· Dépôts bancaires : rapprochement bancaire

15.4 Rapports financiers

· Bilan comptable (compte de résultat)
· Trésorerie : prévisions de flux
· Compte de résultat : bénéfice/perte
· Bénéfice net : par période
· Rentabilité des produits : marge par article

15.5 Accès par rôle

Fonctionnalité Propriétaire Manager Comptable
Voir les revenus ✅ ⚠️ ✅
Voir les dépenses ✅ ⚠️ ✅
Gestion caisse ✅ ⚠️ ✅
Rapports financiers ✅ ❌ ✅
Paramètres comptables ✅ ❌ ⚠️

---

16. Module 12 – Rapports et Analyses

16.1 Types de rapports

Rapport Description Fréquence
Ventes Revenus par produit, catégorie, période Daily, weekly, monthly
Bénéfices Marge brute par article Daily, weekly, monthly
Articles Top/bottom produits, tendances Monthly
Employés Performance par personne Monthly
Stocks Évolution, inventaire, pertes Weekly
Clients Fidélité, comportement d'achat Monthly
Franchises Pour les chaînes de restaurants Monthly

16.2 Visualisation

· Graphiques interactifs (courbes, histogrammes, camemberts)
· Tableaux dynamiques (trie, filtre)
· Export : PDF, Excel, CSV
· Programmation d'envoi automatique par email

16.3 Accès par rôle

Fonctionnalité Propriétaire Manager Comptable
Rapports de vente ✅ ✅ ⚠️
Rapports de bénéfices ✅ ⚠️ ✅
Rapports employés ✅ ✅ ❌
Rapports clients ✅ ✅ ❌
Rapports stocks ✅ ⚠️ ❌
Export/PDF/Excel ✅ ✅ ✅

---

17. Module 13 – Paramètres du Système

17.1 Informations du restaurant

· Nom, adresse, téléphone, email
· Logo, horaires d'ouverture
· Taxe (TVA) : taux, incluse/exclue

17.2 Gestion des succursales

· Pour les chaînes de restaurants
· Paramètres indépendants par site
· Synchronisation des données consolidées

17.3 Périphériques et intégrations

· Imprimantes : tickets, factures
· Caisse : tiroir-caisse, écran client
· Intégrations : plateformes de livraison (UberEats, etc.)
· API : connecteurs ERP, CRM

17.4 Options système

· Langues disponibles (ajout/suppression)
· Devise par défaut
· Formats de date/heure
· Sauvegarde automatique : planification, rétention, restauration
· Logs d'audit : suivi des modifications

17.5 Accès par rôle

Fonctionnalité Propriétaire Manager
Données restaurant ✅ ⚠️
Succursales ✅ ❌
Périphériques ✅ ❌
Intégrations ✅ ❌
Options système ✅ ❌
Sauvegarde/restauration ✅ ❌
Logs audit ✅ ❌

---

18. Architecture Technique

18.1 Stack technologique

Couche Technologie Justification
Frontend React.js + Vite + TypeScript + TailwindCSS Développement rapide, typage fort, performance optimisée
Backend Node.js + Express.js Écosystème mature, API REST, WebSocket temps réel
Base de données MongoDB Atlas Schéma flexible, index géospatiaux, scalabilité
Cache / Sessions Redis (optionnel) Gestion sessions, file d'attente notifications
Notifications WebSocket / Firebase Cloud Messaging Mises à jour en temps réel, alertes push
Paiements Stripe / Paypal / Mobile money APIs Intégration sécurisée des paiements
Stockage fichiers AWS S3 (ou équivalent) Photos, factures, documents
Tâches planifiées node-cron Sauvegardes automatiques, rapports
Hébergement Docker / Kubernetes / Cloud (AWS/Azure) Scalabilité, résilience

18.2 Architecture globale

```
┌──────────────────────────────────────────────┐
│            CLIENT WEB / MOBILE                │
│     React SPA (PWA) avec Capacitor           │
└──────────────────────────────────────────────┘
                    │ HTTPS
                    ▼
┌──────────────────────────────────────────────┐
│                API GATEWAY                    │
│        Express.js + Middleware Auth          │
└──────────────────────────────────────────────┘
                    │
    ┌───────────────┼──────────────────────┐
    ▼               ▼                      ▼
┌────────┐    ┌─────────────┐    ┌──────────────┐
│MongoDB │    │   Redis     │    │  Services    │
│Atlas   │    │   Cache     │    │  (notif,     │
│(Datas) │    │   Sessions  │    │  export, pdf)│
└────────┘    └─────────────┘    └──────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│          STOCKAGE FICHIERS (S3)              │
└──────────────────────────────────────────────┘
```

---

19. Modèle de Données

19.1 Collections principales

Collection Champs principaux Références
users _id, name, email, passwordHash, role, isActive, lastLogin, language, branchId branchId → branches
branches _id, name, address, phone, taxRate, currency, openingHours, logoUrl –
categories _id, name, description, displayOrder, isActive, parentCategoryId parentCategoryId → categories
products _id, name, description, imageUrl, categoryId, price, priceHT, taxRate, prepTime, status, isVisible, tags, ingredients[] categoryId → categories
productVariants _id, productId, name, price, stock, isActive productId → products
productOptions _id, productId, name, price, isActive, isMultiple productId → products
tables _id, name, branchId, capacity, status, zone, position (x,y) branchId → branches
customers _id, firstName, lastName, phone, email, address, preferences, loyaltyPoints, birthDate –
orders _id, branchId, customerId, tableId, type (sur place/emporter/livraison), status, totalHT, totalTTC, paid, paymentMethod, createdAt, updatedAt branchId → branches, customerId → customers, tableId → tables
orderItems _id, orderId, productId, variantId, quantity, unitPrice, options[], notes, total orderId → orders, productId → products
kitchenOrders _id, orderId, status (pending/preparing/ready/served), startTime, endTime, priority orderId → orders
reservations _id, customerId, tableId, date, time, numberOfGuests, status, notes customerId → customers, tableId → tables
inventory _id, name, category, unit, quantity, threshold, unitPrice, supplier, expiryDate, branchId branchId → branches
inventoryTransactions _id, inventoryId, type (in/out/adjust), quantity, reason, userId, date inventoryId → inventory, userId → users
employees _id, userId, branchId, position, hireDate, salary, contractType, schedule, isActive userId → users, branchId → branches
attendance _id, employeeId, date, checkIn, checkOut, hours, status employeeId → employees
payments _id, orderId, amount, method, status, transactionId, date orderId → orders
loyalty _id, customerId, points, tier, createdAt, updatedAt customerId → customers
notifications _id, userId, type, title, message, read, date, data (JSON) userId → users
logs _id, userId, action, entity, entityId, details (JSON), ip, timestamp userId → users (immuable)
settings _id, branchId, key, value, updatedBy, updatedAt branchId → branches, updatedBy → users

19.2 Index MongoDB

· Index unique : email dans users, name dans categories (par branche)
· Index géospatial : tables.position
· Index text : products.name, customers.name/phone
· Index pour performance : orders.branchId, orders.status, orders.createdAt

---

20. Flux Principaux du Système

20.1 Flux de commande standard (sur place)

```
1. Serveur prend commande
   ├── Client existant ? (recherche)
   └── Client nouveau (création)

2. Création de la commande
   ├── Sélection des articles
   ├── Ajout des options/extras
   └── Validation (envoi en cuisine)

3. En cuisine
   ├── Chef reçoit la commande
   ├── Préparation des plats
   ├── Dédoublement automatique des stocks
   └── Validation "Prêt"

4. Service
   ├── Serveur reçoit notification (prêt)
   ├── Service au client
   └── Mise à jour du statut table (en cours)

5. Paiement
   ├── Caissier note paiement
   ├── Choix du mode de paiement
   └── Impression ticket / facture

6. Fin de session
   ├── Fermeture de la table
   ├── Mise à jour des statistiques
   ├── Points de fidélité clients
   └── Mise à jour des rapports en temps réel
```

20.2 Flux de gestion des stocks

```
1. Commande fournisseur
   ├── Alerte seuil min atteint
   ├── Création commande (manuel/auto)
   ├── Réception de livraison
   └── Mise à jour du stock

2. Sortie de cuisine
   ├── Commande en cuisine
   ├── Déduction des ingrédients
   └── Vérification stock insuffisant

3. Inventaire physique
   ├── Saisie des quantités réelles
   ├── Comparaison avec théorique
   ├── Ajustements automatiques
   └── Rapport d'inventaire
```

20.3 Flux du programme de fidélité

```
1. Client effectue commande
   ├── Montant total
   └── Points gagnés (ex: 1 point / €)

2. Calcul et mise à jour
   ├── Points ajoutés
   ├── Vérification du niveau (Bronze/Argent/Or)
   └── Envoi de notification de nouveau niveau

3. Utilisation des points
   ├── Client demande utilisation (commande)
   ├── Validation par le caissier
   ├── Déduction des points
   └── Réduction appliquée

4. Avantages anniversaire
   ├── Vérification date de naissance
   ├── Offre spéciale personnalisée
   └── Notification push/email
```

---

21. Sécurité et Conformité

21.1 Contrôle d'accès

· Authentification par JWT avec expiration
· Middleware d'autorisation sur chaque route (vérification du rôle)
· Protection CSRF pour les formulaires sensibles
· Principe de moindre privilège : chaque utilisateur n'a accès qu'à ses fonctionnalités
· Sessions robustes (Redis optionnel)

21.2 Protection des données

· Mots de passe hashés avec bcrypt (coût 12)
· Transport des données en HTTPS (TLS 1.2+)
· Données personnelles des clients sécurisées (RGPD/Locale)
· Anonymisation optionnelle pour les rapports

21.3 Traçabilité et audit

· Logs immuables : toutes les modifications créées, modifiées, supprimées
· Traçabilité incluant userId, IP, horodatage
· Interface de consultation des logs pour administrateurs

21.4 Sauvegarde et résilience

· Sauvegarde automatique quotidienne (MongoDB Atlas Backup)
· Rétention 30 jours (configurable)
· Snapshot pour restauration (documentée)
· Plan de reprise d'activité (procédure de récupération)

21.5 Conformité

· Respect des réglementations locales sur la TVA, les données personnelles, etc.
· Conformité financière (édition des factures conformes)
· Accessibilité (RGAA ou locale)

---

22. Périmètre de Livraison – MVP vs V2

22.1 MVP (Livraison initiale)

Fonctionnalité Priorité Remarques
Authentification + Rôles ✅ Base obligatoire
Tableau de bord (statistiques de base) ✅ Ventes, commandes, tables
Gestion des commandes (CRUD + paiement) ✅ Types : sur place, emporter
Gestion des tables (état et statut) ✅ Ouverture, fermeture, transfert
Interface cuisine (base) ✅ Affichage commandes, validation
Menu (CRUD + catégories) ✅ Articles, prix, disponibilité
Gestion des clients (CRUD + historique) ✅ Fidélité (points) inclus
Réservations (CRUD) ✅ Planification de base
Stocks (gestion simple) ✅ Suivi des matières premières
Gestion des employés (CRUD) ✅ Base, présences
Rapports (export CSV / PDF) ✅ Ventes, bénéfices
Paramètres système (de base) ✅ Restaurant, devise, langue
Caisse (ouverture/fermeture) ✅ -
Factures (impression) ✅ Tickets

22.2 V2 (Améliorations)

Fonctionnalité Remarques
Multi-suites Gestion de plusieurs restaurants/succursales
Programme de fidélité avancé Offres personnalisées, segmentation, campagnes
Intégration livraison UberEats, Glovo, etc. (API)
Gestion des recettes Étapes de préparation, ingrédients
Prévision de stocks Machine learning pour approvisionnement
Planification de personnel Gestion des horaires et équipes
Application client Commande en ligne, suivi commande, avis
Notifications push avancées Marketing, promotions, anniversaire
Analytics avancé Prédictions, modèles d'affaires
Synchronisation temps réel WebSocket pour une vue instantanée
Gestion des menus multiples Saison, menu du jour, etc.
Biométrie (empreinte) Pointage horaire des employés
Statistiques avancées Chaufferie, rentabilité, taux de conversion

---

23. Annexes

23.1 Glossaire des termes

Terme Définition
CA Chiffre d'affaires
TTC Toutes taxes comprises
HT Hors taxes
MVP Minimum Viable Product
CRUD Create, Read, Update, Delete
TVA Taxe sur la valeur ajoutée
JWT JSON Web Token
SRS Software Requirements Specification

---

23.2 Exemple de navigation par rôle

Propriétaire :

```
Dashboard → Commandes → Tables → Cuisine → Menu → Clients → Réservations → Stocks → Employés → Comptabilité → Rapports → Paramètres
```

Manager :

```
Dashboard → Commandes → Tables → Cuisine → Menu → Clients → Réservations → Stocks → Employés → Rapports
```

Caissier :

```
Dashboard → Commandes → Clients → Paramètres (restreint)
```

Serveur :

```
Tables → Commandes → Clients → Réservations
```

Chef cuisinier :

```
Cuisine → (Stocks : consultation des matières)
```

---

24. Conclusion

Ce cahier des charges constitue la base de référence pour le développement du système de gestion des restaurants. Toute modification fonctionnelle ou technique devra faire l'objet d'un avenant validé par le maître d'ouvrage et l'équipe projet.

Version : 1.0
Date : [Date actuelle]
Rédacteur : Chef de Projet / Analyste Système