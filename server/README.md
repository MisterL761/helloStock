# HelloStock API Server

API Node.js professionnelle pour la gestion de stock Hello Fermetures.

## Architecture

```
server/
├── config/         # Configuration (database)
├── middleware/     # Middlewares (auth, logger)
├── routes/         # Routes API
├── services/       # Services (notifications)
├── utils/          # Utilitaires
├── uploads/        # Fichiers uploadés
├── logs/           # Journaux
├── app.js          # Configuration Express
├── server.js       # Point d'entrée
└── package.json    # Dépendances
```

## Installation

```bash
cd server
npm install
cp ../.env.example .env
# Configurer .env avec vos paramètres
```

## Configuration

Créer un fichier `.env` avec :

```env
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=hellostock

SESSION_SECRET=clé_secrète_complexe
CRON_TOKEN=token_pour_cron

FROM_EMAIL=lucas@hello-fermetures.com
TO_EMAIL=lucas@hello-fermetures.com,henrique@hello-fermetures.com

SMTP_HOST=localhost
SMTP_PORT=25
```

## Démarrage

```bash
# Production
npm start

# Développement (auto-reload)
npm run dev
```

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/check` - Vérifier session

### Inventaire
- `GET /api/inventory` - Liste
- `POST /api/inventory` - Créer
- `PUT /api/inventory` - Modifier
- `DELETE /api/inventory?id=X` - Supprimer

### Commandes
- `GET /api/orders` - Liste
- `POST /api/orders` - Créer
- `PUT /api/orders` - Modifier
- `DELETE /api/orders?inventory_id=X` - Supprimer

### Produits Reçus
- `GET /api/received` - Liste
- `POST /api/received` - Créer (multipart/form-data)
- `PUT /api/received` - Modifier
- `DELETE /api/received?id=X` - Supprimer

### Produits Installés
- `GET /api/installed` - Liste
- `POST /api/installed` - Marquer comme installé
- `DELETE /api/installed?id=X` - Supprimer

### Produits Défectueux
- `GET /api/defective` - Liste
- `POST /api/defective` - Créer/Transférer (multipart/form-data)
- `DELETE /api/defective?id=X` - Supprimer

### Outils
- `GET /api/tools` - Liste
- `POST /api/tools` - Créer
- `PUT /api/tools` - Modifier
- `DELETE /api/tools?id=X` - Supprimer

### Statistiques
- `GET /api/stats` - Statistiques globales

### Système
- `GET /api/check-stock?cron_token=XXX` - Vérifier stocks (notifications)
- `GET /api/health` - Health check

## Cron Jobs

Le serveur exécute automatiquement :
- **Vérification stocks** : Tous les jours à 9h (Europe/Paris)

## Utilitaires

Générer un hash bcrypt :
```bash
npm run hash "VotreMotDePasse"
```

## Sécurité

- Sessions sécurisées avec express-session
- Hashing bcrypt pour mots de passe
- Authentification requise sur toutes les routes (sauf auth)
- Logging complet dans `logs/`
- Upload sécurisé avec multer

## Production

Recommandations :
- Utiliser un reverse proxy (nginx)
- Activer HTTPS
- Configurer un gestionnaire de processus (PM2)
- Sauvegardes régulières de la BDD
- Monitoring des logs
