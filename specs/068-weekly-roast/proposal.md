# Spec 068: Inquisidor Semanal (AI Weekly Roast)

## 1. Visão Geral
Implementação de um sistema automatizado de "Roast" de vendas/atendimento. Uma IA atuará como um "Auditor Sênior Implacável", varrendo as conversas semanais resolvidas da equipe e detectando a falha mais crítica (ex: omissão de checklist, descaso, falha de precificação). O resultado será exposto de forma gamificada e chamativa na sessão de Relatórios gerenciais (PDF), motivando o engajamento na qualidade (via "medo" do painel vermelho ou celebração no padrão ouro).

## 2. Arquitetura Técnica

### 2.1 Backend e Pipeline Cron
- **Supabase Edge Function:** `ai-weekly-inquisitor`
- **Agendamento:** `pg_cron` (ou configuração via `supabase/config.toml` schedule) para rodar Sexta-feira às 16h00 `(0 16 * * 5)`.
- **Query de Extração:** Fetch em `chat_messages` / conversas onde `status = 'resolved'` limitados aos últimos 7 dias `(now() - interval '7 days')`.
- **System Prompt Zero-Trust:** O modelo deve obrigatoriamente encontrar uma prova do erro. Se não houver, ele utiliza a "Rota de Fuga" declarando a semana como Padrão Ouro.

### 2.2 Tabela de Insights (Database)
Nova tabela: `weekly_critical_insights`
- `id`: uuid (PK)
- `store_id`: uuid (FK da unidade analisada)
- `week_start`: date
- `week_end`: date
- `critical_failure_found`: boolean (Obrigatório para definir o roteamento visual Verde/Vermelho)
- `critical_quote`: text (A citação real extraída do banco como prova - *somente se houver falha*)
- `violation_reason`: text (Qual regra do checklist / atendimento foi rasgada)
- `improvement_action`: text (A correção ensinada pela IA)
- `created_at`: timestamptz
**RLS:** Leitura permitida para o gerente da `store_id`. Inserção apenas via Service Role (Edge Function).

### 2.3 Frontend UI (Relatórios e Exportação)
- Componente novo alocado no painel/PDF de Relatórios da unidade.
- **Bloco Fail (Vermelho):**
  - Título alert: `🚨 FALHA CRÍTICA DA SEMANA (ESTUDO DE CASO)`
  - Subtítulo (Contexto): "O que aconteceu"
  - Container cinza `bg-muted/50` contendo a `critical_quote` em itálico.
  - Veredito: A `improvement_action`.
- **Bloco Success (Verde):**
  - Se `critical_failure_found = false`, inibe a bronca e renderiza:
  - Título hero: `🏆 ATENDIMENTO PADRÃO OURO`
  - Descrição: "Nenhuma falha crítica de checklist detectada nas conversas resolvidas desta semana. Excelente trabalho da equipe."

## 3. Segurança e Escopo (Guardrails)
- O Relatório não pode ficar "carregando a IA" na frente do usuário, daí a persistência via `weekly_critical_insights` rodando isolada na sexta.
- O Prompt precisa forçar saída estruturada JSON (usando OpenAI JSON Mode / Gemini Response Schema) para não quebrar a lógica de UI.
