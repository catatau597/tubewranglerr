// lib/config-metadata.ts

export const CATEGORY_MAP: Record<string, string> = {
    '1': 'API & Credenciais',
    '2': 'Agendador',
    '3': 'Conteúdo & Filtros',
    '4': 'Mapeamentos', // Categoria interna, não exposta na UI
    '5': 'Retenção (VOD)',
    '6': 'Arquivos de Saída',
    '7': 'Mídia & Placeholders',
    '8': 'Técnico', // Categoria interna
    '9': 'Logs' // Categoria interna
};

export const CONFIG_METADATA: Record<string, { type: string, category: string, description: string }> = {
  // Categoria 1: API & Credenciais
  'YOUTUBE_API_KEY': { type: 'list', category: 'API & Credenciais', description: 'Chave(s) da API do YouTube. Adicione múltiplas chaves separadas por vírgula.' },
  
  // Categoria 2: Agendador
  'SCHEDULER_MAIN_INTERVAL_HOURS': { type: 'int', category: 'Agendador', description: 'Intervalo principal em horas para busca de novos vídeos em todos canais.' },
  'SCHEDULER_ACTIVE_START_HOUR': { type: 'int', category: 'Agendador', description: 'Hora de início (0-23) do período de busca ativa (mais frequente).' },
  'SCHEDULER_ACTIVE_END_HOUR': { type: 'int', category: 'Agendador', description: 'Hora de fim (0-23) do período de busca ativa.' },
  'ENABLE_SCHEDULER_ACTIVE_HOURS': { type: 'bool', category: 'Agendador', description: 'Ativar busca mais frequente apenas no período de horário ativo.' },
  'SCHEDULER_PRE_EVENT_WINDOW_HOURS': { type: 'int', category: 'Agendador', description: 'Janela em horas antes de um evento para iniciar buscas mais frequentes.' },
  'SCHEDULER_PRE_EVENT_INTERVAL_MINUTES': { type: 'int', category: 'Agendador', description: 'Intervalo em minutos da busca pré-evento.' },
  'SCHEDULER_POST_EVENT_INTERVAL_MINUTES': { type: 'int', category: 'Agendador', description: 'Intervalo em minutos para continuar buscando após o fim teórico de um evento.' },
  'FULL_SYNC_INTERVAL_HOURS': { type: 'int', category: 'Agendador', description: 'Intervalo em horas para uma sincronização completa de todos os vídeos de um canal.' },
  
  // Categoria 3: Conteúdo & Filtros
  'MAX_SCHEDULE_HOURS': { type: 'int', category: 'Conteúdo & Filtros', description: 'Máximo de horas no futuro para considerar um evento agendado.' },
  'MAX_UPCOMING_PER_CHANNEL': { type: 'int', category: 'Conteúdo & Filtros', description: 'Número máximo de eventos futuros a serem mantidos por canal.' },
  'TITLE_FILTER_EXPRESSIONS': { type: 'list', category: 'Conteúdo & Filtros', description: 'Expressões (regex) para remover do título dos eventos.' },
  'FILTER_BY_CATEGORY': { type: 'bool', category: 'Conteúdo & Filtros', description: 'Ativar filtro por categoria de vídeo do YouTube.' },
  'ALLOWED_CATEGORY_IDS': { type: 'list', category: 'Conteúdo & Filtros', description: 'IDs de categorias do YouTube permitidas se o filtro estiver ativo.' },

  // Categoria 5: Retenção (VOD)
  'KEEP_RECORDED_STREAMS': { type: 'bool', category: 'Retenção (VOD)', description: 'Manter streams que já ocorreram (VODs) no banco de dados.' },
  'MAX_RECORDED_PER_CHANNEL': { type: 'int', category: 'Retenção (VOD)', description: 'Número máximo de VODs a serem mantidos por canal.' },
  'RECORDED_RETENTION_DAYS': { type: 'int', category: 'Retenção (VOD)', description: 'Por quantos dias manter um VOD antes de deletar.' },

  // Categoria 6: Arquivos de Saída
  'PLAYLIST_LIVE_FILENAME': { type: 'string', category: 'Arquivos de Saída', description: 'Nome do arquivo da playlist de lives (ex: live.m3u8).' },
  'PLAYLIST_UPCOMING_FILENAME': { type: 'string', category: 'Arquivos de Saída', description: 'Nome do arquivo da playlist de agendados (ex: upcoming.m3u8).' },
  'PLAYLIST_VOD_FILENAME': { type: 'string', category: 'Arquivos de Saída', description: 'Nome do arquivo da playlist de VODs (ex: vod.m3u8).' },
  'XMLTV_FILENAME': { type: 'string', category: 'Arquivos de Saída', description: 'Nome do arquivo do guia de programação (ex: epg.xml).' },
  'EPG_DESCRIPTION_CLEANUP': { type: 'bool', category: 'Arquivos de Saída', description: 'Limpar e formatar a descrição dos eventos no EPG.' },
  'TITLE_FORMAT_CONFIG': { type: 'json', category: 'Formato de Título', description: 'Configuração avançada para o formato do título dos eventos.' },

  // Categoria 7: Mídia & Placeholders
  'PLACEHOLDER_IMAGE_URL': { type: 'url', category: 'Mídia & Placeholders', description: 'URL de uma imagem para usar quando um evento não tiver thumbnail.' },
  'USE_INVISIBLE_PLACEHOLDER': { type: 'bool', category: 'Mídia & Placeholders', description: 'Usar uma imagem transparente de 1x1 pixel como placeholder.' },
};
