# Planejamento de Novas Funcionalidades - TubeWranglerr

Este documento descreve as próximas funcionalidades e melhorias a serem implementadas no TubeWranglerr, com base na discussão e planejamento.

---

### 1. Reestruturação Geral da Interface (UI/UX)

O objetivo é tornar a navegação mais intuitiva, clara e flexível.

- **1.1. Nova Estrutura do Menu Lateral:** A navegação principal será reorganizada para separar as responsabilidades de forma lógica.
    - **`Dashboard`**: Página inicial com status geral do sistema.
    - **`Canais`**: Gerenciamento dos **canais-fonte** do YouTube (adicionar, pausar, sincronizar).
    - **`Eventos`**: Tabela com a lista de todos os **streams individuais** (Live, Upcoming, VOD) capturados pelo sistema.
    - **`Playlists`**: Nova página para exibir os **links de saída** (M3U8 e EPG XML) prontos para uso.
    - **`Configurações`**: Menu-pai que se expande para sub-categorias.

- **1.2. Sub-menu de Configurações:** As configurações serão divididas em páginas dedicadas para maior organização.
    ```
    - Configurações
      |- API & Credenciais
      |- Agendador
      |- Conteúdo & Filtros
      |- Formato de Título (Nova)
      |- Retenção (VOD)
      |- Arquivos de Saída
      |- Mídia & Placeholders
    ```

- **1.3. Barra Lateral Ajustável:** A largura da barra lateral poderá ser ajustada via mouse (drag).

- **1.4. Controles Globais na Página `Canais`:** Ao lado do botão `+ Adicionar Canal`, serão adicionados dois novos botões:
    - **`Iniciar Busca Global`**: Força a execução imediata do agendador para todos os canais ativos.
    - **`Pausar Agendador`**: Interrompe/retoma todas as buscas agendadas.

### 2. Melhorias na Gestão de Canais (Fontes do YouTube)

Aprimoramentos na tela de gerenciamento de canais-fonte (`/channels`).

- **2.1. Validação na Adição:** Ao adicionar um novo canal, o sistema validará sua existência com a API do YouTube antes de salvar.

- **2.2. Correção de Colunas:** A coluna "ID / Handle" será corrigida para exibir o **Handle** e o **Channel ID** de forma clara e distinta.

- **2.3. Novas Colunas de Informação:**
    - **Contadores de Eventos:** Adicionar colunas para exibir a contagem de streams `Live`, `Upcoming` e `VOD` de cada canal.

- **2.4. Novas Ações por Canal:**
    - **`Forçar Sincronização`**: Botão "refresh" em cada linha para buscar novos eventos apenas para aquele canal.
    - **`Congelar/Descongelar`**: Botão para pausar/retomar o monitoramento de um canal individualmente.

- **2.5. Coluna "Status" Aprimorada:** A coluna usará ícones para representar o estado do canal:
    - **Ativo:** (Verde) Canal validado e sendo monitorado.
    - **Congelado:** (Azul) Monitoramento pausado pelo usuário.
    - **Não Encontrado:** (Vermelho) Canal não pôde ser resolvido pela API.

### 3. Novo Gerenciador de Formato de Título

Uma nova página de configuração (`Formato de Título`) para controle total sobre o nome dos eventos nas playlists.

- **3.1. Componentes do Título:** O usuário poderá montar o título dinamicamente, ativando, desativando e reordenando os seguintes componentes:
    - `[STATUS]` (Ex: [AO VIVO])
    - `[NOME DO CANAL]` (Ex: [CAZÉ TV])
    - `[NOME DO EVENTO]`
    - `[DATA E HORA]`
    - `[PLAYLIST DO YOUTUBE]` **(Investigação Pendente)**

- **3.2. Interface Interativa (Drag & Drop):**
    - A ordem dos componentes poderá ser alterada arrastando-os.
    - Cada componente terá um botão para ser incluído ou não no título.
    - Uma opção global `[ ]` permitirá ativar/desativar o uso de colchetes.
    - Uma pré-visualização em tempo real mostrará um exemplo do título final.

- **3.3. Investigação Pendente - Playlist do YouTube:** É necessário confirmar se a API do YouTube fornece de forma confiável a qual playlist um stream pertence. A implementação deste componente depende dessa viabilidade.

### 4. Melhorias Gerais de Configuração

- **4.1. Suporte a Múltiplas API Keys:**
    - O campo `YOUTUBE_API_KEY` aceitará múltiplas chaves.
    - **Implementação:** O sistema usará as chaves em modo **Round-Robin** para distribuir o consumo de quota.

- **4.2. UI para Campos de Lista:**
    - Campos como `TITLE_FILTER_EXPRESSIONS` usarão uma interface de "tags", onde o usuário digita um valor e aperta Enter.

- **4.3. Limpeza da UI de Configuração:**
    - As variáveis `TARGET_CHANNEL_HANDLES` e `TARGET_CHANNEL_IDS` serão **removidas** da página de configurações.

### 5. Clarificação da Lógica de VODs

- Fica estabelecido que o sistema **não busca ativamente por VODs**.
- O fluxo de um evento é: `Upcoming` -> `Live` -> `Recorded`.
- `KEEP_RECORDED_STREAMS` controla se os eventos que já ocorreram devem ser mantidos no cache e incluídos na `playlist_vod.m3u8`.
