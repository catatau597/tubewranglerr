
TubeWranglerr - Especificação do Projeto

VISÃO GERAL

Objetivo: Agregador de streams do YouTube que monitora canais, captura transmissões ao vivo e programações, gerando playlists M3U8 e EPG (guia de programação) para uso em aplicações de streaming (IPTV players como Kodi, VLC, etc).

Entrada: Canais do YouTube (@handle ou ID)
Saída: Playlists M3U8 (Live/Upcoming/VOD) + EPG XML
Extras: API REST, Smart Player (proxy inteligente), Interface Web completa

O projeto parte de dois scripts Python existentes e um .env
Scripts de Referência
DOC/get_streams.py
DOC/smart_player.py
DOC/.env

Objetivo:
Fazer esses scripts autonomos com uma imagem/container docker  próprio.
Ter gerenciamneto pela interface web
Ser Simplex / enxuto, mas na medido do possível uma UI bonita

Gostaria de ter tabelas que exibam canais do youtebe, ja cadastrados, streams/eventos disponiveis com filtro para o canal que pertence e a categoria(Live,VOD, Upcoming)

Talvez separar o em mais 2 ou 3 arquivos para facilictar ampliação/manutenção.  


**Técnicas de otimização aplicáveis ao smartplayer
1. Argumentos FFmpeg otimizados para HLS/streaming baixa latência
2. Padrão de health monitoring com auto-recovery
3. Gestão eficiente de processos (streamlink/yt-dlp/ffmpeg)

Logs
Logs em arquivo coexistem com visualização em tempo real na UI (tail via WebSocket)

Como podemos fazer
ESTRUTURA DO PROJETO
BANCO DE DADOS
AUTENTICAÇÃO (criar senha no primeiro acesso?)

CATEGORIA 1️⃣: CREDENCIAIS & CANAIS
*UI: Dashboard → Configurações → API & Canais*

| Variável | Tipo | Padrão | O que faz | Componente UI |
|----------|------|--------|----------|---------------|
| `YOUTUBE_API_KEY` | String | (obrigatório) | Chave YouTube Data API v3 | Input protegido + botão teste conexão |
| `TARGET_CHANNEL_HANDLES` | List | "" | Canais por @handle (ex: @cazetv) | Multi-select com autocomplete |
| `TARGET_CHANNEL_IDS` | List | "" | Canais por ID (fallback) | Multi-select |

CATEGORIA 2️⃣: AGENDADOR INTELIGENTE (Scheduler)
*UI: Dashboard → Configurações → Agendamento*

| Variável | Tipo | Padrão | O que faz | Componente UI |
|----------|------|--------|----------|---------------|
| `SCHEDULER_MAIN_INTERVAL_HOURS` | Int | 4 | Busca completa a cada N horas | Slider 1-24h |
| `SCHEDULER_ACTIVE_START_HOUR` | Int | 7 | Hora início período ativo (24h) | Time picker (condicional) |
| `SCHEDULER_ACTIVE_END_HOUR` | Int | 22 | Hora fim período ativo (24h) | Time picker (condicional) |
| `ENABLE_SCHEDULER_ACTIVE_HOURS` | Bool | false | Ativa busca apenas em horário específico | Toggle on/off |
| `SCHEDULER_PRE_EVENT_WINDOW_HOURS` | Int | 2 | Janela horas ANTES de evento | Slider 0-12h |
| `SCHEDULER_PRE_EVENT_INTERVAL_MINUTES` | Int | 5 | Intervalo verificações pré-evento | Slider 1-60min |
| `SCHEDULER_POST_EVENT_INTERVAL_MINUTES` | Int | 5 | Intervalo verificações live ativas | Slider 1-60min |
| `FULL_SYNC_INTERVAL_HOURS` | Int | 48 | Full sync periódico | Slider 12-168h |
| `INITIAL_SYNC_DAYS` | Int | 2 | Limite dias na primeira busca (0=tudo) | Slider 0-30 dias |
| `RESOLVE_HANDLES_TTL_HOURS` | Int | 24 | Cache resolução @handles | Slider 1-168h |

