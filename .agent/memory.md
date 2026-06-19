# Memória do Projeto: GerentesMec
## Diretrizes de Frontend (UI/UX)
- Interface escura, premium, "vibe coding".
- Layouts de Auditoria/Checklist: O usuário prefere um **Layout Imersivo (Carousel de 1 item por tela)** em vez de Listas Verticais (Steppers longos). Fundo com blur das evidências, botões gigantes de câmera, e navegação (Próximo/Anterior) na parte inferior (Spec 055).
- PWA antifraude: Sempre usar `<input capture="environment">` para forçar uso da câmera nativa e evitar upload de galeria (Spec 052).
- Offline-first: Usar `localforage` para salvar dados parciais em IndexedDB antes de despachar payloads inteiros. Sempre use `schema_version` no payload local e aplique wipe automático no cache do cliente caso haja mismatch, evitando crashes de UI (Spec 053).
- UX de Fotos (Lightbox): Não redirecione para novas rotas ao exibir mídias. Use componentes de Lightbox com zoom in-place (como `react-medium-image-zoom`) com fundo escuro (WhatsApp style) (Spec 053).
- Layouts de Imersão: Sempre isole telas de alta imersão (como Steppers de Auditoria) em rotas próprias (ex: `/auditoria/execucao`) renderizadas FORA de layouts globais (sem Sidebars ou LumaBars) usando `100vw` e `100vh` fixos. Mantenha os Dashboards com grid divido (2 colunas) em layouts padrão de CRM.
- Rastreabilidade de UI: Mídias antifraude devem ter o timestamp real (HH:MM:SS) e a tag de GPS estampadas diretamente na miniatura/modal para inibir fraude.
- Solar Contrast (Light Mode): Nunca fixe cores (`bg-black`, `text-white`) em componentes de uso externo/rua. Use as variáveis do Tailwind (`bg-background dark:bg-[#0a0a0f]`) e garanta que botões de ação (ex: Conforme/Não Conforme) usem cores sólidas saturadas (`bg-emerald-600`, `bg-rose-600`) para legibilidade máxima sob a luz do sol no Light Mode (Spec 063).
- Hierarquia Z-Index e Overlaps: Em layouts flutuantes (LumaBar) ou Dashboards com Sidebars, o `<Toaster position="bottom-right" />` deve ser isolado do centro. O cabeçalho (Header) principal deve ser selado com `z-50` para evitar "vazamento" de scroll ou modais (Spec 063).
## Diretrizes de Backend e Banco de Dados (Supabase)
- Tolerância zero no All-or-nothing: Salvar auditorias incompletas apenas localmente e subir payloads massivos com `raw_payload` em colunas JSONB pra redundância.
- Restrições de Fila: Sempre usar `insert` ao invés de `upsert` com onConflict `lead_id` na `ai_task_queue` (a tabela loga eventos múltiplos por lead) (Spec 051).
- **RBAC e Identidade Invisível**: Para gerenciar contas de acesso em dashboards internos de forma rápida (criar contas e mudar senhas sem confirmação de email), utilize o `supabaseAdmin` (Admin SDK) diretamente no frontend passando o `VITE_SUPABASE_SERVICE_ROLE_KEY` armazenado no `.env`. Utilize o `app_metadata` (`user.app_metadata.role`) para controle de bloqueio de rotas no cliente em vez de tabelas auxiliares pesadas (Spec 060).
- **Prevenção de Supabase Egress Quota Exceeded (Tela Preta / Illegal Constructor)**: NUNCA use `select('*')` em componentes frontend para tabelas como `chat_messages` ou `leads` que possuam colunas de payload massivo (`raw_payload`, base64). Declare as colunas explicitamente `select('id, name, ...')`. O bloqueio de API do Supabase (por Egress) induz o cliente `GoTrue` a emitir broadcasts malformados, o que causa crash instantâneo (`TypeError: Illegal constructor`) em toda a árvore React (Spec 061).

## Lógica da IA e LLM (Zero Trust)
- Confiança Zero: O LLM nunca deve inventar estágios ou assumir vitórias se não houver contexto na conversa do WhatsApp.
- Míngua de contexto ("Parking Lot"): O LLM é instruído de forma estrita e imperativa a DERRUBAR estágios (incluindo `closed_won`) se for um simples pós-venda (Spec 051).
