# TubeWranglerr — Resumo das correções e adições feitas neste chat

> Documento de consolidação das mudanças realizadas ao longo desta conversa, para facilitar revisão e merge.

## 1) Escopo geral do que foi trabalhado

Durante a conversa, o foco foi evoluir o projeto em quatro frentes:

1. **Estabilidade de build/deploy** (lint, build, Docker, seed/migrations).
2. **Funcionalidade do Smart Player / playlists** (proxy, fallback, títulos M3U, regras de upcoming).
3. **UI/UX do dashboard** (layout da sidebar, configurações, eventos, navegação de settings).
4. **Confiabilidade operacional** (health checks, scheduler, logs básicos, proteções de endpoints).

---

## 2) Principais correções implementadas

## 2.1 API e backend

- Criação/ajuste de rotas importantes para o fluxo de canais e configuração:
  - `POST /api/channels/[id]/sync`
  - `GET /api/config/public`
  - health checks (`/api/health/live` e `/api/health/ready`).
- Ajustes em rotas de scheduler/cron e contratos de resposta para reduzir inconsistências.
- Correções em serviços de sync do YouTube para reduzir inconsistências de status e retenção.

## 2.2 Smart Player

- Endurecimento da rota `GET /api/stream/[id]` com:
  - timeout,
  - tratamento de abort/cancel do cliente,
  - tratamento de erros de spawn/execução,
  - limpeza de processo em encerramento.
- Estrutura de suporte adicionada para capacidades/monitoramento do player:
  - `lib/player/capabilities.ts`
  - `lib/player/health-monitor.ts`
  - `lib/player/router.ts` (evoluções no roteamento).

## 2.3 Playlists e EPG

- Evolução da geração de playlist em `/api/playlist/[filename]`.
- Regra mantida para **upcoming em modo proxy** (sem direct para upcoming).
- Reforço da lógica detalhada de geração de título e atributos M3U (com escapes), incluindo:
  - controle de uppercase,
  - opção de usar display title no `tvg-name`,
  - observabilidade de processamento por stream.
- Estrutura de XMLTV/EPG evoluída para sair de placeholder em parte dos ciclos.

## 2.4 Dashboard / Front-end

- Reestruturação de telas de configuração por categorias/submenus.
- Inclusão de páginas adicionais em settings (`logs`, `mappings`, `system`).
- Ajustes de layout da sidebar e área de conteúdo para corrigir sobreposição/quebra visual.
- Página de eventos evoluída de placeholder para listagem com filtros/paginação.

## 2.5 Observabilidade, segurança e scheduler

- Inclusão de utilitário de logs (`lib/observability.ts`) e uso em pontos críticos.
- Melhorias em scheduler e retry (`lib/retry.ts`, ajustes em `lib/scheduler.ts`).
- Proteções administrativas iniciais (`lib/security.ts`) aplicadas em endpoints sensíveis.

## 2.6 Qualidade, testes e tooling

- Ajustes de lint com `eslint.config.mjs`.
- Inclusão de testes unitários para partes críticas:
  - `test/player-router.test.ts`
  - `test/retry.test.ts`
  - `test/youtube-policy.test.ts`
- Ajustes em `package.json` para padronizar execução de testes/lint.

## 2.7 Docker / execução em produção

- Várias correções para build e runtime no Docker:
  - preparação de DB,
  - ajustes em prisma/migrations/seed,
  - mudanças de entrypoint,
  - cópia de arquivos necessários na imagem final,
  - correções no comando de start/standalone.

---

## 3) Arquivos e áreas mais impactados

- **API**: `app/api/**`
- **Dashboard**: `app/(dashboard)/**`
- **Player/Serviços**: `lib/player/**`, `lib/services/**`, `lib/scheduler.ts`, `lib/security.ts`
- **Infra**: `Dockerfile`, `entrypoint.sh`, `package.json`, `eslint.config.mjs`
- **Testes**: `test/**`

---

## 4) Decisão funcional importante consolidada

Para evitar regressão de merge no gerador de playlist:

- foi priorizada a **lógica detalhada** de geração (com tratamento de atributos M3U, opções de formatação e logs),
- e descartada a variante simplificada que estava sobreposta por conflito.

---

## 5) Observações para revisão final

1. Como houve um ciclo com muitos commits de correção rápida, recomenda-se revisar por blocos:
   - player/playlist,
   - settings/layout,
   - docker/deploy.
2. Validar no ambiente alvo (com variáveis reais) principalmente:
   - `api/stream` (live/vod/upcoming),
   - `api/playlist/*`,
   - startup do container com prisma.
3. Se necessário, podemos gerar um segundo documento com **checklist de homologação** (passo a passo) para operação.

---

## 6) Referência de commits recentes (linha do tempo curta)

Exemplos de commits relevantes neste ciclo (ordem decrescente):

- `5d1651c` — pacote amplo de correções/recursos (PR placeholder automático).
- `ef04231` / `7e82992` — correções da página de Formato de Título.
- `f6b9e38` / `c652f15` / `fb97932` / `f20ad4e` / `5e3af2a` / `1567b0c` / `647c528` — correções de build/deploy Docker/Prisma.
- `26cb29e` / `5b99506` / `feff4be` / `44d03a1` / `7712b9d` — ciclo de implementação/correções de UI + backend.