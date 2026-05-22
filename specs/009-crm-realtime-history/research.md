# Research Pré-Implementação: Real-time, Histórico de Mensagens e Métricas

## Análise de Requisitos e Arquitetura Atual
1. **Métricas de Performance (`Relatorios.tsx`)**: O cálculo atual apenas realiza a média das pontuações E1, E2, E3, E4 e Score Geral para os leads que possuem nota. O usuário deseja que o denominador seja o total absoluto de leads/conversas do gerente no período, penalizando "vazios" e dando um peso real de conversão/qualidade.
2. **Visualização de Histórico**: O usuário deseja clicar em um card de lead no CRM e ver o histórico completo de mensagens (`chat_messages`) de forma estética (seguindo o SDD - design premium 2026).
3. **Atualização em Tempo Real (Realtime)**: O usuário relata necessidade de Hard Refresh para ver novas mensagens. O arquivo `AppDataContext.tsx` já possui listeners de Realtime do Supabase configurados (`.on('postgres_changes')`), porém precisamos garantir que as alterações no `last_message_at` e novos leads acionem a reordenação das colunas e que a interface reaja adequadamente.

## Supabase Realtime
A falta de atualizações automáticas na tela geralmente decorre de:
a) Tabela `leads` ou `chat_messages` não possuir o "Realtime" ativado no Replication Settings do Supabase Dashboard.
b) Falta de uma ordenação reativa nos componentes que dependem do `last_message_at`.

## Design Pattern (Histórico)
Vamos construir um Side-Panel (Sheet) elegante com Shadcn UI no `Crm.tsx` ou componente apartado, exibindo as mensagens como bolhas de chat (WhatsApp/Chatwoot style), diferindo `contact` (cliente) de `user` (gerente) e `bot` (IA).
