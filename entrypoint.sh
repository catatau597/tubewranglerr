#!/bin/sh
set -e

# Wait for the database to be ready (optional, but good practice)
# sleep 5 

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Run database seed
echo "Seeding database..."
npx prisma db seed

# Start the application
echo "Starting application..."
exec npm start
