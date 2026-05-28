# Design - Feature 008

## UI / UX (Stitch & Antigravity)
- **AdvancedAiPanel Modal**: Vai receber todo o `<AiRouterConfig />`. O modal precisa ter largura generosa (pelo menos `max-w-4xl`) para comportar a visualização dupla de configurações e telemetria confortavelmente.
- **ProviderMonitoring**:
  - Na listagem de logs (table), adicionar um botão em logs de SUCESSO com o ícone de "Code" (`<Terminal />` ou `<Eye />`) que abre um Modal de Logs.
  - **Log Details Modal**: Um painel sobreposto minimalista com blur no fundo (Apple Liquid Glass).
    - Terá duas grandes abas: **INPUT (Prompt)** e **OUTPUT (Result)**.
    - O conteúdo será mostrado em formatação Markdown (ou `<pre>`/`<code>` bonito com sintaxe colorida leve) para permitir leitura do "pensamento" (chain of thought) da IA.
    - No header deste modal, mostrar: `Tokens Gasto: X`, `Tokens Restantes: Y`, `Latência: Z ms`.
- **Aesthetic (Skill: ux-ui-architect-2026)**:
  - Continuar usando tons vibrantes e neon nos badges de provedor (Verde para OpenAI, Azul para Google, etc).
  - Sombras multicamadas nos modais de log (`shadow-[0_0_40px_rgba(...,0.1)]`).

## Database / Backend (Supabase)
- **Migration**: `20260528120000_llm_usage_logs_v2.sql`
  ```sql
  ALTER TABLE public.llm_usage_logs 
  ADD COLUMN input_text text,
  ADD COLUMN output_text text,
  ADD COLUMN tokens_limit_remaining integer;
  ```
- **RPC/Functions**:
  - Nenhuma Edge Function precisa ser obrigatoriamente reescrita na spec, mas precisamos garantir que os logs da UI e do RPC preencham o input e output adequadamente no banco (se eles tiverem sido passados). No momento, vamos apenas atualizar a tipagem do client e preparar as colunas.
- **Types**: `npm run gen-types` (ou localmente gerados manualmente `types/supabase.ts`) para incluir as novas propriedades.
