# Design: LLM Monitoring Dashboard

## Padrões Visuais (Skill: ux-ui-architect-2026)
O design exigirá branding dedicado para cada um dos provedores, incorporando as diretrizes de "Liquid Glass" e maximalismo estético de 2026. 

### Branding HSL Cores
- **OpenAI:** `hsl(161, 82%, 35%)` - Fundo semi-translúcido sobre preto profundo.
- **Google Vertex AI / Studio:** `hsl(217, 89%, 61%)` com micro-gradientes em vermelho e amarelo nas bordas.
- **NVIDIA NIM:** `hsl(93, 100%, 36%)` - Neon forte vibrante, com forte uso de tipografia Mono/Bruta para parecer industrial.
- **Anthropic:** `hsl(28, 86%, 86%)` e tons pastéis escurecidos no fundo.

### Componentes de UI (Stitch UI)
O dashboard fará parte do modal ou de uma nova aba na UI do painel do `AiRouterConfig.tsx` e `AdvancedAiPanel.tsx`.

1. **Header do Dashboard**: Mostrará o provider e o modelo atual selecionado, brilhando com a sua respectiva paleta de cores.
2. **Limit Gauges**: Componentes radiais (Radix Progress) ou barras de progresso para exibir o limite. 
   - *Exemplo Visual:* "Você usou 12 / 15 Requisições neste minuto." -> Progress Bar (80%). Muda para Vermelho perto do limite.
3. **Métricas Consolidadas (Cards)**:
   - Sucessos Totais (Mensal).
   - Erros Totais (Mensal).
   - Latência Média.
4. **Log Table**: Tabela de rastreabilidade (usando `<Table>` do Shadcn) focada no diagnóstico.
   - Status: `<Badge variant="success">OK</Badge>` ou `<Badge variant="destructive">ERR</Badge>`.
   - Payload Limitado (Truncate + Modal View).

## Banco de Dados (Supabase)
Criaremos a tabela `llm_usage_logs` via migration SQL. Não haverá RLS ativado (ou usaremos um RLS atrelado apenas a managers administrativos).

```sql
CREATE TABLE public.llm_usage_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    provider text NOT NULL,
    model text NOT NULL,
    status text NOT NULL CHECK (status IN ('success', 'error')),
    error_message text,
    latency_ms integer,
    tokens_used integer
);

-- Indexar para queries mais rápidas de contagem de RPM
CREATE INDEX idx_llm_usage_logs_created_at ON public.llm_usage_logs (created_at);
```
