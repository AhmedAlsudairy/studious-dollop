#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "Database is ready!"
echo "Starting the application in development mode..."
exec "$@"
