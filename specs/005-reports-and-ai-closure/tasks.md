# Tasks: 005-reports-and-ai-closure

## 1. Webhook & Histórico de Imagens
- [x] Atualizar `src/components/Crm/ChatHistoryView.tsx` alterando `media_type === 'image'` para `media_type?.startsWith('image')` e fazendo o mesmo para áudios e vídeos.

## 2. Parecer de Fechamento e Dados (IA)
- [x] Editar a edge function `supabase/functions/ai-autonomous-evaluator/index.ts` inserindo no `prompt` o pedido pela geração de um `closing_summary`, `ticket_value` e `customer_vehicle`.
- [x] Atualizar o objeto `mockOutput` para incluir a simulação de `closing_summary` e `customer_vehicle`.
- [x] Atualizar a chamada ao Supabase (`supabaseClient.from('leads').update()`) injetando as chaves `closing_summary`, `ticket_value` e `customer_vehicle` no DB.
- [x] Fazer o deploy da Edge Function `ai-autonomous-evaluator`.
- [x] Atualizar o `simulate-ai.mjs` para refletir o envio do `closing_summary` também, a fim de não invalidar as simulações locais.

## 3. Filtros na Tela de Relatórios (Analytics)
- [x] Atualizar `src/pages/Relatorios.tsx`.
- [x] Criar os hooks de estado: `selectedUnit` (string), `scoreOrder` ('asc' | 'desc' | null), `slaOrder` ('critical' | null).
- [x] Inserir os componentes <select> customizados na área superior (`Header & Filters`).
- [x] Modificar o array `currentLeads` para passar pelos filtros ativados antes de calcular as métricas e a performance dos gerentes.
- [x] Garantir que a tabela "Log de Auditorias Recentes" também obedeça a estes filtros.