CATEGORIA 3️⃣: FILTROS DE CONTEÚDO
*UI: Dashboard → Configurações → Conteúdo*

| Variável | Tipo | Padrão | O que faz | Componente UI |
|----------|------|--------|----------|---------------|
| `MAX_SCHEDULE_HOURS` | Int | 72 | Limite máximo horas para agendamentos | Slider 24-720h |
| `MAX_UPCOMING_PER_CHANNEL` | Int | 6 | Máximo streams "upcoming" por canal | Slider 1-20 |
| `TITLE_FILTER_EXPRESSIONS` | List | "ao vivo,AO VIVO,..." | Palavras para REMOVER dos títulos | Tags editáveis add/remove |
| `PREFIX_TITLE_WITH_STATUS` | Bool | true | Adiciona [Ao Vivo], [Agendado], [Gravado] | Toggle on/off |
| `PREFIX_TITLE_WITH_CHANNEL_NAME` | Bool | true | Adiciona nome do canal no título | Toggle on/off |
| `FILTER_BY_CATEGORY` | Bool | false | Filtrar por categoria YouTube | Toggle on/off |
| `ALLOWED_CATEGORY_IDS` | List | "17" | IDs categoria permitidas (17=Sports, 25=News) | Multi-select (condicional) |

CATEGORIA 4️⃣: MAPEAMENTOS & CATEGORIAS
*UI: Dashboard → Gerenciar Canais*

| Variável | Tipo | Padrão | O que faz | Componente UI |
|----------|------|--------|----------|---------------|
| `CATEGORY_MAPPINGS` | Dict | "Sports\|ESPORTES,..." | Mapeia ID categoria → nome amigável | JSON editor ou table |
| `CHANNEL_NAME_MAPPINGS` | Dict | "FAF TV\|@fafalagoas,..." | Mapeia nome API → nome curto | JSON editor ou table |

CATEGORIA 5️⃣: RETENÇÃO DE CONTEÚDO (VOD)
*UI: Dashboard → Configurações → Retenção de Conteúdo*

| Variável | Tipo | Padrão | O que faz | Componente UI |
|----------|------|--------|----------|---------------|
| `KEEP_RECORDED_STREAMS` | Bool | true | Gerar playlist_vod.m3u8 com streams gravados | Toggle on/off |
| `MAX_RECORDED_PER_CHANNEL` | Int | 2 | Máximo de VODs retidos por canal | Slider 1-10 |
| `RECORDED_RETENTION_DAYS` | Int | 2 | Dias para manter VOD no cache | Slider 1-30 |

CATEGORIA 6️⃣: ARQUIVOS DE SAÍDA & PLAYLISTS
*UI: Dashboard → Configurações → Arquivos de Saída*

| Variável | Tipo | Padrão | O que faz | Componente UI |
|----------|------|--------|----------|---------------|
| `PLAYLIST_SAVE_DIRECTORY` | Path | "." | Diretório salva playlists M3U8 | Path picker/input |
| `PLAYLIST_LIVE_FILENAME` | String | "playlist_live.m3u8" | Nome arquivo playlist ao vivo | Input |
| `PLAYLIST_UPCOMING_FILENAME` | String | "playlist_upcoming.m3u8" | Nome arquivo playlist agendados | Input |
| `PLAYLIST_VOD_FILENAME` | String | "playlist_vod.m3u8" | Nome arquivo playlist gravados | Input |
| `XMLTV_SAVE_DIRECTORY` | Path | "." | Diretório salva EPG XML | Path picker/input |
| `XMLTV_FILENAME` | String | "youtube_epg.xml" | Nome arquivo EPG | Input |
| `EPG_DESCRIPTION_CLEANUP` | Bool | false | Limpa descrição EPG (1º parágrafo apenas) | Toggle on/off |
| `PLAYLIST_GENERATION_TYPE` | String | "hybrid" | Estratégia geração (direct/proxy/hybrid) | Dropdown |
| `TUBEWRANGLERR_URL` | URL | "http://localhost:3000" | Base URL para proxy (pode ser IP externo) | Input |
| `PROXY_THUMBNAIL_CACHE_HOURS` | Int | 24 | Cache de thumbnails (horas) | Slider 1-168h |

