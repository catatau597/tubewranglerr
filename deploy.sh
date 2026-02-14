#!/bin/bash
set -e

echo "🐳 Iniciando Build da Imagem..."
docker build -t ghcr.io/catatau597/tubewranglerr:latest .

echo "🚀 Enviando para o GitHub Container Registry..."
if docker push ghcr.io/catatau597/tubewranglerr:latest; then
    echo ""
    echo "✅ SUCESSO! A imagem foi atualizada."
    echo ""
    echo "Agora, no seu servidor (master3), execute:"
    echo "  1. docker compose pull tubewranglerr"
    echo "  2. docker compose up -d tubewranglerr"
else
    echo ""
    echo "❌ ERRO DE PERMISSÃO"
    echo "Você precisa estar logado no ghcr.io para enviar a imagem."
    echo "Execute este comando no terminal e tente novamente:"
    echo "  echo <SEU_TOKEN_GITHUB> | docker login ghcr.io -u catatau597 --password-stdin"
fi
