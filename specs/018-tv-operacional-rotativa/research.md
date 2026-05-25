# Research: TV Operacional Rotativa (Visão Detalhada por Unidade)

## Contexto Atual
Atualmente, a TV Operacional (`/tv/operacional`) exibe um Grid Fixo de gerentes com métricas super compactas. A TV Executiva ("A do Daniel", em `/tv/executivo`) possui um carrossel elegante que alterna entre uma Visão Macro (Score Geral) e as unidades agrupadas (Score da IA, conversão, etc.).

## O Problema
O usuário solicitou uma TV Operacional que junte o melhor dos dois mundos:
1. Deve ser rotativa (passando automaticamente como a do Daniel).
2. O foco deve ser Operacional (filas de espera, SLAs, TMR), não auditoria de IA.
3. Deve dar um foco profundo ("visão detalhada") em CADA unidade, evitando poluição.
4. Deve seguir o padrão premium de design SDD (elegante, sutil, organizado e limpo).

## Benchmarking & Solução Visual
Em vez de amontoar todos os gerentes do Brasil numa tela só (o que causa poluição), a abordagem de **Carrossel Operacional** focará em:
- **1 Tela = 1 Unidade (ou no máximo 2 unidades por tela).**
- Em cada tela, veremos o Header da Unidade (Nome, TMR da Loja, Leads Totais Ativos).
- Abaixo, cards detalhados, mas limpos, para os **Gerentes daquela unidade**.
- Se a unidade tiver gargalos (Leads Vermelhos), eles podem ganhar um destaque elegante na tela (ex: "Atenção Crítica: Fulano - 45m de espera").

Isso permitirá que o dono/operador acompanhe os detalhes finos (quem está atrasado, quantos leads cada loja tem na mão) sem se perder em uma grade massiva de dados espremidos.
