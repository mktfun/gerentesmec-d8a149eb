# Design Document: WhatsApp Monitoring v2 (Surdina)

## 1. UX/UI Architecture (Stitch MCP + UX 2026)
O design deve abandonar o modelo simplista anterior de tabelas corporativas chatas e adotar um painel investigativo profundo, focado no auditor (João). A interface principal (`Index.tsx`) deve permanecer oculta ou ser revertida para algo neutro (como se a agência estivesse ainda no começo) e a ferramenta real será na rota secreta `/vault`.

### Estética Visual e Interação (Frontend-First, UX Extrema)
- **Vibe:** "Command Center Furtivo". Dark Mode predominante (tons `slate-950` e `slate-900`) para diminuir o brilho durante longas sessões de auditoria, ou um Light Mode extremamente sofisticado (Apple Liquid Glass) usando blur intenso (`backdrop-blur-xl`) e bordas vítreas (`border-white/20`).
- **Animações (O App "Vivo"):** 
  - Framer Motion para transições de tela suaves.
  - Hover effects em cada card, botão e menu.
  - Animação de números subindo ("Count Up") para o Score.
  - Elementos surgem em "Fade In Up" ou "Stagger" ao montar a tela.
- **Cards do Kanban:** Elementos "táteis" (Tactile Maximalism). Os cards devem parecer reais, com uma pequena barra superior indicando o SLA.
  - **Verde/Neutro:** Tempo de resposta < 10m.
  - **Amarelo:** Tempo > 10m.
  - **Vermelho Piscante (Pulse Suave):** SLA Estourado (> 20m). O auditor sabe imediatamente onde intervir.
- **Drill-down Panel:** Ao clicar no card, um painel lateral (`Sheet` do Shadcn) se abre animado.
  - Header: Dados do Cliente e Gerente responsável.
  - Corpo: Histórico das anotações e proofs (links).
  - Footer Fixo: A matriz das 4 Etapas em formato de *Checkboxes Avançados*.
- **Score Visual:** Gráfico circular (Radial Progress) ou barra animada de progresso mostrando a nota (0-100).

### Estrutura de Componentes
- `VaultLayout`: O layout secreto para João.
- `KanbanBoard`: Componente aglutinador.
- `KanbanColumn`: Colunas por status (Aguardando Resposta, Atendimento, Pós-Venda, Concluído).
- `KanbanCard`: O card do atendimento com contagem regressiva de SLA (20 minutos).
- `AuditSheet`: Painel de auditoria para marcar as 4 etapas e anexar evidências (vídeos, etc).

## 2. Banco de Dados (Supabase MCP)

A estrutura anterior servirá de base, mas vamos ajustá-la para refletir com exatidão a transcrição.

### Atualização da Tabela `whatsapp_cycles`
- O `max_response_time_breached` agora deve ser calculado dinamicamente ou complementado com `last_message_at` e `status` (ex: `waiting_reply`, `in_progress`, `closed`).
- Adicionar colunas para anotações do auditor: `auditor_notes` (text).

### Atualização da Tabela `cycle_steps`
Garantir o rastreio explícito das 4 etapas ditadas. Não será genérico, será rígido:
- A linha `step_number` será substituída pelas etapas exatas para evitar ambiguidade.
Podemos modificar a arquitetura ou apenas padronizar o JSON da aplicação:
  - 1 = Cordialidade e Registro no WhatsApp.
  - 2 = Processo Principal (Orçamento c/ Vídeo e Texto de Efeitos).
  - 3 = Checklist Complementar do Mecânico.
  - 4 = Solicitação de Avaliação Google.

### Tabela de Auditoria Expandida (Novo)
Se necessário, criar uma tabela `audits` ou `proofs` ligada ao `cycle_id` para salvar arrays de URLs (os vídeos que o gerente enviou e que o João verificou). Para simplificar o MVP e não demorar (conforme exigido: "prazo de 10 dias"), vamos salvar isso em formato `jsonb` ou `text` diretamente na tabela `whatsapp_cycles` (`auditor_proofs`).

## 3. Integração (Edge Functions)
A extração de conversas do Chatwoot deve continuar rodando em *background*, puxando eventos e colocando no banco para o Kanban se atualizar em tempo real. Os cron jobs (se configurados via `pg_cron` ou Edge Functions invocadas) lerão o tempo `created_at` das mensagens de clientes sem resposta e sinalizarão as bandeiras amarelas/vermelhas de SLA.
