#!/bin/sh
set -e

# Verifica se o arquivo do banco de dados existe, se não, faz o push
if [ ! -f "/app/data/database.db" ]; then
    echo "Creating database..."
    prisma db push --accept-data-loss
    
    echo "Seeding database..."
    # Usando node direto pois no standalone não temos npm scripts ou ts-node
    # O arquivo seed.ts original precisa ser compilado ou executado com ts-node se disponível
    # Como ts-node não está no standalone, vamos tentar rodar com node (se fosse JS) ou instalar dependência
    
    # Alternativa: apenas criar o arquivo vazio se não conseguir rodar o seed
    # touch /app/data/database.db
    echo "Skipping complex seed in production standalone mode for now. Manual seed recommended if needed."
fi

echo "Starting application..."
exec node server.js
