// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const prisma = new PrismaClient()

// Mapping of config variables to their types and categories (1-9)
const CONFIG_METADATA: Record<string, { type: string, category: string, description: string }> = {
  // Categoria 1: API & Canais
  'YOUTUBE_API_KEY': { type: 'string', category: '1', description: 'Chave da API do YouTube' },
  'TARGET_CHANNEL_HANDLES': { type: 'list', category: '1', description: 'Lista de @handles dos canais' },
  'TARGET_CHANNEL_IDS': { type: 'list', category: '1', description: 'Lista de IDs dos canais' },
  
  // Categoria 2: Agendador
  'SCHEDULER_MAIN_INTERVAL_HOURS': { type: 'int', category: '2', description: 'Intervalo da busca principal (horas)' },
  'SCHEDULER_ACTIVE_START_HOUR': { type: 'int', category: '2', description: 'Hora de início da busca ativa (0-23)' },
  'SCHEDULER_ACTIVE_END_HOUR': { type: 'int', category: '2', description: 'Hora de fim da busca ativa (0-23)' },
  'ENABLE_SCHEDULER_ACTIVE_HOURS': { type: 'bool', category: '2', description: 'Ativar busca apenas em horário específico' },
  'SCHEDULER_PRE_EVENT_WINDOW_HOURS': { type: 'int', category: '2', description: 'Janela pré-evento (horas)' },
  'SCHEDULER_PRE_EVENT_INTERVAL_MINUTES': { type: 'int', category: '2', description: 'Intervalo pré-evento (minutos)' },
  'SCHEDULER_POST_EVENT_INTERVAL_MINUTES': { type: 'int', category: '2', description: 'Intervalo pós-evento (minutos)' },
  'FULL_SYNC_INTERVAL_HOURS': { type: 'int', category: '2', description: 'Intervalo de sincronização completa (horas)' },
  'INITIAL_SYNC_DAYS': { type: 'int', category: '2', description: 'Dias para busca inicial (0=tudo)' },
  'RESOLVE_HANDLES_TTL_HOURS': { type: 'int', category: '2', description: 'TTL do cache de handles (horas)' },

  // Categoria 3: Filtros
  'MAX_SCHEDULE_HOURS': { type: 'int', category: '3', description: 'Máximo de horas no futuro para agendamento' },
  'MAX_UPCOMING_PER_CHANNEL': { type: 'int', category: '3', description: 'Máximo de agendamentos por canal' },
  'TITLE_FILTER_EXPRESSIONS': { type: 'list', category: '3', description: 'Expressões a remover do título' },
  'PREFIX_TITLE_WITH_STATUS': { type: 'bool', category: '3', description: 'Prefixar título com [Status]' },
  'PREFIX_TITLE_WITH_CHANNEL_NAME': { type: 'bool', category: '3', description: 'Prefixar título com [Canal]' },
  'FILTER_BY_CATEGORY': { type: 'bool', category: '3', description: 'Filtrar por categoria do YouTube' },
  'ALLOWED_CATEGORY_IDS': { type: 'list', category: '3', description: 'IDs de categorias permitidas' },

  // Categoria 4: Mapeamentos
  'CATEGORY_MAPPINGS': { type: 'dict', category: '4', description: 'Mapeamento ID -> Nome Categoria' },
  'CHANNEL_NAME_MAPPINGS': { type: 'dict', category: '4', description: 'Mapeamento Nome API -> Nome Curto' },

  // Categoria 5: VOD
  'KEEP_RECORDED_STREAMS': { type: 'bool', category: '5', description: 'Manter streams gravados (VOD)' },
  'MAX_RECORDED_PER_CHANNEL': { type: 'int', category: '5', description: 'Máximo de VODs por canal' },
  'RECORDED_RETENTION_DAYS': { type: 'int', category: '5', description: 'Dias de retenção de VOD' },

  // Categoria 6: Arquivos & Playlists
  'PLAYLIST_SAVE_DIRECTORY': { type: 'path', category: '6', description: 'Diretório de playlists' },
  'PLAYLIST_LIVE_FILENAME': { type: 'string', category: '6', description: 'Nome do arquivo Live' },
  'PLAYLIST_UPCOMING_FILENAME': { type: 'string', category: '6', description: 'Nome do arquivo Upcoming' },
  'PLAYLIST_VOD_FILENAME': { type: 'string', category: '6', description: 'Nome do arquivo VOD' },
  'XMLTV_SAVE_DIRECTORY': { type: 'path', category: '6', description: 'Diretório do XMLTV' },
  'XMLTV_FILENAME': { type: 'string', category: '6', description: 'Nome do arquivo XMLTV' },
  'EPG_DESCRIPTION_CLEANUP': { type: 'bool', category: '6', description: 'Limpar descrição do EPG' },
  'PLAYLIST_GENERATION_TYPE': { type: 'string', category: '6', description: 'Tipo de geração (direct/proxy/hybrid)' },
  'TUBEWRANGLERR_URL': { type: 'url', category: '6', description: 'URL base do TubeWranglerr' },
  'PROXY_THUMBNAIL_CACHE_HOURS': { type: 'int', category: '6', description: 'Cache de thumbnails (horas)' },
  'PLAYLIST_GENERATE_DIRECT': { type: 'bool', category: '6', description: 'Gerar playlist direta' },
  'PLAYLIST_GENERATE_PROXY': { type: 'bool', category: '6', description: 'Gerar playlist proxy' },

  // Categoria 7: Imagens
  'PLACEHOLDER_IMAGE_URL': { type: 'url', category: '7', description: 'URL da imagem de placeholder' },
  'USE_INVISIBLE_PLACEHOLDER': { type: 'bool', category: '7', description: 'Usar placeholder invisível' },

  // Categoria 8: Técnico
  'HTTP_PORT': { type: 'int', category: '8', description: 'Porta HTTP' },
  'LOCAL_TIMEZONE': { type: 'string', category: '8', description: 'Fuso Horário' },
  'STATE_CACHE_FILENAME': { type: 'string', category: '8', description: 'Nome do arquivo de cache (legado)' },
  'STALE_HOURS': { type: 'int', category: '8', description: 'Horas para considerar stream "velho"' },
  'USE_PLAYLIST_ITEMS': { type: 'bool', category: '8', description: 'Usar playlistItems (otimizado)' },
  'PROXY_ENABLE_ANALYTICS': { type: 'bool', category: '8', description: 'Ativar analytics do proxy' },

  // Categoria 9: Logs
  'LOG_LEVEL': { type: 'string', category: '9', description: 'Nível de log geral' },
  'LOG_TO_FILE': { type: 'bool', category: '9', description: 'Salvar logs em arquivo' },
  'SMART_PLAYER_LOG_LEVEL': { type: 'string', category: '9', description: 'Nível de log do player' },
  'SMART_PLAYER_LOG_TO_FILE': { type: 'bool', category: '9', description: 'Salvar logs do player em arquivo' },
}

