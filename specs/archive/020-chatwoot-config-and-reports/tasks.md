# Tasks: Configuração Chatwoot & Relatórios (020)

- [ ] **1. Tabela de Configurações**: Criar migration no Supabase `create table system_configs` para guardar a URL da API e Access Token do Chatwoot.
- [ ] **2. Aba Chatwoot no Config.tsx**:
  - Refatorar `Config.tsx` para ter abas ou adicionar a tela de integração do Chatwoot.
  - O design deve ter o passo a passo, mostrando a URL do webhook: `https://[SUPABASE-PROJECT].functions.supabase.co/chatwoot-webhook`.
  - Botão estético de "Copiar".
  - Formulário para inserir o Access Token do Chatwoot e URL base, com botão salvar.
- [ ] **3. Relatórios Dinâmicos (`Relatorios.tsx`)**:
  - Remover valores fixos (mockados).
  - Calcular TMR (Tempo Médio de Resposta) somando `l.wait_time_minutes` dos leads em andamento/perigo.
  - Listar na tabela os leads da aplicação.
- [ ] **4. Reparo no Dashboard (`Index.tsx`)**:
  - Modificar o container de unidades para exibir as métricas de Score Global de forma orgânica, revertendo o carrossel comprimido e melhorando a quebra de linha.
- [ ] **5. Persistência dos Checkboxes no Dossiê (`AuditPanel.tsx`)**:
  - Salvar o objeto `checked` na tabela `leads` ou recalcular com base em uma nova coluna de jsonb, para que as caixinhas marcadas não resetem ao fechar o modal.
- [ ] **6. Edge Function Sincronizadora**: 
  - Preparar a interface na tela de configuração para acionar no futuro a importação do histórico.
