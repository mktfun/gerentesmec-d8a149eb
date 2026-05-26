# Tasks: Overhaul KPI Score Logic

This checklist outlines the sequential steps required to refactor the score average logic throughout the system.

## 1. React Frontend Code Corrections
- [ ] Refactor `src/components/Crm/UnitSwitcher.tsx`:
  - [ ] Import `avgScore` from `@/utils/scoreUtils`.
  - [ ] Replace the manual division by `unitLeads.length` with `avgScore(unitLeads)`.
- [ ] Refactor `src/pages/Gerentes.tsx`:
  - [ ] Import `avgScoreInt` from `@/utils/scoreUtils`.
  - [ ] Replace the unit score calculations with `avgScoreInt(unitLeadsTotal)`.
  - [ ] Replace the manager score calculations with `avgScoreInt(managerLeadsTotal)`.
- [ ] Refactor `src/pages/Config.tsx`:
  - [ ] Import `avgScoreInt` from `@/utils/scoreUtils`.
  - [ ] Replace manual unit score reduce logic with `avgScoreInt(unitLeadsTotal)`.

## 2. Supabase Backend Code Corrections (Edge Function)
- [ ] Refactor `supabase/functions/daily-score-snapshot/index.ts`:
  - [ ] Modify `globalScore` formula to divide by `scoredLeads.length` (ensuring division-by-zero protection).
  - [ ] Modify `uScore` breakdown formula to divide by `uScored.length` (ensuring division-by-zero protection).

## 3. Deployment & Execution
- [ ] Deploy the updated Edge Function:
  - [ ] Run `npx supabase functions deploy daily-score-snapshot` in the `gerentesmec` folder.

## 4. Verification & Validation
- [ ] Run a test build of the frontend:
  - [ ] Run `npm run build` to confirm zero TS or bundler warnings/errors.
- [ ] Review UI dashboard metrics:
  - [ ] Confirm averages reflect correct values (dividing strictly by leads with audit scores).
