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
    // Usar valor da variável de ambiente se existir
    let value = process.env[key] || ''

    // Se não houver valor no .env e for do tipo json, define um default válido
    if (!value && meta.type === 'json') {
      if (key === 'TITLE_FORMAT_CONFIG') {
        value = JSON.stringify({
          components: [
            { id: 'status', label: '[STATUS]', enabled: true },
            { id: 'channelName', label: '[NOME DO CANAL]', enabled: true },
            { id: 'eventName', label: '[NOME DO EVENTO]', enabled: true },
            { id: 'dateTime', label: '[DATA E HORA]', enabled: false },
          ],
          useBrackets: true
        });
      } else {
        value = '{}';
      }
    }
    
    const existing = await prisma.config.findUnique({ where: { key } });
    
    // Se existe e é do tipo JSON mas está vazio ou inválido, vamos forçar a correção
    let shouldUpdate = false;
    if (existing && meta.type === 'json') {
      try {
        if (!existing.value || existing.value.trim() === '') throw new Error('Empty');
        JSON.parse(existing.value);
      } catch (e) {
        shouldUpdate = true;
        console.log(`⚠️ Corrigindo configuração JSON inválida para: ${key}`);
      }
    }

    await prisma.config.upsert({
      where: { key },
      update: shouldUpdate ? { value } : {}, 
      create: { 
        key, 
        value, 
        type: meta.type, 
        category: meta.category, 
        description: meta.description 
      }
    })
  }
  console.log('✅ Configurações populadas.');

  // Configuração inicial para streaming
  await prisma.config.upsert({
    where: { key: 'STREAM_USER_AGENT' },
    update: {},
    create: {
      key: 'STREAM_USER_AGENT',
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      type: 'string',
      category: 'Streaming',
      description: 'User-Agent usado para streaming (streamlink, yt-dlp, ffmpeg)'
    }
  });
  await prisma.config.upsert({
    where: { key: 'STREAM_COOKIES_PATH' },
    update: {},
    create: {
      key: 'STREAM_COOKIES_PATH',
      value: '/app/cookies.txt',
      type: 'string',
      category: 'Streaming',
      description: 'Caminho para cookies.txt usado no streaming'
    }
  });

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