opções novas precisa implementar
| `PLAYLIST_GENERATE_DIRECT` | Bool | true | Habilita playlist direta (URLs YouTube) | Toggle on/off |
| `PLAYLIST_GENERATE_PROXY` | Bool | true | Habilita playlist proxy (TubeWranglerr) | Toggle on/off |


CATEGORIA 7️⃣: IMAGENS & PLACEHOLDERS
*UI: Dashboard → Configurações → Mídia*

| Variável | Tipo | Padrão | O que faz | Componente UI |
|----------|------|--------|----------|---------------|
| `PLACEHOLDER_IMAGE_URL` | URL | "" | URL imagem placeholder (sem transmissão) | Input com preview |
| `USE_INVISIBLE_PLACEHOLDER` | Bool | true | Usa URL comentada no M3U (invisible) | Toggle on/off |

CATEGORIA 8️⃣: TÉCNICO & SERVIDOR
*UI: Dashboard → Configurações → Sistema*

| Variável | Tipo | Padrão | O que faz | Componente UI |
|----------|------|--------|----------|---------------|
| `HTTP_PORT` | Int | 8888 | Porta do servidor Next.js | Input numérico |
| `LOCAL_TIMEZONE` | String | "America/Sao_Paulo" | Fuso horário local | Dropdown lista IANA |
| `STATE_CACHE_FILENAME` | String | "state_cache.json" | Arquivo cache estado interno | Input |
| `STALE_HOURS` | Int | 6 | TTL para dados "frescos" | Slider 1-48h |
| `USE_PLAYLIST_ITEMS` | Bool | true | Busca por playlistItems (barato) vs search (caro) | Toggle on/off |
| `PROXY_ENABLE_ANALYTICS` | Bool | true | Log de acessos ao proxy (estatísticas) | Toggle on/off |

CATEGORIA 9️⃣: LOGS
*UI: Dashboard → Logs & Debug*

| Variável | Tipo | Padrão | O que faz | Componente UI |
|----------|------|--------|----------|---------------|
| `LOG_LEVEL` | String | "INFO" | Nível log (DEBUG\|INFO\|WARNING\|ERROR) | Dropdown |
| `LOG_TO_FILE` | Bool | true | Salvar logs em arquivo | Toggle on/off |
| `SMART_PLAYER_LOG_LEVEL` | String | "INFO" | Nível log smart_player | Dropdown |
| `SMART_PLAYER_LOG_TO_FILE` | Bool | true | Salvar logs smart_player em arquivo | Toggle on/off |


Totalização

├─ Categoria 1️⃣ (API & Canais):              3 variáveis
├─ Categoria 2️⃣ (Agendador):               10 variáveis
├─ Categoria 3️⃣ (Conteúdo):                 7 variáveis
├─ Categoria 4️⃣ (Mapeamentos):              2 variáveis
├─ Categoria 5️⃣ (VOD):                     3 variáveis
├─ Categoria 6️⃣ (Arquivos & Playlists):    12 variáveis
├─ Categoria 7️⃣ (Placeholders):            2 variáveis
├─ Categoria 8️⃣ (Técnico):                 6 variáveis
└─ Categoria 9️⃣ (Logs):                    4 variáveis
   =====================================================
   TOTAL:                                  48 variáveis
