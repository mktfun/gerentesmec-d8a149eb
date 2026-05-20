# Research: Backend Transition & Smart AI Router (016)

## 1. Contexto do Pedido
O escopo do projeto evoluiu de um front-end (mock) para uma transição completa e definitiva para um Backend real. 
Os novos requisitos do usuário são:
1. **Configuração Inteligente de IA:** Ao inserir uma API Key, o sistema deve testar automaticamente as capacidades (Visão, Áudio, Vídeo). Se o modelo configurado não suportar algo, o sistema recomendará dinamicamente uma alternativa melhor, não restrita à mesma família (ex: "O modelo X não suporta vídeo. Recomendamos o Claude 3.5 Sonnet via Anthropic").
2. **Resumo Final do Lead:** Quando um lead é encerrado (fechado), a IA deve gerar um sumário executivo detalhado (problema, serviço, qualidade do atendimento) e salvar no banco para análises futuras (Big Data).
3. **Transição "Mock to Prod" (Zero Localhost):** Abandono total de `mockData.ts`. Toda a arquitetura de tabelas (Leads, Gerentes, Unidades, Configurações de IA) deve ser provisionada no Supabase.
4. **Senior SDD (Software Design Document):** O usuário exige uma documentação de arquitetura de nível sênior cobrindo bancos de dados, integrações de webhook e Edge Functions.

## 2. Análise Técnica e Desafios

### 2.1 Database Schema (Supabase)
Precisaremos migrar a estrutura atual para o PostgreSQL:
- `units` (Unidades da mecânica)
- `managers` (Gerentes responsáveis)
- `leads` (Clientes, com histórico de estágios e sumário final de fechamento)
- `ai_settings` (Configuração global do Provider e testes de capacidade)

### 2.2 Smart Provider Diagnostics
- Na tela `/config`, quando o usuário digita a Key e salva, uma Edge Function `test_ai_capabilities` será invocada.
- Essa função fará requisições curtas de teste (um texto, uma imagem, um áudio simulado) usando a chave fornecida. O que falhar, ela anota.
- A função retornará um JSON de diagnóstico com o mapa de capacidades e a recomendação de upgrade ("Upgrade to gpt-4o" ou "Use gemini-1.5-pro via OpenRouter for Video").

### 2.3 Resumo Final (Closing Summary)
- No `AuditPanel.tsx` (ou Kanban), ao mover o lead para `closed_won` ou `closed_lost`, o front-end dispara a mudança de estágio para o banco.
- Um Database Trigger ou uma chamada síncrona invoca a Edge Function `generate_lead_summary`.
- A função puxa o histórico (do Chatwoot, ou do próprio histórico do lead) e grava no campo `closing_summary` da tabela `leads`.

### 2.4 Transição Front-end -> Backend
- O `AppDataContext.tsx` será completamente reescrito para utilizar `@supabase/supabase-js`.
- O app consumirá as views e tabelas em Real-time (Supabase Realtime subscriptions) para que o Kanban e o Dashboard atualizem sozinhos quando a Edge Function agir nos bastidores.
