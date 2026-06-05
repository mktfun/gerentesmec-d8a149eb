# Design: Correção da Lógica do Avaliador

## 1. Alteração no Supabase (Edge Function)
A lógica principal reside em `supabase/functions/ai-autonomous-evaluator/index.ts`.
O *System Prompt* precisa ser reescrito na seção de "CRITÉRIOS RÍGIDOS PARA MUDANÇA DE ETAPA".

**Antes (Errado):**
`- 'closed_won' (Ganho): USE APENAS SE o cliente pagou OU se ele deu uma confirmação EXPLÍCITA INEQUÍVOCA de que aprovou o serviço...`

**Depois (Corrigido):**
`- 'negotiation' (Em Atendimento): O serviço ESTÁ SENDO EXECUTADO. O cliente acabou de aprovar o orçamento, ou o gerente está mandando fotos da peça desmontada. Se o cliente disser "Pode fazer/Aprovado", VOLTE PARA ESTA ETAPA (negotiation), pois a oficina vai começar a consertar o carro.`
`- 'closed_won' (Ganho / Finalizado): USE **EXCLUSIVAMENTE** NO FIM DO FIM. Apenas quando o carro já foi entregue, pago, e o gerente se despede enviando o link de avaliação do Google ou Termo de Garantia.`

## 2. Ajuste para Checkbox `2e`
Para garantir que a IA em lote (`mixed`) pontue a aprovação corretamente, adicionaremos uma trava explícita no prompt:
`⚠️ REGRA PARA LOTES MISTOS: Se houver mensagem do cliente no meio do lote dizendo "aprovado/pode fazer", VOCÊ DEVE OBRIGATORIAMENTE marcar o item "2e" como true na chave audit_checklist, independentemente do que o gerente disse depois.`

## 3. Sem impacto na UI (Stitch MCP)
Não haverá mudanças visuais na interface atual. A estrutura do banco de dados (Supabase MCP) também permanecerá idêntica. Apenas a inteligência (prompt) será calibrada para se adaptar ao fluxo físico real de uma oficina mecânica.