```
5. CONFIGURAÇÃO (48 Variáveis em 9 Categorias)
Regras Fundamentais

- **SEM exceção:** Todas as 48 variáveis têm campo de edição na UI
- **Aplicadas em tempo real:** Mudança via UI → salva no banco → hot reload (sem restart)
- **Persistidas no banco:** `.env` serve apenas como **seed inicial** na primeira execução. Em runtime, a **fonte de verdade é o banco de dados**
- **Validadas:** Cada tipo tem validação (Int: min/max, URL: formato, etc)
- **Exportáveis:** Usuário pode fazer export/import das configs via JSON


### Mapeamento de Tipos → Componentes UI, se possível
 
| Tipo | Componente | Exemplo |
|------|-----------|---------|
| `Int` com range | **Slider** | `SCHEDULER_MAIN_INTERVAL_HOURS` (1-24h) |
| `Int` sem range | **Input numérico** | `HTTP_PORT` |
| `Bool` | **Toggle on/off** | `KEEP_RECORDED_STREAMS` |
| `String` simples | **Input texto** | `LOCAL_TIMEZONE` |
| `String` enum | **Dropdown** | `LOG_LEVEL` (DEBUG\|INFO\|WARNING\|ERROR) |
| `URL` | **Input + preview** | `PLACEHOLDER_IMAGE_URL` |
| `List` | **Multi-select/Tags** | `TARGET_CHANNEL_HANDLES` |
| `Dict/JSON` | **JSON editor** ou **table** | `CATEGORY_MAPPINGS` |
| `Path` | **Path picker/input** | `PLAYLIST_SAVE_DIRECTORY` |
| `Time` (hora 24h) | **Time picker** | `SCHEDULER_ACTIVE_START_HOUR` |

### Edição Condicional (UI Dinâmica)


// Campos que aparecem APENAS se outro está ativo:

IF ENABLE_SCHEDULER_ACTIVE_HOURS === true THEN
  ├─ Mostrar: SCHEDULER_ACTIVE_START_HOUR (Time picker)
  └─ Mostrar: SCHEDULER_ACTIVE_END_HOUR (Time picker)

IF FILTER_BY_CATEGORY === true THEN
  └─ Mostrar: ALLOWED_CATEGORY_IDS (Multi-select)
```


INTERFACE WEB

Estrutura de Navegação

┌─────────────────────────────────────────────────────────┐
│         TubeWranglerr Control Panel                     │
├─────────────────────────────────────────────────────────┤
│ [Dashboard] [Canais] [Streams] [Configurações] [Logs]  │
└─────────────────────────────────────────────────────────┘
```

**Dashboard:** Cards KPIs (canais, live, agendados, VODs), gráfico atividade 24h, última sincronização, status agendador

**Canais:** Tabela de canais monitorados (nome, ID, @handle, últimos streams, mapping name), adicionar/editar/deletar/sync

**Streams:** Abas Live | Upcoming | VODs, cards com thumbnail + título + status + canal, copiar link M3U, paginação

**Configurações:** 9 categorias em tabs, cada uma com seus campos editáveis, botões salvar/descartar/export/import/reset

**Logs & Debug:** Logs real-time (tail via WebSocket), download logs, limpeza

Cards da Dashboard
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ 📺 Canais      │ │ 🔴 Live Agora  │ │ 📅 Agendados   │
│ 28             │ │ 3              │ │ 12             │
└────────────────┘ └────────────────┘ └────────────────┘

┌────────────────┐ ┌────────────────┐
│ 📹 VODs        │ │ ⏱️ Próximo em  │
│ 42             │ │ 2h 34m         │
└────────────────┘ └────────────────┘


Card Stream
┌─────────────────────────────────────┐
│ [Thumb] Título do Stream            │
│         [🔴 AO VIVO] @CanalXSports │
│         Iniciado há 1h 24min        │
│         [📋 M3U] [▶️ Watch]         │
└─────────────────────────────────────┘


Card Canal
┌─────────────────────────────────────┐
│ @canal.name                         │
│ ID: UCxxxxxxxxxxxxxxxxxxxxx         │
│ Últimas streams: 5 live / 12 agd   │
│ Mapeado para: "NOME CURTO"         │
│ [✏️ Edit] [🔄 Sync] [❌ Remove]    │
└─────────────────────────────────────┘


Tela de Configurações
┌─────────────────────────────────────────────────┐
│         Configurações (Settings)                │
├─────────────────────────────────────────────────┤
│ [Tab: API & Canais] [Tab: Agendador] [...]      │
└─────────────────────────────────────────────────┘

TAB: API & CANAIS
├─ 🔑 YouTube API Key:
│  └─ [Input protegido] [Teste conexão ↗]
├─ 📺 Canais por @handle:
│  └─ [Multi-select com autocomplete]
├─ 📺 Canais por ID:
│  └─ [Multi-select]
└─ [Salvar] [Descartar] [Export]

BOTÕES GLOBAIS (em cada tab):
├─ [📥 Import JSON]
├─ [📤 Export JSON]
├─ [🔄 Reset ao padrão]
└─ [💾 Salvar tudo] [✖ Descartar]
```

