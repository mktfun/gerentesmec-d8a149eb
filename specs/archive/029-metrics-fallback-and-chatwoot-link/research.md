# Research: Fallbacks, Chatwoot Link e Chart Fix

## Contexto e Dores
1. **Dados Zerados (Efeito Colateral)**: Ao mudarmos a lógica do TMR para exigir `last_client_message_at`, todos os leads *antigos* do banco (que não têm essa coluna preenchida) zeraram o TMR. Precisamos de um Fallback (se não tiver a coluna nova, usar `last_message_at` como aproximação, ou preservar o zero mas sabendo que os leads novos virão corretos).
2. **Botão Chatwoot**: O usuário quer auditar a conversa facilmente. Precisamos de um botão discreto (ex: um ícone de Link externo com o logo do Chatwoot) no painel lateral do CRM (`AuditPanel.tsx` ou `Crm.tsx`). A URL do Chatwoot é montada pegando o `chatwoot_url`, `chatwoot_account_id` e o `chatwoot_conversation_id` do Lead.
3. **Gráfico de Evolução (Index.tsx)**: O gráfico de linha está exibindo médias matemáticas estranhas (média das médias) ao invés da média real ponderada (Soma total / Leads totais). Além disso, quando só temos 1 dia de dado, o Recharts pode renderizar a linha como um ponto isolado estranho. Precisamos de um visual agradável para "Empty State" ou "Apenas 1 Ponto".
4. **Relatórios (Relatorios.tsx)**: Esta tela também precisa importar o utilitário do TMR para que os Insights não fiquem zerados.

## Arquivos Afetados
- `src/components/Crm/AuditPanel.tsx` (ou onde o detalhe do lead é renderizado) para colocar o link do Chatwoot.
- `src/pages/Index.tsx` (ajustar math do gráfico e TMR fallback)
- `src/pages/Relatorios.tsx` (ajustar TMR)
- `src/components/Dashboard/TvDashboard.tsx` (fallback do TMR)
