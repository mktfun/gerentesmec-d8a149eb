# Tarefas - Automação Link Scraping & Novos Critérios

- [ ] **Passo 1 (Refatoração UI/Checklist):**
  - Mover o objeto `auditStepsConfig` do `AuditPanel.tsx` para `src/utils/scoreUtils.ts`.
  - Atualizar os imports no `AuditPanel.tsx` e `ReadOnlyAuditPanel.tsx`.
  - Adicionar na etapa 2 (Orçamento) os novos itens:
    - `id: '2d'`, text: 'Enviou o link do checklist do veículo detalhando os defeitos e as fotos?'
    - `id: '2e'`, text: 'Obteve resposta (sim/ok) de aprovação do cliente após enviar orçamento/checklist?'
- [ ] **Passo 2 (Web Scraping Básico em Deno - Edge Function):**
  - Abrir o arquivo `supabase/functions/ai-autonomous-evaluator/index.ts`.
  - Criar função utilitária `extractLinks(text: string): string[]`.
  - Criar função assíncrona `fetchAndCleanHtml(url: string): Promise<string>`. Deve usar regex para limpar tags `<script>`, `<style>` e todas as HTML tags, retornando apenas texto puro.
  - Varredura nas mensagens enviadas ao Gemini para encontrar links, fazer o fetch, e construir uma string com o conteúdo de todos eles.
- [ ] **Passo 3 (Atualização do Prompt no Edge Function):**
  - Atualizar a instrução do Gemini em `ai-autonomous-evaluator/index.ts`.
  - Injetar o texto raspado dos links como contexto adicional.
  - Modificar a validação do JSON (adicionar suporte aos items `2d` e `2e`).
  - Adicionar diretrizes explícitas: "Ao avaliar links de orçamentos ou vídeos, não dê pontuação apenas por existir o link. Verifique o conteúdo associado ao link que foi raspado e garanta que haja justificativas, fotos (se mencionado) e detalhes técnicos. Se faltar, zere o item e explique por quê".
- [ ] **Passo 4 (Deploy):**
  - Fazer o deploy da função `ai-autonomous-evaluator`.
