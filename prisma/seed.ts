// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import { CONFIG_METADATA } from '../lib/config-metadata'

dotenv.config();

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando Seed...')

  // 1. Popular Configurações a partir dos Metadados
  for (const [key, meta] of Object.entries(CONFIG_METADATA)) {
    // Usar valor da variável de ambiente se existir, senão um padrão vazio
    const value = process.env[key] || ''
    
    await prisma.config.upsert({
      where: { key },
      update: {}, // Não atualiza se já existir para preservar dados do usuário
      create: { 
        key, 
        value, 
        type: meta.type, 
        category: meta.category, 
        description: meta.description 
      }
    })
  }
  console.log('✅ Configurações populadas.')

  // 2. Popular Canais Iniciais (se definidos no .env)
  const initialChannelIds = (process.env.TARGET_CHANNEL_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
  
  if (initialChannelIds.length > 0) {
    console.log(`Inserindo ${initialChannelIds.length} canais iniciais...`)
    for (const id of initialChannelIds) {
      await prisma.channel.upsert({
        where: { id },
        update: {}, // Não altera canais existentes
        create: { 
          id, 
          title: `Canal ${id}`, // Nome temporário
          isActive: true 
        }
      })
    }
    console.log('✅ Canais iniciais inseridos.')
  } else {
    console.log('ℹ️ Nenhum canal inicial definido em TARGET_CHANNEL_IDS.')
  }
  
  console.log('Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
