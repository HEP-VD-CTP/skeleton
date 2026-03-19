#!/bin/bash

echo ""
echo "=========================================="
echo "  Initialisation du projet Skeleton"
echo "=========================================="
echo ""
echo "Ce script vous aide à préparer ce template"
echo "pour commencer le développement de votre"
echo "application finale."
echo ""
echo "Vous allez être invité à fournir quelques"
echo "informations de base pour configurer le projet."
echo ""
echo "------------------------------------------"
echo ""

# Application title (one word)
while true; do
  read -p "Titre de l'application (en un seul mot, ex: Stendhal) : " APP_TITLE
  if [[ -z "$APP_TITLE" ]]; then
    echo "Erreur : le titre ne peut pas être vide."
  elif [[ "$APP_TITLE" =~ [[:space:]] ]]; then
    echo "Erreur : le titre doit être un seul mot, sans espaces."
  else
    break
  fi
done

echo ""

# Organization name
while true; do
  read -p "Nom de l'organisation (ex: HEP-VD) : " ORG_NAME
  if [[ -z "$ORG_NAME" ]]; then
    echo "Erreur : le nom de l'organisation ne peut pas être vide."
  else
    break
  fi
done

echo ""

# Volume path
while true; do
  read -p "Chemin vers le volume (ex: /Users/user/Desktop/volume/projet) : " VOLUME_PATH
  if [[ -z "$VOLUME_PATH" ]]; then
    echo "Erreur : le chemin ne peut pas être vide."
  else
    break
  fi
done

echo ""
echo "------------------------------------------"
echo ""
echo "Récapitulatif :"
echo "  Titre          : $APP_TITLE"
echo "  Organisation   : $ORG_NAME"
echo "  Chemin volume  : $VOLUME_PATH"
echo ""
