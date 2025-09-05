# 🎓 StudentDesk

Application de gestion d’étudiants, développée avec **Electron + React + Vite**.  
StudentDesk permet de suivre tes étudiants, leurs leçons, et de prendre des notes.  
Toutes les données sont sauvegardées en **local** et dans **iCloud Drive** (si disponible), avec un système de **backup automatique**.

---

## 🚀 Fonctionnalités principales

- ✨ **Gestion des étudiants** : ajout, modification, suppression, photo de profil
- 📝 **Gestion des leçons** : notes, devoirs, tags
- 🔍 **Recherche intelligente** (Fuse.js : recherche par prénom, nom, description)
- 📊 **Tableau de bord** : statistiques globales (nombre d’étudiants, leçons, dernier étudiant ajouté, etc.)
- ☁️ **Sauvegarde automatique** dans iCloud Drive + système de backups horodatés
- 📱 **Interface moderne et responsive**
- 🔔 **Notifications de sauvegarde** discrètes à chaque action (création, édition, suppression)

---

## 🛠️ Stack technique

- [Electron](https://www.electronjs.org/) – pour packager l’app desktop
- [React](https://react.dev/) – pour l’interface utilisateur
- [Vite](https://vitejs.dev/) – pour le build rapide
- [electron-store](https://github.com/sindresorhus/electron-store) – pour la persistance des données
- [Fuse.js](https://fusejs.io/) – pour la recherche floue
- [uuid](https://www.npmjs.com/package/uuid) – pour les identifiants uniques

---

## 💾 Sauvegarde des données

Les données sont stockées au format JSON dans :

- **iCloud Drive** (si disponible) :  
  `~/Library/Mobile Documents/com~apple~CloudDocs/StudentDesk`
- Sinon, en **local** dans :  
  `~/Library/Application Support/StudentDesk`

Chaque modification (création, édition, suppression) déclenche aussi la création d’un **backup** dans :

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
- 🏷️ Système de tags/labels avancés pour les étudiants et les leçons
- 📂 Export / import des données
- 🖼️ Drag & drop pour les photos de profil

---

## 📜 Licence

[MIT](./LICENSE) – développé par **Jérôme Butel** ✨
