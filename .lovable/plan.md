## Diagnóstico — onde estão os mocks

Após varredura, todos os "números fantasma" vêm de fallbacks hardcoded em 3 arquivos. Como as tabelas `leads`/`managers` estão **vazias** no Supabase, esses fallbacks aparecem em vez de zeros reais ou empty states.

| Tela | Fonte do mock | Linha |
|---|---|---|
| Dashboard — Score Global "0% Dom Pedro / Jabaquara / Kennedy" | Reduce sobre `leads` vazios; quando vira `NaN` o componente exibe `0%` por unidade, mas o **score global** ainda mostra fallback `78.5`, o badge `+2.5% esta semana` e a curva "Evolução do Score Global" usa o array fixo `globalScoreHistory` (Seg→Dom 65…95). | `src/pages/Index.tsx` 18-26, 49, 88-91, 157 |
| TV Mode — 62.5 / 87.5 / 75 | Função `getUnitScore` retorna **valores fixos por `unit_id`** ignorando `leads`. | `src/components/Dashboard/TvDashboard.tsx` 23-29 |
| Relatórios — 82% / 13m / 12 SLAs / "+4%" / "-2m" / "-5 leads" | Objeto `metrics` calcula `78.5 * (1 + multiplier*0.05)` etc. Não lê nada de `leads`. | `src/pages/Relatorios.tsx` 23-32 |
| Config — "conectado" se token > 8 chars | Simulação com `setTimeout` e regra fake. | `src/pages/Config.tsx` 32-33 |
| CRM Kanban — colunas vazias | `KanbanView` define stages `new / quote / negotiation / closed_won`, mas o DB tem default `lead_new` e o formulário cria com `'new'`. Mismatch → cards somem do funil de acordo com a unidade. | `src/components/Crm/KanbanView.tsx` 7-11, `LeadModalForm.tsx` 20 |
| Gerentes — score por unidade/gerente | Já é calculado dos `leads` (ok). Só falta empty state quando 0 leads auditados em vez de mostrar "0%" como se fosse performance ruim. | `src/pages/Gerentes.tsx` 64-67, 117-121 |

Resumo da causa raiz: a UI foi construída assumindo dados; quando faltam, em vez de mostrar "sem dados", várias telas usam números cosméticos. Precisamos **eliminar todos os fallbacks fixos**, padronizar os stages do funil e adicionar empty states reais.

---

## Plano

### 1. Padronizar `funnel_stage`
Definir um único conjunto canônico de stages e usar em todo lugar: `lead_new`, `quote`, `negotiation`, `closed_won`, `closed_lost`.
- Trocar `'new'` por `'lead_new'` em `KanbanView.COLUMNS`, `LeadModalForm` (state inicial + select), `Vault.tsx`, qualquer filtro restante.
- Migração leve no banco: `UPDATE leads SET funnel_stage = 'lead_new' WHERE funnel_stage = 'new'` (no-op se vazio, garante consistência futura). Alterar default da coluna para `'lead_new'` se ainda não estiver.
- Resultado: leads recém-criados aparecem na coluna "Novo Lead" e contam corretamente nos filtros por unidade.

### 2. Dashboard (`src/pages/Index.tsx`)
- Remover constante `globalScoreHistory`. Derivar série dos últimos 7 dias agrupando `leads` por `date(last_message_at)` e calculando média de `score`. Quando todos os dias forem nulos, esconder o card "Evolução do Score Global" e mostrar empty state com ícone + texto "Sem auditorias nos últimos 7 dias".
- Remover fallback `78.5`. `globalScore` = média real dos `leads` com `score != null`; se 0 leads pontuados → exibir traço `—` e legenda "Aguardando primeiras auditorias".
- Remover o badge fixo "+2.5% esta semana". Calcular variação real comparando média dos últimos 7 dias vs 7 dias anteriores; só renderizar quando ambos os períodos têm amostras.
- Cards de unidade: já vêm dos leads; quando `uLeads.length === 0` mostrar `—` em vez de `0%`.
- Auditorias pendentes / em alerta: já reais; só polir empty state ("Nenhum atendimento hoje") quando `todayLeads.length === 0`.
- Filtrar `todayLeads` por data real (`last_message_at` = hoje) em vez de assumir que tudo no contexto é "hoje".

### 3. TV Mode (`src/components/Dashboard/TvDashboard.tsx`)
- Apagar `getUnitScore` hardcoded. Substituir por cálculo idêntico ao do Dashboard, usando `leads` reais por `unit_id` + média de `score`.
- `diff` real: comparar com média da semana anterior; quando indisponível, esconder o trecho "vs ontem".
- TMR real: média de `wait_time_minutes` da unidade nos atendimentos do dia, em vez de "7m"/"22m" fixos.
- Empty state por coluna quando a unidade não tem nenhum lead.

### 4. Relatórios (`src/pages/Relatorios.tsx`)
- Substituir o objeto `metrics` por cálculos reais derivados de `leads` filtrados pelo período (`today`, `7days`, `month`):
  - `score` = média de `score` dos leads auditados no período.
  - `tmr` = média de `wait_time_minutes` no período.
  - `slasRisk` = `count(sla_status === 'danger' && !closed)` no período.
- Variações ("vs período anterior"): calcular comparando com a janela imediatamente anterior do mesmo tamanho. Esconder badge quando não houver dados suficientes.
- Quando o período não tiver leads, mostrar empty state grande no lugar dos 3 cards ("Nenhum dado para o período selecionado").
- O botão "Exportar XLS" — manter visual, sem regressão funcional (fora do escopo).

### 5. Config (`src/pages/Config.tsx`)
- Remover o `setTimeout` mock e a regra `apiToken.length > 8`. Verificação real de conexão será adicionada no momento da integração; por ora, exibir estado "Não testado" e desabilitar o badge "Conectado" até existir backend. Sem inventar status.

### 6. Gerentes (`src/pages/Gerentes.tsx`)
- Quando `unitLeads.length === 0` exibir `—` em vez de `0%`, e a barra fica vazia com legenda "Sem auditorias ainda". Mesmo tratamento para cada gerente sem leads pontuados. Sem mudar layout/visual.

### 7. Limpeza
- Apagar `src/lib/supabase.ts` (cliente duplicado) e migrar imports de `useAuth.tsx` e `Login.tsx` para `@/integrations/supabase/client` — isso encerra o problema "invalid API key" causado por instâncias divergentes do GoTrue (resolve também o login).
- Remover scripts soltos do repo que vazam `service_role_key`: `createUser.js`, `checkDb.js` (mantê-los compromete a segurança e nada no app os usa).

### 8. Validação
- Inserir 6–8 leads de seed via insert tool (distribuídos pelas 3 unidades, com `score`, `wait_time_minutes`, `sla_status` variados e `last_message_at` nos últimos 7 dias) só para confirmar que os números agora batem nas 3 telas. Os seeds ficam no banco como dados reais — nada vira mock no código.
- Checklist de aceitação:
  - Nenhum número fixo de score/tempo/SLA permanece em `Index.tsx`, `Relatorios.tsx`, `TvDashboard.tsx`.
  - Filtro por unidade no CRM muda corretamente os contadores de funil.
  - Login funciona com `mktfunil1@gmail.com` sem erro de API key.
  - Telas vazias mostram empty states em vez de "0%" ou números cosméticos.

### Escopo
- Sem mudanças de design — só conteúdo dos números e empty states.
- Sem nova feature; só corrige a fonte dos dados.