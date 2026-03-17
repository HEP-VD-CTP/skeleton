#!/bin/sh
echo "=== backend start.sh is running! ENV: $ENV ==="

if [ "$ENV" = "production" ]; then
  cd /app/packages/backend
  bun install
  bun run prod
else
  cd /app_dev/packages/backend
  bun install
  bun run dev
fi