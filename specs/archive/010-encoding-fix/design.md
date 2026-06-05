# Design: Encoding & Mojibake Fix (010)

## 1. UI & Visuals
As this is a structural fix for texts and build processes, there are no structural UI modifications. The visual impact is simply restoring the correct Portuguese orthography on text components (e.g., titles, descriptions, tooltips).

## 2. Architecture & Data Flow

### 2.1 The `check-encoding.mjs` Script
- A lightweight Node.js script located at `scripts/check-encoding.mjs`.
- It recursively iterates through `src/` and `supabase/functions/`.
- It filters by valid extensions (`.ts`, `.tsx`, `.md`).
- It tests file contents against an array of bad UTF-8 signatures:
  `['Ã', 'Â', 'â€', 'â€”', 'â€“', 'â”', 'â–']`.
- If any match is found, it prints the specific file and character, and exits with `process.exit(1)`.

### 2.2 Build Integration
- `package.json` scripts will be updated:
  `"prebuild": "node scripts/check-encoding.mjs"`
- Vite build will automatically trigger this step before generating the static chunk, providing a fast feedback loop.

### 2.3 Runtime Sanitization (Optional Defense)
- Create `src/utils/encodingFixer.ts`.
- Exposes `sanitizeMojibake(text: string): string` using chained `.replace()` regexes covering the most common double-encoded UTF-8 characters that resolve to Portuguese acentos.
- Can be used in components if data retrieved from third-parties (like Chatwoot) contains broken texts.

## 3. Scope of Modifications
- `src/pages/Index.tsx`: Manual targeted replacement of remaining bad chars.
- `src/components/Dashboard/TvDashboard.tsx`: Manual targeted replacement.
- `src/components/Crm/AuditPanel.tsx`: Manual targeted replacement.
- `src/utils/scoreUtils.ts`: Manual targeted replacement.
- `supabase/functions/ai-autonomous-evaluator/index.ts`: Manual targeted replacement.
- `package.json`: Add script hook.