SMART PLAYER - Visão Geral

O Smart Player (`lib/player/`) é o coração do TubeWranglerr, responsável por rotear streams de forma inteligente e gerar placeholders quando necessário.
Fluxo de Roteamento
 * Verifica se stream está genuinamente ao vivo:
 * - status === 'live'
 * - actual_start_time_utc existe (já começou)
 * - actual_end_time_utc NÃO existe (não terminou)
 * Baseado em: smart_player.py → is_genuinely_live()

 * Escapa caracteres especiais para uso em drawtext do FFmpeg.
 * Baseado em: smart_player.py → escape_ffmpeg_text()

 * Constrói filtro complexo com drawtext overlays.
 * Preserva resolução original (fps=25, scale=1280:720) e adiciona
 * até 2 linhas de texto (countdown + data/hora).
 * Baseado em: smart_player.py → run_ffmpeg_placeholder()

 * Spawna processo FFmpeg para gerar placeholder MPEG-TS.
 * Args fiéis ao smart_player.py original + flags de baixa latência.
 
  const args = [
    '-loglevel', 'error',
    '-re',
    '-user_agent', userAgent,
    '-i', imageUrl,
    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
    '-filter_complex', filterComplex,
    '-map', '[v]', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'ultrafast',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k',
    '-shortest',
    '-tune', 'stillimage',
    '-f', 'mpegts', 'pipe:1'
  ];

  return spawn('ffmpeg', args);

