#!/bin/sh
set -e

echo "Starting TubeWranglerr entrypoint..."

# Ensure data directory exists
mkdir -p /app/data

# Wait for the database to be ready (optional, but good practice)
# sleep 5

# Run database migrations
echo "Running database migrations..."
if ! npx prisma migrate deploy; then
  echo "Migration failed!"
  exit 1
fi

# Run database seed
echo "Seeding database..."
if ! npx prisma db seed; then
  echo "Seeding failed!"
  exit 1
fi

# Start the application
echo "Starting application..."
exec npm start
