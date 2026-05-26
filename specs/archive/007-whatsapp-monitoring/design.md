# Design Document: WhatsApp Monitoring Playbook

## 1. UI/UX Architecture (Stitch MCP + UX 2026 + ConciliaMec Style)

Inspirado no design minimalista de alta conversão de [ConciliaMec](https://conciliamec.lovable.app/):

### Estética Visual (Clean, High Contrast & Tactile)
- **Vibe:** Clean Minimalist com paleta de tons suaves e de alta performance. 
- **Cores principais:** Fundo `slate-50`/`blue-50`, cartões brancos com bordas extremamente sutis (`border-slate-100` ou `border-slate-200/80`), realces em azul elétrico (`blue-600`/`blue-700`) e cores funcionais dopamínicas (ex: verde suave para conformidade, vermelho/amber para divergências e falhas).
- **Liquid Glass & Shadowing:** Superfícies limpas com sombras multicamadas bem leves para criar profundidade orgânica:
  ```css
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05);
  ```
- **Tipografia:** `Outfit` ou `Geist` para Títulos e Destaques numéricos grandes. `Inter` ou `Geist` para o corpo.

### Estrutura da UI do Dashboard
- **Header:** Inspirado no ConciliaMec, um cabeçalho limpo com o logo "Mecânica Popular · WhatsApp Playbook" à esquerda, data da última sincronização à direita.
- **Top Metrics Cards:**
  - **Divergências da Semana:** Destaque para atendimentos que falharam nas etapas obrigatórias ou estouraram os 20 minutos (estilo "-R$ 319,36" do ConciliaMec, mas em formato de contagem de falhas, ex: "-12 Falhas").
  - **Saldo de Compliance Geral:** Porcentagem global de conformidade das unidades (ex: "88.4%").
- **Motor de Monitoramento (Tabela Principal):**
  - Lista de atendimentos recentes com status de cada uma das 4 etapas (indicadores visuais redondos e interativos para Etapa 1, 2, 3 e 4).
  - Indicação clara se houve furo no tempo de resposta (ex: "Jorge Bereta - OS #4821 • Hoje, 07:34 • Furo de 20 min").
- **Módulo de Gestão (CRUD Equipes):**
  - Painel discreto para adicionar/vincular unidades (`units`) e gerentes (`managers`).
- **Configurações Ocultas (`/config`):**
  - Painel oculto com campos limpos para atualizar o Access Token do Chatwoot e o ID da Conta Supabase de forma invisível.

## 2. Modelagem de Banco de Dados (Supabase MCP)

Banco de dados hospedado no projeto Supabase `qtjitszradxsmnilnqtj`.

### Tabelas Principais

1. **`units` (Unidades)**
   - `id` (uuid, PK)
   - `name` (text) - Ex: "Jabaquara", "Dom Pedro", "Kennedy"
   - `google_place_id` (text, nullable)
   - `created_at` (timestamptz)

2. **`managers` (Gerentes)**
   - `id` (uuid, PK)
   - `unit_id` (uuid, FK para `units`)
   - `full_name` (text)
   - `phone` (text)
   - `chatwoot_inbox_id` (int, nullable) - Para filtragem automática das conversas

3. **`whatsapp_cycles` (Ciclos de Atendimento)**
   - `id` (uuid, PK)
   - `manager_id` (uuid, FK para `managers`)
   - `customer_phone` (text)
   - `started_at` (timestamptz)
   - `max_response_time_breached` (boolean, default false)

4. **`cycle_steps` (Etapas do Atendimento)**
   - `id` (uuid, PK)
   - `cycle_id` (uuid, FK para `whatsapp_cycles`)
   - `step_number` (int) - 1, 2, 3 ou 4
   - `is_compliant` (boolean)
   - `reason_failed` (text, nullable)
   - `evaluated_at` (timestamptz)

5. **`google_reviews_log` (Integração Google)**
   - `id` (uuid, PK)
   - `unit_id` (uuid, FK para `units`)
   - `review_count_diff` (int) - Discrepância de reviews calculada
   - `logged_date` (date)

## 3. Integração Furtiva (Chatwoot API)
- As chaves de acesso serão salvas na tabela `system_settings` ou persistidas em variáveis de ambiente seguras no Supabase.
- A sincronização automática buscará periodicamente novas conversas via API REST (`GET /api/v1/accounts/{account_id}/conversations`) para avaliar o compliance usando algoritmos locais ou funções de processamento de texto.
