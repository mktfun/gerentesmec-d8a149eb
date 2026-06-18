# Memória do Projeto: GerentesMec
## Diretrizes de Frontend (UI/UX)
- Interface escura, premium, "vibe coding".
- PWA antifraude: Sempre usar `<input capture="environment">` para forçar uso da câmera nativa e evitar upload de galeria (Spec 052).
- Offline-first: Usar `localforage` para salvar dados parciais em IndexedDB antes de despachar payloads inteiros. Sempre use `schema_version` no payload local e aplique wipe automático no cache do cliente caso haja mismatch, evitando crashes de UI (Spec 053).
- UX de Fotos (Lightbox): Não redirecione para novas rotas ao exibir mídias. Use componentes de Lightbox com zoom in-place (como `react-medium-image-zoom`) com fundo escuro (WhatsApp style) (Spec 053).
- Rastreabilidade de UI: Mídias antifraude devem ter o timestamp real (HH:MM:SS) e a tag de GPS estampadas diretamente na miniatura/modal para inibir fraude.

## Diretrizes de Backend e Banco de Dados (Supabase)
- Tolerância zero no All-or-nothing: Salvar auditorias incompletas apenas localmente e subir payloads massivos com `raw_payload` em colunas JSONB pra redundância.
- Restrições de Fila: Sempre usar `insert` ao invés de `upsert` com onConflict `lead_id` na `ai_task_queue` (a tabela loga eventos múltiplos por lead) (Spec 051).

## Lógica da IA e LLM (Zero Trust)
- Confiança Zero: O LLM nunca deve inventar estágios ou assumir vitórias se não houver contexto na conversa do WhatsApp.
- Míngua de contexto ("Parking Lot"): O LLM é instruído de forma estrita e imperativa a DERRUBAR estágios (incluindo `closed_won`) se for um simples pós-venda (Spec 051).
