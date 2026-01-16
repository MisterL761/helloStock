#!/bin/bash

echo "========================================="
echo "  HelloStock - Setup Node.js Server"
echo "========================================="
echo ""

if [ ! -f ".env" ]; then
  echo "📝 Création du fichier .env..."
  cp ../.env.example .env
  echo "✅ Fichier .env créé"
  echo "⚠️  Pensez à le configurer avec vos paramètres !"
  echo ""
else
  echo "✅ Fichier .env déjà présent"
  echo ""
fi

echo "📦 Installation des dépendances..."
npm install

if [ $? -eq 0 ]; then
  echo "✅ Dépendances installées avec succès"
  echo ""
else
  echo "❌ Erreur lors de l'installation des dépendances"
  exit 1
fi

echo "🔑 Génération d'un hash pour le mot de passe..."
echo "Mot de passe par défaut: H3LL0st@ck60*"
npm run hash
echo ""

echo "========================================="
echo "  ✅ Setup terminé !"
echo "========================================="
echo ""
echo "Prochaines étapes :"
echo "1. Configurer le fichier .env"
echo "2. Mettre à jour le hash dans la base de données"
echo "3. Lancer le serveur avec : npm start"
echo ""
