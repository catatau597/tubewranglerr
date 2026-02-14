#!/bin/sh
set -e

# Verifica se o arquivo do banco de dados existe, se não, faz o push
if [ ! -f "/app/data/database.db" ]; then
    echo "Creating database..."
    npx prisma db push --accept-data-loss
    
    echo "Seeding database..."
    npm run seed
fi

echo "Starting application..."
exec npm start
