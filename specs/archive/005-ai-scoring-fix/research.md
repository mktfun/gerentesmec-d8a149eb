# Research: AI Scoring & Checklist Evaluation

## Problemas Identificados
1. **Trava de Interface (AVALIAÇÃO FECHADA):** O componente `AuditPanel.tsx` possui um bloqueio de interação quando `auto_scoring` está ativado. Isso impede o gerente de corrigir o checklist manualmente, causando a percepção de perda de controle caso a IA erre.
2. **Avaliações Zeradas (Score 0) e Dados Nulos:** O `ai-autonomous-evaluator` está apagando os dados anteriores. Quando uma nova mensagem entra, o LLM analisa *apenas o contexto da nova mensagem e o resumo*. Se a nova mensagem for irrelevante ("Ok, obrigado"), a IA não encontra nenhum critério do checklist nela e retorna `false` para todos os itens. O backend então **sobrescreve** o checklist existente no banco de dados com a nova avaliação (que tem score 0). Da mesma forma, se a IA não achar o valor do orçamento na mensagem nova, ela retorna `null`, o que sobrescreve o valor real no banco de dados que já havia sido preenchido antes.

## Mapeamento de Arquivos a Serem Modificados
1. `src/components/Crm/AuditPanel.tsx`
   - **Objetivo:** Remover as classes de `pointer-events-none opacity-40` e deletar a div absoluta que bloqueia o checklist.
2. `supabase/functions/ai-autonomous-evaluator/index.ts`
   - **Objetivo:** Alterar a lógica de atualização no banco (`updatePayload`). O backend deve **mergear** os checklists (só permitir que o status mude de falso para verdadeiro). Se `mockOutput.ticket_value` for `null`, ele NÃO deve ser atualizado no banco (manter o que já está salvo). O cálculo do `score` deve ser feito em código (com base nos pesos de avaliação que vêm da configuração `aiSettings`) e não usando o score cego retornado pelo LLM.

## Benchmarking & Solução Ideal
Em sistemas como Chatwoot ou Zendesk QA, as IAs de auto-scoring atuam como assistentes, preenchendo as rubricas (checklists) com base no histórico. Porém:
- O agente sempre pode sobrescrever a decisão da IA (removendo a trava).
- Avaliações devem ser cumulativas. A pontuação deve ser calculada estritamente através dos atributos booleanos (checklist) somados aos pesos matemáticos, e nunca gerada criativamente pelo LLM.