Health Monitor (`lib/player/health-monitor.ts`)
monitorInterval = 5000; // 5s
async checkHealth(process: ChildProcess, streamId: string) {
// Verifica se processo está vivo
// Monitora stderr para erros
// Auto-restart com backoff exponencial
// Emite eventos de status

```

**Recursos:** Detecta travamentos, restart automático, métricas (uptime, erros, tentativas), logs estruturados

### Fases de Implementação

**Fase 1 — Básico:**
1. Router (detecta status do cache)
2. Streamlink runner (live)
3. yt-dlp runner (VOD)
4. Placeholder FFmpeg otimizado

**Fase 2 — Otimizações:**
5. Health monitor (auto-restart)
6. Métricas de performance
7. Cache inteligente de status/thumbnails

**Fase 3 — Avançado (Futuro):**
8. Proxy M3U8 local (reduzir chamadas API)
9. Fallback automático (Streamlink fail → yt-dlp)
10. Multi-quality selection

---

ESTRATÉGIA DE PLAYLIST (Híbrida)
Decisão: Gerar AMBAS as playlists (direct + proxy)

/data/m3us/
├── playlist_live_direct.m3u8       ← URLs diretas do YouTube
├── playlist_live_proxy.m3u8        ← URLs do TubeWranglerr proxy
├── playlist_upcoming_direct.m3u8
├── playlist_upcoming_proxy.m3u8
├── playlist_vod_direct.m3u8
└── playlist_vod_proxy.m3u8
```

Formato M3U8 — Versão Direta
```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXTINF:-1 tvg-id="UCxxxxxx" tvg-name="Canal Live 1" tvg-logo="https://yt3.ggpht.com/thumb" group-title="ESPORTES",Canal Live 1
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```
Formato M3U8 — Versão Proxy (Smart Player)
```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXTINF:-1 tvg-id="UCxxxxxx" tvg-name="Canal Live 1" tvg-logo="http://localhost:3000/api/thumbnail/dQw4w9WgXcQ" group-title="ESPORTES",[LIVE 🔴] Canal Live 1
http://localhost:3000/api/stream/dQw4w9WgXcQ
```

### Gerador de Playlists
  /**
   * Prefixo de status (baseado em ContentGenerator._get_display_title do get_streams.py).
   * Nota: USE_INVISIBLE_PLACEHOLDER controla se playlists vazias usam URL comentada (#url)
   * no M3U, tornando o placeholder invisível para o player IPTV.
   

Fluxo Completo (Usuário → Player)
USUÁRIO (KODI/VLC)
      ↓
      ├─ Opção A: Importar playlist_live_direct.m3u8
      │  → Player abre URL direto do YouTube
      │  → Simples, rápido, sem intermediários
      │
      └─ Opção B: Importar playlist_live_proxy.m3u8
         → Player abre http://localhost:3000/api/stream/VIDEO
         → Smart Player roteia:
             → Live?     streamlink → MPEG-TS
             → VOD?      yt-dlp → MPEG-TS
             → Upcoming? FFmpeg placeholder → loop MPEG-TS
         → Recursos: placeholders, auto-recovery, títulos frescos, analytics
```

Atualização
- Agendador re-gera a cada `SCHEDULER_MAIN_INTERVAL_HOURS` (padrão 4h)
- Ou via `PUT /api/playlists/refresh` (on-demand)

API ROUTES
 Canais
GET    /api/channels           // Lista todos os canais
POST   /api/channels           // Adicionar canal
GET    /api/channels/:id       // Detalhes de um canal
PUT    /api/channels/:id       // Editar canal
DELETE /api/channels/:id       // Remover canal
```

Streams
GET    /api/streams            // Lista streams (?status=live|upcoming|vod)
GET    /api/streams/:videoId   // Detalhes de um stream
```

Smart Player (Proxy)
GET    /api/stream/:videoId    // Roteia stream (streamlink/yt-dlp/placeholder) → MPEG-TS
GET    /api/thumbnail/:videoId // Retorna thumbnail (cache: max-age=3600)
```

Playlists & EPG
GET    /api/playlists/live     // Download M3U8 (?type=direct|proxy)
GET    /api/playlists/upcoming // Download M3U8 (?type=direct|proxy)
GET    /api/playlists/vod      // Download M3U8 (?type=direct|proxy)
PUT    /api/playlists/refresh  // Regenerar playlists on-demand
GET    /api/epg                // Download EPG XML
```

Configurações
GET    /api/config             // Retorna todas as 48 variáveis com valores atuais
PUT    /api/config             // Atualiza 1 variável { key, value }
GET    /api/config/export      // Export configs como JSON
POST   /api/config/import      // Import configs de arquivo JSON
PUT    /api/config/validate/:key  // Valida 1 variável antes de salvar
POST   /api/config/test-connection // Testa conexão YouTube API
```

 Auth
POST   /api/auth/login         // Login (NextAuth Credentials)
POST   /api/auth/logout        // Logout
```

WebSocket
WS     /api/ws/logs            // Logs real-time (tail)


Algum Middleware pode validar sessão em todas as rotas automaticamente.

---

11. CONTAINERIZAÇÃO

### Dockerfile (Multi-stage build)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    py3-pip \
    && pip3 install --no-cache-dir streamlink yt-dlp
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.js ./
RUN mkdir -p /app/data/{m3us,epgs,logs,backups}
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  tubewranglerr:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./prisma:/app/prisma
      - ./.env.local:/app/.env.local
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/database.db
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3



FLUXO DE FUNCIONAMENTO

```
1. Container inicia (Docker)
2. inicializa + carrega configs do DB (seed do .env se primeira execução)
3. node-cron agendador começa a rodar:
   ├─ A cada SCHEDULER_MAIN_INTERVAL_HOURS → Busca completa YouTube API
   ├─ Se ENABLE_SCHEDULER_ACTIVE_HOURS → Busca apenas no período ativo
   └─ A cada FULL_SYNC_INTERVAL_HOURS → Full resync
4. Gera/atualiza playlists M3U8 (direct + proxy) + EPG XML
5. Web UI (React) permite:
   ├─ Adicionar/remover canais
   ├─ Editar TODAS as configs via UI (persistido no DB, hot reload)
   ├─ Ver streams em tempo real (live/upcoming/vod)
   ├─ Logs em tempo real (WebSocket tail)
   └─ Estatísticas e analytics
6. Smart Player (lib/player/) roteia streams:
   ├─ Live → streamlink
   ├─ VOD → yt-dlp
   └─ Upcoming/Offline → FFmpeg placeholder
7. Backup automático diário (cron 2h AM)