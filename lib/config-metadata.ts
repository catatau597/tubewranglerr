// lib/config-metadata.ts

export const CATEGORY_MAP: Record<string, string> = {
  '1': 'API & Canais',
  '2': 'Agendador',
  '3': 'Conteúdo & Filtros',
  '4': 'Mapeamentos',
  '5': 'Retenção (VOD)',
  '6': 'Arquivos de Saída',
  '7': 'Mídia & Placeholders',
  '8': 'Técnico',
  '9': 'Logs'
};

export const CONFIG_METADATA: Record<string, { type: string; category: string; description: string }> = {
  // Categoria 1: API & Canais
  YOUTUBE_API_KEY: { type: 'list', category: 'API & Canais', description: 'Chave(s) da API do YouTube. Suporta múltiplas chaves (round-robin/fallback).' },
  TARGET_CHANNEL_HANDLES: { type: 'list', category: 'API & Canais', description: 'Lista de @handles dos canais fonte.' },
  TARGET_CHANNEL_IDS: { type: 'list', category: 'API & Canais', description: 'Lista de IDs de canais fonte (fallback ao handle).' },
  RESOLVE_HANDLES_TTL_HOURS: { type: 'int', category: 'API & Canais', description: 'TTL (horas) para confiar no cache de resolução de @handles.' },

  // Categoria 2: Agendador
  SCHEDULER_MAIN_INTERVAL_HOURS: { type: 'int', category: 'Agendador', description: 'Intervalo principal em horas para busca de novos vídeos.' },
  SCHEDULER_ACTIVE_START_HOUR: { type: 'int', category: 'Agendador', description: 'Hora de início (0-23) para janela de busca ativa.' },
  SCHEDULER_ACTIVE_END_HOUR: { type: 'int', category: 'Agendador', description: 'Hora de fim (0-23) para janela de busca ativa.' },
  ENABLE_SCHEDULER_ACTIVE_HOURS: { type: 'bool', category: 'Agendador', description: 'Ativar janela de horário para busca mais frequente.' },
  SCHEDULER_PRE_EVENT_WINDOW_HOURS: { type: 'int', category: 'Agendador', description: 'Janela em horas antes do evento para busca frequente.' },
  SCHEDULER_PRE_EVENT_INTERVAL_MINUTES: { type: 'int', category: 'Agendador', description: 'Intervalo em minutos da busca pré-evento.' },
  SCHEDULER_POST_EVENT_INTERVAL_MINUTES: { type: 'int', category: 'Agendador', description: 'Intervalo em minutos para monitoramento pós-evento.' },
  FULL_SYNC_INTERVAL_HOURS: { type: 'int', category: 'Agendador', description: 'Intervalo em horas para sincronização completa de canais.' },
  INITIAL_SYNC_DAYS: { type: 'int', category: 'Agendador', description: 'Limite de dias na primeira sincronização (0 = sem limite).' },
  SCHEDULER_RETRY_ATTEMPTS: { type: 'int', category: 'Agendador', description: 'Quantidade de tentativas com retry em falhas transitórias.' },
  SCHEDULER_RETRY_BASE_DELAY_MS: { type: 'int', category: 'Agendador', description: 'Delay base (ms) para retry exponencial.' },

  // Categoria 3: Conteúdo & Filtros
  MAX_SCHEDULE_HOURS: { type: 'int', category: 'Conteúdo & Filtros', description: 'Máximo de horas no futuro para considerar um evento upcoming.' },
  MAX_UPCOMING_PER_CHANNEL: { type: 'int', category: 'Conteúdo & Filtros', description: 'Máximo de eventos upcoming por canal.' },
  TITLE_FILTER_EXPRESSIONS: { type: 'list', category: 'Conteúdo & Filtros', description: 'Expressões para remover do título dos eventos.' },
  PREFIX_TITLE_WITH_STATUS: { type: 'bool', category: 'Conteúdo & Filtros', description: 'Prefixar título com categoria (AO VIVO/AGENDADO/GRAVADO).' },
  PREFIX_TITLE_WITH_CHANNEL_NAME: { type: 'bool', category: 'Conteúdo & Filtros', description: 'Prefixar título com nome amigável do canal.' },
  FILTER_BY_CATEGORY: { type: 'bool', category: 'Conteúdo & Filtros', description: 'Filtrar vídeos por categoria do YouTube.' },
  ALLOWED_CATEGORY_IDS: { type: 'list', category: 'Conteúdo & Filtros', description: 'IDs de categorias permitidas quando o filtro estiver ativo.' },

  // Categoria 4: Mapeamentos
  CATEGORY_MAPPINGS: { type: 'list', category: 'Mapeamentos', description: 'Mapeamento categoriaYoutube->nome amigável (formato: id|nome).' },
  CHANNEL_NAME_MAPPINGS: { type: 'list', category: 'Mapeamentos', description: 'Mapeamento nome do canal->nome curto (formato: original|curto).' },

  // Categoria 5: Retenção (VOD)
  KEEP_RECORDED_STREAMS: { type: 'bool', category: 'Retenção (VOD)', description: 'Manter vídeos que passaram por live e viraram gravados.' },
  MAX_RECORDED_PER_CHANNEL: { type: 'int', category: 'Retenção (VOD)', description: 'Máximo de gravados retidos por canal.' },
  RECORDED_RETENTION_DAYS: { type: 'int', category: 'Retenção (VOD)', description: 'Dias para retenção de gravados.' },

  // Categoria 6: Arquivos de Saída
  TUBEWRANGLERR_URL: { type: 'string', category: 'Arquivos de Saída', description: 'URL pública base do serviço para links absolutos.' },
  PLAYLIST_LIVE_FILENAME: { type: 'string', category: 'Arquivos de Saída', description: 'Nome do arquivo da playlist de lives.' },
  PLAYLIST_UPCOMING_FILENAME: { type: 'string', category: 'Arquivos de Saída', description: 'Nome do arquivo da playlist de upcoming.' },
  PLAYLIST_VOD_FILENAME: { type: 'string', category: 'Arquivos de Saída', description: 'Nome do arquivo da playlist de gravados.' },
  PLAYLIST_GENERATE_DIRECT: { type: 'bool', category: 'Arquivos de Saída', description: 'Habilita versão direta (YouTube watch URL).' },
  PLAYLIST_GENERATE_PROXY: { type: 'bool', category: 'Arquivos de Saída', description: 'Habilita versão proxy (/api/stream).' },
  XMLTV_FILENAME: { type: 'string', category: 'Arquivos de Saída', description: 'Nome do arquivo XMLTV (EPG).' },
  EPG_DESCRIPTION_CLEANUP: { type: 'bool', category: 'Arquivos de Saída', description: 'Limpa descrição no EPG.' },
  TVG_NAME_USE_DISPLAY_TITLE: { type: 'bool', category: 'Arquivos de Saída', description: 'Usar título de exibição (completo) no atributo tvg-name.' },
  FORCE_UPPERCASE_GROUP_TITLE: { type: 'bool', category: 'Arquivos de Saída', description: 'Forçar group-title em MAIÚSCULAS.' },
  FORCE_UPPERCASE_TITLE: { type: 'bool', category: 'Arquivos de Saída', description: 'Forçar tvg-name e título de exibição em MAIÚSCULAS.' },
  TITLE_FORMAT_CONFIG: { type: 'json', category: 'Arquivos de Saída', description: 'Configuração avançada para formatação do título.' },

  // Categoria 7: Mídia & Placeholders
  PLACEHOLDER_IMAGE_URL: { type: 'string', category: 'Mídia & Placeholders', description: 'URL da imagem de placeholder para streams sem mídia ativa.' },
  USE_INVISIBLE_PLACEHOLDER: { type: 'bool', category: 'Mídia & Placeholders', description: 'Comentar URL de placeholder no M3U (#url) para ficar invisível em clientes específicos.' },
  PROXY_THUMBNAIL_CACHE_HOURS: { type: 'int', category: 'Mídia & Placeholders', description: 'TTL do cache de thumbnail no proxy.' },

  // Categoria 8: Técnico
  HTTP_PORT: { type: 'int', category: 'Técnico', description: 'Porta HTTP do serviço.' },
  LOCAL_TIMEZONE: { type: 'string', category: 'Técnico', description: 'Timezone local (IANA).' },
  STATE_CACHE_FILENAME: { type: 'string', category: 'Técnico', description: 'Nome do arquivo de cache interno de estado.' },
  STALE_HOURS: { type: 'int', category: 'Técnico', description: 'TTL de dados frescos em horas.' },
  USE_PLAYLIST_ITEMS: { type: 'bool', category: 'Técnico', description: 'Buscar vídeos via playlistItems (mais barato) em vez de search.' },
  PROXY_ENABLE_ANALYTICS: { type: 'bool', category: 'Técnico', description: 'Registrar analytics de acesso ao proxy.' },

  // Categoria 9: Logs
  LOG_LEVEL: { type: 'string', category: 'Logs', description: 'Nível de log global (DEBUG|INFO|WARN|ERROR).' },
  LOG_TO_FILE: { type: 'bool', category: 'Logs', description: 'Persistir logs em arquivo.' },
  SMART_PLAYER_LOG_LEVEL: { type: 'string', category: 'Logs', description: 'Nível de log específico do smart player.' },
  SMART_PLAYER_LOG_TO_FILE: { type: 'bool', category: 'Logs', description: 'Persistir logs do smart player em arquivo.' },
};
