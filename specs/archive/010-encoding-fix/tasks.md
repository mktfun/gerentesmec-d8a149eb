# Tasks: Encoding & Mojibake Fix (010)

- [x] 1. Corrigir ocorrências nos arquivos identificados.
  - [x] Substituir padrões em `src/pages/Index.tsx` (ex: `â€”` -> `—`, `â–²` -> `▲`).
  - [x] Substituir padrões em `src/components/Dashboard/TvDashboard.tsx` (ex: `GrÃ¡fico`).
  - [x] Substituir padrões em `src/components/Crm/AuditPanel.tsx`.
  - [x] Substituir padrões em `src/utils/scoreUtils.ts`.
  - [x] Substituir padrões em `supabase/functions/ai-autonomous-evaluator/index.ts`.
- [x] 2. Desenvolver o script de travamento.
  - [x] Escrever `scripts/check-encoding.mjs` de forma que aponte precisamente erros.
  - [x] Modificar `package.json` para adicionar o hook `"prebuild": "node scripts/check-encoding.mjs"`.
- [x] 3. Utilitário de Runtime (Opcional, mas recomendado).
  - [x] Criar `src/utils/encodingFixer.ts` com um método `.replace` em cadeia para sanitizar textos problemáticos caso venham do banco.
- [x] 4. Testes.
  - [x] Rodar o build de testes para validar se a compilação agora passa limpa.
  - [x] Certificar que o `check-encoding` não dá falso positivo para arquivos normais.
