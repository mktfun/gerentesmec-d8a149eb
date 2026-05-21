# Research: UX do CRM, Ordenação e Status de Gerentes

## Contexto e Dores
1. **Status "Sem Gerente"**: Os cards no Kanban estão exibindo "Sem Gerente" mesmo quando existem gerentes cadastrados. Isso ocorre porque leads antigos ou recém-criados podem não ter o `manager_id` preenchido diretamente. A solução é fazer um fallback visual: se o lead não tem gerente atribuído, exibir o primeiro gerente cadastrado da unidade do lead.
2. **Ordenação do Kanban**: A hierarquia dos cards deve ser pela última mensagem recebida/enviada (mais recente no topo). E o card deve mostrar os minutos decorridos desde a última mensagem (`last_message_at`), independentemente de quem enviou, para que o gerente tenha noção do tempo de inatividade da conversa.
3. **Link do Chatwoot no AuditPanel**: O botão criado na etapa anterior não apareceu, provavelmente porque a tabela `integration_settings` não está populada no BD, falhando na condição `integrationSettings?.chatwoot_url`. O usuário quer apenas um ícone discreto (link externo) ao lado do nome, sem texto. Vamos fazer um fallback na URL para não ocultar o botão.
4. **Label "Online no Chatwoot"**: O usuário quer simplificar para apenas "Canal Online" na barra superior do chat, removendo a menção à ferramenta.

## Arquivos Afetados
- `src/components/Crm/KanbanView.tsx` (ordenação dos leads)
- `src/components/Crm/KanbanCard.tsx` (fallback do gerente e exibição dos minutos da última mensagem)
- `src/components/Crm/AuditPanel.tsx` (ajuste do botão de link externo)
- `src/components/Crm/ChatHistoryView.tsx` (label "Canal Online")
