#!/bin/bash

# Script para atualizar Next.js e dependências relacionadas
# Execute: bash scripts/update-next.sh

echo "🚀 Atualizando Next.js para a versão mais recente..."

# Remover node_modules e lock files
echo "📦 Limpando dependências antigas..."
rm -rf node_modules package-lock.json

# Instalar dependências atualizadas
echo "⬇️  Instalando dependências atualizadas..."
npm install

# Verificar tipos
echo "🔍 Verificando tipos TypeScript..."
npm run type-check

# Build de teste
echo "🏗️  Testando build..."
npm run build

echo "✅ Atualização concluída!"
echo ""
echo "📝 Próximos passos:"
echo "1. Execute 'npm run dev' para testar em desenvolvimento"
echo "2. Verifique se todas as funcionalidades estão funcionando"
echo "3. Consulte docs/ATUALIZACAO_NEXT_15.md para mais detalhes"

