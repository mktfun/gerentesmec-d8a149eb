# Research: Encoding & Mojibake Fix (010)

## Context
The user reported that several files contain "mojibake" (corrupted characters) due to bad UTF-8 encoding during file transfers or previous tool modifications. These characters appear on the frontend (e.g., `Index.tsx`, `TvDashboard.tsx`), degrading the user experience.

## Findings

We ran a sweep across `src`, `supabase/functions`, and `scripts` using a script searching for common corrupted byte sequences (`Ã`, `Â`, `â€`, `â€”`, `â€“`, `â”`, `â–`).

Files identified with corruption:
1. `src/pages/Index.tsx`: Contains `Â·`, `â€”`, `â–²`, `â–¼`, `â”€`.
2. `src/components/Dashboard/TvDashboard.tsx`: Contains `Ã` (e.g. `SaÃºde`, `GrÃ¡fico`).
3. `src/components/Crm/AuditPanel.tsx`: Contains `Ã`.
4. `src/utils/scoreUtils.ts`: Contains `Ã`.
5. `supabase/functions/ai-autonomous-evaluator/index.ts`: Contains `Ã`.

## Prevention
To prevent this regression:
1. A verification script `scripts/check-encoding.mjs` must be created.
2. The script will scan `src` and `supabase/functions` for invalid sequences.
3. The script should be hooked into the `prebuild` step in `package.json`.

## Data Protection
If broken text might come from Chatwoot or AI, a utility `src/utils/encodingFixer.ts` could be introduced to sanitize strings before they reach the UI, though the primary focus right now is codebase literals.
