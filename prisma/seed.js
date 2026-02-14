const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Mapping of config variables to their types and categories (1-9)
const CONFIG_METADATA = {
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
  'XMLTV_SAVE_DIRECTORY': { type: 'path', category: '6', description: 'Diretório salva EPG XML' },
  'XMLTV_FILENAME': { type: 'string', category: '6', description: 'Nome arquivo EPG' },
  'EPG_DESCRIPTION_CLEANUP': { type: 'bool', category: '6', description: 'Limpa descrição EPG' },
  'PLAYLIST_GENERATION_TYPE': { type: 'string', category: '6', description: 'Estratégia geração (direct/proxy/hybrid)' },
  'TUBEWRANGLERR_URL': { type: 'string', category: '6', description: 'Base URL para proxy' },
  'PROXY_THUMBNAIL_CACHE_HOURS': { type: 'int', category: '6', description: 'Cache de thumbnails (horas)' },
  'PLAYLIST_GENERATE_DIRECT': { type: 'bool', category: '6', description: 'Habilita playlist direta' },
  'PLAYLIST_GENERATE_PROXY': { type: 'bool', category: '6', description: 'Habilita playlist proxy' },

  // Categoria 7: Imagens & Placeholders
  'PLACEHOLDER_IMAGE_URL': { type: 'string', category: '7', description: 'URL imagem placeholder' },
  'USE_INVISIBLE_PLACEHOLDER': { type: 'bool', category: '7', description: 'Usa URL comentada no M3U' },

  // Categoria 8: Técnico
  'HTTP_PORT': { type: 'int', category: '8', description: 'Porta do servidor' },
  'LOCAL_TIMEZONE': { type: 'string', category: '8', description: 'Fuso horário local' },
  'STATE_CACHE_FILENAME': { type: 'string', category: '8', description: 'Arquivo cache estado interno' },
  'STALE_HOURS': { type: 'int', category: '8', description: 'TTL para dados frescos' },
  'USE_PLAYLIST_ITEMS': { type: 'bool', category: '8', description: 'Busca otimizada por playlistItems' },
  'PROXY_ENABLE_ANALYTICS': { type: 'bool', category: '8', description: 'Log de acessos ao proxy' },

  // Categoria 9: Logs
  'LOG_LEVEL': { type: 'string', category: '9', description: 'Nível log' },
  'LOG_TO_FILE': { type: 'bool', category: '9', description: 'Salvar logs em arquivo' },
  'SMART_PLAYER_LOG_LEVEL': { type: 'string', category: '9', description: 'Nível log smart_player' },
  'SMART_PLAYER_LOG_TO_FILE': { type: 'bool', category: '9', description: 'Salvar logs smart_player em arquivo' }
};

