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
  read -p "Chemin vers le volume (ex: /Users/user/Desktop/volumes) : " VOLUME_PATH
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

# ──────────────────────────────────────────────
# Create volume directory if it does not exist
# ──────────────────────────────────────────────
FULL_VOLUME_PATH="$VOLUME_PATH/$APP_TITLE_LOWER"

if [[ ! -d "$FULL_VOLUME_PATH" ]]; then
  mkdir -p "$FULL_VOLUME_PATH"
  echo "Dossier volume créé : $FULL_VOLUME_PATH"
else
  echo "Dossier volume existant : $FULL_VOLUME_PATH"
fi

echo ""

# ──────────────────────────────────────────────
# Generate .env from .env.example
# ──────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"
ENV_FILE="$PROJECT_ROOT/.env"

if [[ ! -f "$ENV_EXAMPLE" ]]; then
  echo "Erreur : fichier .env.example introuvable à $ENV_EXAMPLE"
  exit 1
fi

APP_TITLE_LOWER=$(echo "$APP_TITLE" | tr '[:upper:]' '[:lower:]')

sed \
  -e "s|^ORGANIZATION=.*|ORGANIZATION=$ORG_NAME|" \
  -e "s|^FRONTEND_TITLE=.*|FRONTEND_TITLE=$APP_TITLE_LOWER|" \
  -e "s|^VOLUME_PATH=.*|VOLUME_PATH=$FULL_VOLUME_PATH|" \
  -e "s|^POSTGRES_DB=.*|POSTGRES_DB=$APP_TITLE_LOWER|" \
  "$ENV_EXAMPLE" > "$ENV_FILE"

echo "Fichier .env généré avec succès à $ENV_FILE"
echo ""

# ──────────────────────────────────────────────
# Rename @skeleton/ scope in all package.json
# ──────────────────────────────────────────────
find "$PROJECT_ROOT" -name "package.json" -not -path "*/node_modules/*" | while read -r pkg; do
  if grep -q '"@skeleton/' "$pkg"; then
    sed -i '' "s|@skeleton/|@${APP_TITLE_LOWER}/|g" "$pkg"
    echo "Renommé @skeleton/ → @${APP_TITLE_LOWER}/ dans $pkg"
  fi
done

echo ""

# ──────────────────────────────────────────────
# Rename skeleton networks in docker-compose.yml
# ──────────────────────────────────────────────
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

if [[ -f "$COMPOSE_FILE" ]]; then
  sed -i '' \
    -e "s|skeleton_nginx_network|${APP_TITLE_LOWER}_nginx_network|g" \
    -e "s|skeleton_network|${APP_TITLE_LOWER}_network|g" \
    -e "s|skeleton-nginx|${APP_TITLE_LOWER}-nginx|g" \
    "$COMPOSE_FILE"
  echo "Renommé réseaux skeleton → ${APP_TITLE_LOWER} dans docker-compose.yml"
fi

echo ""
echo "=========================================="
echo "  Initialisation terminée !"
echo "=========================================="
echo ""
echo "Pour lancer le projet :"
echo "  cd .."
echo "  docker compose up --build"
echo ""
echo "Le projet sera disponible à :"
echo "  https://localhost:8443/"
echo ""
