# 🎓 StudentDesk

Application de gestion et de **suivi pédagogique** des étudiants, développée avec **Electron + React + Vite**.  
StudentDesk permet de gérer tes étudiants, leurs leçons, et de suivre leur progression (objectifs, niveaux CEFR, tags).  
Toutes les données sont sauvegardées en **local** et dans **iCloud Drive** (si disponible), avec un système de **backup automatique**.

## 🚀 Fonctionnalités principales

- 👤 **Gestion des étudiants** : ajout, modification, suppression, photo de profil
- 📝 **Gestion des leçons** : prise de notes, devoirs, tags personnalisés
- 🎯 **Suivi pédagogique** :
  - Définition d’objectifs individuels
  - Suivi de progression (% complété)
  - Évaluation selon le cadre **CEFR** (oral, écrit, interaction, grammaire, vocabulaire)
- 🔍 **Recherche intelligente** (Fuse.js) : recherche par prénom, nom, description
- 📊 **Tableau de bord moderne** :
  - Statistiques globales (nombre d’étudiants, leçons, dernier étudiant ajouté, étudiant le plus actif, etc.)
  - Activité récente (ajouts, modifications, suppressions d’étudiants et de leçons)
- 📂 **Import CSV** : ajout rapide d’étudiants depuis un fichier Excel/Numbers exporté
- ☁️ **Sauvegarde automatique** dans iCloud Drive + système de backups horodatés
- 📱 **Interface moderne et responsive**
- 🔔 **Notifications discrètes** à chaque action (création, édition, suppression, sauvegarde)

---

## 🛠️ Stack technique

- [Electron](https://www.electronjs.org/) – pour packager l’app desktop
- [React](https://react.dev/) – pour l’interface utilisateur
- [Vite](https://vitejs.dev/) – pour le build rapide
- [electron-store](https://github.com/sindresorhus/electron-store) – pour la persistance des données
- [Fuse.js](https://fusejs.io/) – pour la recherche floue
- [uuid](https://www.npmjs.com/package/uuid) – pour les identifiants uniques
- [PapaParse](https://www.papaparse.com/) – pour l’import CSV

---

## 💾 Sauvegarde des données

Les données sont stockées au format JSON dans :

- **iCloud Drive** (si disponible) :  
  `~/Library/Mobile Documents/com~apple~CloudDocs/StudentDesk`
- Sinon, en **local** dans :  
  `~/Library/Application Support/StudentDesk`

Chaque modification déclenche aussi la création d’un **backup horodaté** dans :

```
~/Library/Mobile Documents/com~apple~CloudDocs/StudentDesk/backups/
```

(max 10 fichiers conservés automatiquement).

---

## ⚡ Installation

Clone le repo et installe les dépendances :

```bash
git clone https://github.com/<TON-USER>/StudentDesk.git
cd StudentDesk
npm install
```

Lance l’app en mode dev :

```bash
npm run dev
```

---

## 📦 Build

Pour générer l’application macOS :

```bash
npm run build
```

L’app sera disponible dans `dist/mac-arm64/StudentDesk.app`.

---

## 📝 TODO / Améliorations futures

- 🔑 Chiffrement des données locales
- 🔄 Sync incrémentale avec iCloud
- 🖼️ Drag & drop pour les photos de profil
- 📤 Export complet des données (JSON, CSV, PDF)
- 📆 Planification de leçons + rappels
- 📊 Widgets / vue calendrier pour le suivi global

---

## 📜 Licence

[MIT](./LICENSE) – développé par **Jérôme Butel** ✨