// Default values map (fallback if not in .env)
const DEFAULTS = {
  'YOUTUBE_API_KEY': '',
  'TARGET_CHANNEL_HANDLES': '[]',
  'TARGET_CHANNEL_IDS': '[]',
  'SCHEDULER_MAIN_INTERVAL_HOURS': '4',
  'SCHEDULER_ACTIVE_START_HOUR': '7',
  'SCHEDULER_ACTIVE_END_HOUR': '22',
  'ENABLE_SCHEDULER_ACTIVE_HOURS': 'false',
  'SCHEDULER_PRE_EVENT_WINDOW_HOURS': '2',
  'SCHEDULER_PRE_EVENT_INTERVAL_MINUTES': '5',
  'SCHEDULER_POST_EVENT_INTERVAL_MINUTES': '5',
  'FULL_SYNC_INTERVAL_HOURS': '48',
  'INITIAL_SYNC_DAYS': '2',
  'RESOLVE_HANDLES_TTL_HOURS': '24',
  'MAX_SCHEDULE_HOURS': '72',
  'MAX_UPCOMING_PER_CHANNEL': '6',
  'TITLE_FILTER_EXPRESSIONS': '["ao vivo", "AO VIVO"]',
  'PREFIX_TITLE_WITH_STATUS': 'true',
  'PREFIX_TITLE_WITH_CHANNEL_NAME': 'true',
  'FILTER_BY_CATEGORY': 'false',
  'ALLOWED_CATEGORY_IDS': '["17"]',
  'CATEGORY_MAPPINGS': '{}',
  'CHANNEL_NAME_MAPPINGS': '{}',
  'KEEP_RECORDED_STREAMS': 'true',
  'MAX_RECORDED_PER_CHANNEL': '2',
  'RECORDED_RETENTION_DAYS': '2',
  'PLAYLIST_SAVE_DIRECTORY': '/app/data/m3us',
  'PLAYLIST_LIVE_FILENAME': 'playlist_live.m3u8',
  'PLAYLIST_UPCOMING_FILENAME': 'playlist_upcoming.m3u8',
  'PLAYLIST_VOD_FILENAME': 'playlist_vod.m3u8',
  'XMLTV_SAVE_DIRECTORY': '/app/data/epgs',
  'XMLTV_FILENAME': 'youtube_epg.xml',
  'EPG_DESCRIPTION_CLEANUP': 'false',
  'PLAYLIST_GENERATION_TYPE': 'hybrid',
  'TUBEWRANGLERR_URL': 'http://localhost:3000',
  'PROXY_THUMBNAIL_CACHE_HOURS': '24',
  'PLAYLIST_GENERATE_DIRECT': 'true',
  'PLAYLIST_GENERATE_PROXY': 'true',
  'PLACEHOLDER_IMAGE_URL': '',
  'USE_INVISIBLE_PLACEHOLDER': 'true',
  'HTTP_PORT': '3000',
  'LOCAL_TIMEZONE': 'America/Sao_Paulo',
  'STATE_CACHE_FILENAME': 'state_cache.json',
  'STALE_HOURS': '6',
  'USE_PLAYLIST_ITEMS': 'true',
  'PROXY_ENABLE_ANALYTICS': 'true',
  'LOG_LEVEL': 'INFO',
  'LOG_TO_FILE': 'true',
  'SMART_PLAYER_LOG_LEVEL': 'INFO',
  'SMART_PLAYER_LOG_TO_FILE': 'true'
};

function parseDotEnv(content) {
  const config = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/^["'](.*)["']$/, '$1'); // Remove quotes
      if (key && value) {
        config[key] = value;
      }
    }
  }
  return config;
}

async function main() {
  console.log('🌱 Starting seed...');

  // Try to load from DOC/.env as seed source
  let envConfig = {};
  const envPath = path.join(process.cwd(), 'DOC', '.env');
  
  if (fs.existsSync(envPath)) {
    console.log(`Loading seed values from ${envPath}`);
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envConfig = parseDotEnv(envContent);
  } else {
    console.log('No .env found in DOC/.env, using defaults.');
  }

  // Iterate over all defined config keys
  for (const [key, metadata] of Object.entries(CONFIG_METADATA)) {
    // 1. Value from ENV (seed)
    // 2. Default value
    let value = envConfig[key] !== undefined ? envConfig[key] : DEFAULTS[key];
    
    // Fallback if still undefined (shouldn't happen with DEFAULTS)
    if (value === undefined) value = '';

    // Convert boolean/list strings properly if coming from raw env
    // (In DB we store everything as string, so we just ensure it's formatted right)

    await prisma.config.upsert({
      where: { key },
      update: {
        // Only update description/metadata, keep existing user value if present?
        // Or force reset? For now, we only update if not exists (create) 
        // BUT upsert updates if found. Let's decide policy:
        // Policy: Seed only sets initial values. If key exists, we DON'T overwrite value, only metadata.
        type: metadata.type,
        category: metadata.category,
        description: metadata.description
      },
      create: {
        key,
        value: String(value),
        type: metadata.type,
        category: metadata.category,
        description: metadata.description
      }
    });
  }

  console.log('✅ Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
