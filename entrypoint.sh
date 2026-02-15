#!/bin/sh
set -e

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Run database seed
echo "Seeding database..."
npx prisma db seed

# Start the application
echo "Starting application..."
exec npm start
