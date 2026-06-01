# Design - Background Historical Auditor

## Arquitetura (Supabase + React)

A UI rodará um `BackgroundAuditorService` (por exemplo, dentro do `AppDataContext` ou acionado em um nível superior de layout), garantindo que sempre que a aplicação estiver em foco (aba aberta), a "limpeza" do banco continuará.

### Tabela (Supabase)
As mensagens a serem auditadas já estão identificadas através da combinação:
```sql
chat_messages.ai_audited = false 
AND chat_messages.sender_type = 'user'
```

Precisaremos adicionar um controle simples de Retry na tabela ou, de forma mais inteligente, salvar uma Flag/Timestamp de `last_evaluation_attempt` (ou `evaluation_status: 'pending' | 'error' | 'success'`) caso queiramos lidar com falhas definitivas de JSON. (O esquema foi parcialmente adaptado na especificação de Retry da queue).

### UI (Stitch MCP - Shadcn)
No componente `AdvancedAiPanel`, seção "Fila de Avaliação IA", expandiremos:
- **Toggle (Switch):** "Auto-Processar Histórico em Background (Slow Mode)"
- **Slider ou Select:** "Intervalo de Cooldown" (ex: "Processar 1 a cada 5s", "10s", "30s").
- **Status Label:** "Processando lead X (Mensagem Y) / Em Cooldown (4s restantes) / Pausado por Erro".

Este componente usará os princípios do **Maximalismo Tátil** (botões que reagem, bordas brilhosas discretas no status em andamento) para manter a coerência 2026.

## Por que não um Cron do Postgres?
Um cron do postgres chamando a edge-function a cada X segundos não é viável com a extensão `pg_cron` padrão do Supabase Cloud (limite de minuto) e poderia causar DoS se não tiver mutex distribuído forte. Comandar a orquestração via Cliente (React) permite que a UI exiba o progresso exato e que o usuário feche a aba se a máquina começar a ficar lenta.
