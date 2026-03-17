#!/bin/sh
echo "=== frontend start.sh is running! ENV: $ENV ==="

if [ "$ENV" = "production" ]; then
  cd /app/packages/frontend
  npm instal
  npm run build
  node ./dist/ssr/index.js
else
  cd /app_dev/packages/frontend
  npm install
  npm run dev
fi