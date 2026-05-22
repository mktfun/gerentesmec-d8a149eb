# Design: 005-reports-and-ai-closure

## 1. Relatórios (Filtros Avançados)
Vamos adicionar uma barra de controles (Control Bar) acima ou à direita do atual filtro de datas em `src/pages/Relatorios.tsx`.
- **UI:** Utilizaremos selects nativos ou dropdowns baseados no design system existente (bordas suaves, fundos escuros `bg-[#0a0a0f]`, foco com aneis primários sutis).
- **Campos:**
  - `Select de Unidade`: "Todas as Unidades", "Dom Pedro", "Jabaquara", etc. (dinâmico vindo de `units`).
  - `Select de Ordenação Score`: "Maior para o Menor", "Menor para o Maior".
  - `Select de Ordenação SLA`: "Críticos Primeiro", "Menos Críticos Primeiro".
- O React `useState` guardará esses estados (`selectedUnit`, `scoreOrder`, `slaOrder`).
- A lógica de processamento de `currentLeads` será encadeada (Filter by date -> Filter by unit -> Sort by SLA -> Sort by Score) antes de renderizar as métricas globais e a tabela `Log de Auditorias Recentes`.

## 2. Correção Mime Type (Imagens)
A quebra de abstração em `src/components/Crm/ChatHistoryView.tsx` será arrumada nas linhas 233 e seguintes:
- **Antes:** `msg.media_url && msg.media_type === 'image'`
- **Depois:** `msg.media_url && msg.media_type?.startsWith('image')`
- Aplicar o mesmo para áudio (`startsWith('audio')`) e vídeo (`startsWith('video')`).
Isso garantirá a robustez visual independente da versão de upload do Chatwoot.

## 3. Geração do Closing Summary e Extração de Dados (AI)
O Edge Function `supabase/functions/ai-autonomous-evaluator/index.ts` terá seu prompt estendido:
- Requisito do prompt: Retornar um JSON contendo `closing_summary` (Dossiê consolidado), `ticket_value` (valor financeiro extraído ou null) e `customer_vehicle` (modelo do carro ou null).
- Ao final, atualizar a tabela `leads` no DB injetando `closing_summary: mockOutput.closing_summary`, `ticket_value: mockOutput.ticket_value` e `customer_vehicle: mockOutput.customer_vehicle`.
- Em produção real, o LLM gerará esse JSON analisando o histórico bruto da conversa e as intenções.
