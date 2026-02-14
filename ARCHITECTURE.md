# TubeWranglerr - Arquitetura do Projeto (v2.0)

## Decisões de Design
Baseado na análise dos scripts originais (`get_streams.py`, `smart_player.py`) e na nova especificação (`NEW_DOC.md`), optamos por migrar a lógica para **TypeScript (Next.js)**.

### Por que TypeScript/Next.js?
Embora gere mais arquivos de código-fonte (componentes, rotas), essa abordagem **simplifica a infraestrutura** final:
1. **Container Único:** Não precisamos gerenciar dois runtimes pesados (Python Server + Node Server) rodando simultaneamente. O Node.js assume tudo.
2. **Eficiência:** O `smart_player` (proxy) em Node.js utiliza *Streams* nativos, sendo muito mais leve e rápido para repassar dados do FFmpeg para o cliente do que o Python.
3. **Banco de Dados:** O acesso ao SQLite é direto via Prisma. Se mantivéssemos o Python, teríamos que sincronizar arquivos JSON ou ter problemas de concorrência no SQLite.

## Stack Tecnológica
- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Banco de Dados:** SQLite (via Prisma ORM)
- **UI:** Tailwind CSS + Shadcn/UI
- **Processamento de Mídia:** `ffmpeg`, `streamlink`, `yt-dlp` (executados como subprocessos controlados pelo Node)
- **Agendamento:** `node-cron` (substituindo o loop do `get_streams.py`)

## Estrutura de Pastas (Proposta)

```
/
├── prisma/
│   └── schema.prisma      # Definição do Banco de Dados (Configs, Canais, Streams)
├── app/
│   ├── api/               # Endpoints da API (Substitui o Flask do get_streams)
│   │   ├── stream/[id]/   # Smart Player Proxy (Substitui smart_player.py)
│   │   ├── playlist/      # Gerador de M3U8/XMLTV
│   │   └── cron/          # Agendador (Scheduler)
│   ├── (dashboard)/       # Interface Administrativa (React)
│   └── login/             # Autenticação Multi-usuário
├── lib/
│   ├── services/
│   │   ├── youtube.ts     # Lógica de busca na API do YouTube
│   │   ├── streamlink.ts  # Wrapper para o binário streamlink
│   │   └── ffmpeg.ts      # Gerador de placeholder e transcodificação
│   ├── db.ts              # Cliente Prisma
│   └── config.ts          # Gerenciador das 48 variáveis de configuração
└── public/                # Arquivos estáticos
```

## Próximos Passos
1. Definir o Schema do Banco de Dados (Prisma).
2. Criar a estrutura básica do Next.js.
3. Implementar o "Smart Player" (rota de proxy).
4. Implementar o "Scheduler" (serviço de busca do YouTube).
