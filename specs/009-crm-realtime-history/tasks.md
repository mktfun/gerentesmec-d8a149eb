# Tasks: Realtime, Histórico e Ajuste de Relatórios

- [ ] Editar `src/pages/Relatorios.tsx` para garantir que o denominador do cálculo das etapas (E1, E2, E3, E4) e Score Geral seja o total de leads do gerente no período, e não apenas a quantidade de leads com notas ativas (similar ao que foi feito em `Index.tsx`).
- [ ] Criar modal estético (`LeadHistoryModal` ou direto no `Crm.tsx`) que seja acionado ao clicar num card de lead.
- [ ] O Modal de histórico deve exibir as mensagens daquele lead extraídas de `supabase.from('chat_messages')`. 
- [ ] Adicionar evento realtime em `AppDataContext.tsx` escutando a tabela `chat_messages` (se não houver) e confirmar se as atualizações em `leads` (via `chatwoot-webhook`) refletem nas listas reativas.
- [ ] Escrever alerta para o usuário orientando ativar o Realtime no Dashboard do Supabase para as tabelas `leads` e `chat_messages`, visto que isso geralmente não é ativado por padrão nas instâncias remotas.
