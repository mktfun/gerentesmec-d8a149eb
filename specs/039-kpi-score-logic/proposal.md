# Proposal: KPI Score Logic Overhaul

This document describes the functional goals, user requirements, and BDD validation scenarios for the score calculations overhaul.

## 🎯 Goal
Standardize and correct the score average calculation across all dashboard areas. The new logic guarantees that only leads with audited scores (`score !== null`) are accounted for in the calculations (both inside the sum numerator and the count denominator). Unaudited or ignored leads must not affect the score average.

---

## 👥 User Stories

### Story 1: Accurate Managers Page Scores
**As a** Regional Operations Manager  
**I want** to see correct average scores for each repair unit and each manager on the Gerentes page  
**So that** I don't see artificially depressed scores caused by unscored leads.

### Story 2: Reliable TV Command Center Screen
**As a** Shop Owner  
**I want** the TV Dashboard (Comando Central) and unit dropdown switchers to display average scores based strictly on active audits  
**So that** our shop performance reflects real quality metrics.

### Story 3: Clean Daily Analytics Reports
**As an** Admin Analyst  
**I want** the background cron job snapshots (`daily_score_snapshots`) to record accurate daily mathematical averages  
**So that** our month-to-month analytics and historical reports are correct.

---

## ## BDD Scenarios

### Cenário: Cálculo de score médio em Unidades com leads mistos
- **Given (Dado):** Uma loja "Caricós" com 10 leads totais, dos quais 4 estão auditados pela IA com scores `[80, 70, 90, 60]` e 6 estão não-auditados (com score `null`).
- **When (Quando):** O Regional Manager abre a página de "Gerentes" ou o painel de "Comando Central".
- **Then (Então):** O sistema deve calcular a média somando `80 + 70 + 90 + 60 = 300` e dividindo pelo total de leads auditados (`4`), resultando em uma pontuação média exibida de `75%` (e não `30%`, que seria o cálculo antigo dividindo por 10).

### Cenário: Cálculo de score de Gerente sem leads auditados
- **Given (Dado):** Um gerente recém-cadastrado "Roberto" que possui 5 leads sob sua custódia, todos com score `null` (sem auditoria concluída).
- **When (Quando):** A página de "Gerentes" renderiza os detalhes de Roberto.
- **Then (Então):** O score médio deve ser exibido como um traço (`—`) indicando ausência de dados, ao invés de acusar `0%` ou crashar a interface.

### Cenário: Cronjob Daily Snapshot com dados diários
- **Given (Dado):** O cronjob `daily-score-snapshot` roda no final do dia. No dia de hoje, a oficina processou 5 leads totais, dos quais 2 possuem scores `[100, 80]` e 3 possuem `null`.
- **When (Quando):** A Edge Function é executada.
- **Then (Então):** O snapshot inserido na tabela `daily_score_snapshots` deve registrar `global_score` igual a `90` (soma `180` dividida por `2` leads auditados), com `total_leads = 5` e `scored_leads = 2`.