async function main() {
  console.log('🌱 Iniciando Seed...')

  // Tenta ler o .env do diretório DOC
  const envPath = path.resolve(process.cwd(), 'DOC', '.env')
  let envConfig: Record<string, string> = {}
  
  if (fs.existsSync(envPath)) {
    console.log(`Lendo .env de: ${envPath}`)
    const envContent = fs.readFileSync(envPath)
    envConfig = dotenv.parse(envContent)
  } else {
    console.warn('⚠️ DOC/.env não encontrado. Usando variáveis de ambiente ou padrões.')
    envConfig = process.env as Record<string, string>
  }

  // 1. Popular Configurações
  for (const [key, meta] of Object.entries(CONFIG_METADATA)) {
    let value = envConfig[key] || ''
    
    // Tratamento de valores padrão caso não estejam no .env
    if (!value) {
       // ... definir padrões básicos se necessário ...
    }

    await prisma.config.upsert({
      where: { key },
      update: { value, type: meta.type, category: meta.category, description: meta.description },
      create: { key, value, type: meta.type, category: meta.category, description: meta.description }
    })
  }
  console.log('✅ Configurações populadas.')

  // 2. Popular Canais Iniciais
  const handles = (envConfig['TARGET_CHANNEL_HANDLES'] || '').split(',').map(s => s.trim()).filter(Boolean)
  const ids = (envConfig['TARGET_CHANNEL_IDS'] || '').split(',').map(s => s.trim()).filter(Boolean)
  const mappingStr = envConfig['CHANNEL_NAME_MAPPINGS'] || ''
  
  // Parse Mappings "Name|ShortName,..."
  const mappings: Record<string, string> = {}
  mappingStr.split(',').forEach(pair => {
    const [original, short] = pair.split('|')
    if (original && short) mappings[original.trim()] = short.trim()
  })

  // Inserir Channels por ID (Handles serão resolvidos pelo worker depois)
  for (const id of ids) {
    await prisma.channel.upsert({
      where: { id },
      update: { isActive: true },
      create: { id, title: id, isActive: true } // Título provisório
    })
  }
  
  // Inserir Handles (Como IDs provisórios ou campo separado? O schema tem campo handle)
  // O ideal é que o worker resolva o handle para ID. Vamos salvar o handle num canal "placeholder" se não tivermos ID?
  // Pela lógica do get_streams.py, ele resolve handles para IDs.
  // Vamos deixar os handles na Config TARGET_CHANNEL_HANDLES e o worker cria os Channels reais.
  
  console.log(`✅ ${ids.length} canais (IDs) iniciais inseridos. Handles serão processados pelo scheduler.`)
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
