# Proposal: ServiceMatcher Híbrido

## 1. Visão Geral (O Problema)
Atualmente, o processo de matching de serviços automotivos enviados pelos usuários no WhatsApp baseia-se em correspondências exatas. Devido à imensa variabilidade da linguagem natural (abreviações, sinônimos, descrições coloquiais, inversão de palavras), os usuários frequentemente deparam-se com erros de "Serviço não encontrado no catálogo", o que prejudica severamente o recall do sistema.

## 2. A Solução Proposta
Para contornar esta limitação de matching engessado, propõe-se o **ServiceMatcher**, uma solução baseada em **busca híbrida de múltiplas etapas**. Este mecanismo aplicará fuzzy matching, geração de candidatos e ranking multifatorial, de forma que o sistema consiga retornar correspondências aproximadas, solicitando a confirmação do usuário ("Você quis dizer...") ou mesmo assumindo o serviço automaticamente se a similaridade atingir faixas de alta confiança.

## 3. Integração na Arquitetura
O `ServiceMatcher` será exposto no backend como uma engine de busca em memória ou baseada em SQL (ex: PostgreSQL com `pg_trgm`), consumindo o catálogo de serviços.
No contexto atual (worker autônomo e n8n), o n8n ou o Worker farão a intercepção da "query" de texto livre, rodarão pelo `ServiceMatcher` comparando com a lista mestre de serviços do Tempario, e só então executarão a ação no frontend headless ou acionarão o webhook de confirmação (`/confirmar`) do WhatsApp.

## 4. Escopo do Pipeline
Conforme especificado pelo usuário, o pipeline se dividirá em quatro etapas principais:
1. **Normalização do Texto**: Strip de acentos, caracteres, singularização básica e casefold.
2. **Dicionário de Sinônimos**: Expansões mecânicas (`troca` -> `substituicao`).
3. **Geração de Candidatos (Blocking)**: Filtragem rápida por sobreposição de prefixos/tokens.
4. **Ranking (Scoring)**: Aplicação de heurísticas ponderadas em que a fórmula compõe: exato, sobreposição, trigramas, penalidades por itens genéricos e bônus por tokens críticos.

## 5. Limiares de Confiança (Thresholds)
- **Top >= 0.93 e gap > 0.08**: `Match Automático`.
- **Top >= 0.85**: `Match Provável (Pede Confirmação)`.
- **0.70 <= Top < 0.85**: `Sugestões (Lista 3-5 aproximações)`.
- **Top < 0.70**: `Não Encontrado (Rejeita)`.
