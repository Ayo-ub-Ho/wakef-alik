# 📱 Projet Fil Rouge – Application Mobile de Mise en Relation Restaurants & Livreurs

**Formation :** Jobintech – Simplon Academy
**Spécialité :** Développement Mobile
**Type de projet :** Projet Fil Rouge (Projet de fin de formation)
**Durée :** Septembre 2025 – 01 Février 2026
**Travail :** Individuel

---

## 📌 Contexte du Projet

Dans le cadre de la formation **Développement Mobile** proposée par **Jobintech en partenariat avec Simplon Academy**, ce projet fil rouge constitue le projet final de formation.
Il a pour objectif de mettre en pratique l’ensemble des compétences acquises durant le parcours, aussi bien en **développement mobile**, **backend**, **architecture logicielle**, **gestion des données**, **sécurité** et **déploiement**.

Ce document fait office de **cahier des charges du projet**, volontairement rédigé sous forme de **README.md**, conformément aux standards professionnels de documentation logicielle utilisés dans les projets réels.

---

## 🎯 Objectifs du Projet

### Objectifs pédagogiques

- Concevoir une application mobile complète et fonctionnelle
- Mettre en place une API backend sécurisée
- Implémenter une architecture moderne et maintenable
- Appliquer les bonnes pratiques professionnelles
- Déployer une solution exploitable en production

### Objectifs fonctionnels

- Faciliter la mise en relation entre restaurants et livreurs indépendants
- Réduire les délais de recherche de livreurs disponibles
- Optimiser l’attribution des livraisons via la géolocalisation
- Proposer une solution adaptée au contexte local

---

## 🧩 Présentation Générale de l’Application

L’application mobile développée permet de **mettre en relation des restaurants locaux avec des livreurs indépendants**, afin de résoudre un problème fréquent : la difficulté de trouver rapidement un livreur disponible pour assurer la livraison des commandes.

### Problématique actuelle

- Les restaurants utilisent souvent les réseaux sociaux pour recevoir des commandes
- La livraison repose sur des solutions informelles ou des plateformes tierces
- Cela entraîne des retards, une perte de temps et une insatisfaction client

### Solution proposée

- Les restaurants publient des **demandes de livraison**
- Les livreurs inscrits reçoivent les demandes à proximité
- Un système de **géolocalisation intelligente** attribue la commande au livreur le plus proche disponible
- La zone de recherche s’élargit progressivement jusqu’à acceptation

---

## 👥 Types d’Utilisateurs

### Restaurateur

- Création de compte et authentification
- Publication de demandes de livraison
- Suivi de l’état des livraisons
- Consultation de l’historique

### Livreur Indépendant

- Création de compte et authentification
- Réception de demandes de livraison proches
- Acceptation ou refus des livraisons
- Suivi des livraisons en cours

---

## ⚙️ Choix Technologiques & Justification

### Frontend Mobile

- **React Native CLI**

  - Accès direct aux APIs natives Android / iOS
  - Meilleure maîtrise de l’environnement mobile natif
  - Choix adapté à un projet professionnel avancé

### Backend

- **Node.js + Express.js**

  - API REST performante et scalable
  - Architecture claire et modulaire
  - Large écosystème et forte communauté

### Base de Données

- **MongoDB (NoSQL) avec Mongoose**

#### Justification du choix NoSQL

- Flexibilité du schéma de données
- Adapté aux applications mobiles évolutives
- Performances élevées en lecture/écriture
- Scalabilité horizontale
- Gestion simplifiée des relations via références

---

## 🏗️ Architecture Générale

```
Application Mobile (React Native CLI)
          |
          | HTTPS + JWT
          |
Backend API (Node.js / Express)
          |
          |
Base de Données (MongoDB)
```

---

## 📐 Modélisation UML

Les diagrammes suivants seront réalisés et fournis dans le dossier `/docs` :

- Diagramme de cas d’utilisation (Use Case Diagram)
- Diagramme de classes
- Diagramme ERD (MongoDB)
- Diagramme de déploiement (Docker)

---

## 🗄️ Base de Données (MongoDB)

- Modélisation via **Mongoose**
- Collections principales :

  - Users
  - Restaurants
  - Deliveries
  - Orders

- Relations :

  - One-to-Many
  - Références entre documents

- Indexes pour optimisation des requêtes
- Validation des schémas

---

## 🌐 API Backend (Node.js / Express)

### Fonctionnalités

- API REST complète (CRUD)
- Pagination, filtrage et tri
- Gestion centralisée des erreurs
- Validation des données (Joi / Zod)
- Logging (Morgan / Winston)

### Authentification & Sécurité

- JWT (Access Token + Refresh Token)
- Hashage des mots de passe avec bcrypt
- Middlewares de protection
- Protection contre les injections NoSQL
- Gestion des variables d’environnement

---

## 📱 Application Mobile (React Native CLI)

### Navigation

- React Navigation
- Stack Navigation
- Navigation conditionnelle (authentifié / non authentifié)

### Gestion d’État

- Zustand
- Stores modulaires :

  - Auth Store
  - User Store
  - App State Store

- Persistance avec AsyncStorage
- Optimisation des re-renders

### Communication Backend

- Axios
- Intercepteurs HTTP
- Gestion automatique des tokens
- Refresh automatique des tokens expirés
- Gestion des erreurs réseau

### Sécurité Mobile

- SecureStore pour le stockage des tokens
- Routes protégées
- Déconnexion automatique

---

## 🐳 Déploiement Docker

- Dockerfile optimisé pour le backend
- docker-compose (API + MongoDB)
- .dockerignore optimisé
- Déploiement via Railway ou Render
- Certificat HTTPS / SSL activé

---

## 📦 Livrables Attendus

### Documentation

- README.md (ce document)
- Diagrammes UML
- Documentation API (Swagger)
- Guide Docker
- Documentation des stores Zustand

### Code Source

- Repository Git structuré
- Backend avec architecture claire
- Frontend mobile organisé
- Fichiers `.env.example`
- Scripts de seed MongoDB
- Collection Postman

### Application Déployée

- API accessible via URL publique
- Documentation API en ligne
- Application mobile testable
- Images Docker fonctionnelles

---

## 🗓️ Planning Prévisionnel

| Phase                | Durée      |
| -------------------- | ---------- |
| Analyse & UML        | 1 semaines |
| Backend              | 1 semaines |
| Frontend Mobile      | 2 semaines |
| Sécurité & Tests     | 1 semaines |
| Docker & Déploiement | 1 semaines |
| Documentation finale | 1 semaines |

---

## 📊 Critères d’Évaluation

- Qualité de l’architecture
- Modélisation UML
- Sécurité et validation des données
- Organisation du code
- Documentation complète
- Déploiement fonctionnel
- Performance globale

---

## &#x20;

## 🚀 Installation & Lancement (à compléter)

```
# Backend
npm install
npm run dev

# Mobile
npm install
npx react-native run-android
```

---

## 📄 Documentation Complémentaire

- `/docs/uml` → Diagrammes UML
- `/docs/api` → Swagger
- `/docs/docker` → Déploiement
