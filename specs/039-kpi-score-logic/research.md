# Research: KPI Score Logic Overhaul

This document details the code investigation regarding the calculation of Lead score averages across both the frontend application and the backend Deno edge functions.

## Context
Currently, the system uses an AI Auditor that analyzes messages and scores leads (`l.score` from `0` to `100`). Unaudited leads have a `score` of `null` or `undefined`.
When calculating averages for units, managers, or global metrics, some locations incorrectly divide by the **total count of leads** (including those without scores), instead of dividing **exclusively by leads with a registered score**. This dilutes the metrics heavily and introduces misleading dashboard readings.

---

## 🔎 Code Diagnostics: Incorrect Implementations

Through codebase analysis, we have identified three critical manual aggregation bottlenecks:

### 1. Unit Switcher Component
- **File**: [UnitSwitcher.tsx](file:///c:/Users/User/Desktop/vscode/projetos%20antigravity/gerentesmec/src/components/Crm/UnitSwitcher.tsx#L38-L41)
- **Problematic Code**:
  ```typescript
  const scored = unitLeads.filter(l => l.score !== null);
  const score = (unitLeads.length > 0 && scored.length > 0)
    ? Math.round((scored.reduce((a, l) => a + Number(l.score), 0) / unitLeads.length) * 10) / 10
  ```
- **Error**: It reduces the sum of `scored` leads, but incorrectly divides by `unitLeads.length` (the total number of leads in the unit). It should divide by `scored.length`.

---

### 2. Gerentes Management Page
- **File**: [Gerentes.tsx](file:///c:/Users/User/Desktop/vscode/projetos%20antigravity/gerentesmec/src/pages/Gerentes.tsx#L60-L65)
- **Problematic Code (Unit Average Score)**:
  ```typescript
  const unitLeadsTotal = leads.filter(l => l.unit_id === unit.id);
  const unitLeadsScored = unitLeadsTotal.filter(l => l.score !== null);
  const unitScore = (unitLeadsTotal.length > 0 && unitLeadsScored.length > 0)
    ? Math.round(unitLeadsScored.reduce((acc, l) => acc + (l.score || 0), 0) / unitLeadsTotal.length)
    : null;
  ```
- **Error**: Divides the sum by `unitLeadsTotal.length` instead of `unitLeadsScored.length`.

- **Problematic Code (Manager Average Score)**:
  ```typescript
  const managerLeadsTotal = leads.filter(l => l.manager_id === manager.id);
  const managerLeadsScored = managerLeadsTotal.filter(l => l.score !== null);
  const mScore = (managerLeadsTotal.length > 0 && managerLeadsScored.length > 0)
    ? Math.round(managerLeadsScored.reduce((acc, l) => acc + (l.score || 0), 0) / managerLeadsTotal.length)
    : null;
  ```
- **Error**: Divides by `managerLeadsTotal.length` instead of `managerLeadsScored.length`.

---

### 3. Daily Score Snapshot Edge Function
- **File**: [index.ts (daily-score-snapshot)](file:///c:/Users/User/Desktop/vscode/projetos%20antigravity/gerentesmec/supabase/functions/daily-score-snapshot/index.ts#L42-L54)
- **Problematic Code (Global Score)**:
  ```typescript
  const totalLeads = todayLeads?.length ?? 0;
  const scoredLeads = todayLeads?.filter(l => l.score !== null) ?? [];
  const globalScore = totalLeads > 0 && scoredLeads.length > 0
    ? Math.round(scoredLeads.reduce((sum, l) => sum + Number(l.score), 0) / totalLeads * 10) / 10
    : null;
  ```
- **Error**: Divides the sum of today's scored leads by `totalLeads` (all leads including unscored). It should divide by `scoredLeads.length`.

- **Problematic Code (Unit Score Breakdown)**:
  ```typescript
  const uScore = uLeads.length > 0 && uScored.length > 0
    ? Math.round(uScored.reduce((sum, l) => sum + Number(l.score), 0) / uLeads.length * 10) / 10
    : null;
  ```
- **Error**: Divides by `uLeads.length` instead of `uScored.length`.

---

## 🛡️ Correct Implementations (Shared Utilities)

The system already possesses a shared mathematical average engine inside `src/utils/scoreUtils.ts` that calculates the correct average:
- **File**: [scoreUtils.ts](file:///c:/Users/User/Desktop/vscode/projetos%20antigravity/gerentesmec/src/utils/scoreUtils.ts#L14-L19)
- **Standard Formula**:
  ```typescript
  export const avgScore = (leads: Lead[]): number | null => {
    const scored = leads.filter(l => l.score !== null && l.score !== undefined);
    if (scored.length === 0) return null;
    const sum = scored.reduce((acc, l) => acc + Number(l.score), 0);
    return Math.round((sum / scored.length) * 10) / 10;
  };
  ```

This function:
1. Filters out unscored leads (`l.score !== null`).
2. Calculates the sum only of scored ones.
3. Divides directly by `scored.length` (the denominator matches the numerator).
4. Handles `0` safely.

---

## 🎯 Resolution Plan
To solve the bug completely, we must:
1. Replace manual, bug-prone division blocks in the React frontend with the standardized `avgScore` and `avgScoreInt` helper functions.
2. Refactor the backend Edge Function `daily-score-snapshot` to calculate averages by dividing exclusively by the size of the filtered scored array (`scoredLeads.length` and `uScored.length`).
3. Deploy the Edge Function.
