# Tasks: Depreciação do Checklist Legado (Spec 054)

- [ ] Apagar arquivos obsoletos do código legado:
  - `src/pages/Checklist.tsx`
  - `src/data/checklist_template.ts`
  - `src/components/Checklist/` (pasta)
- [ ] Atualizar `src/App.tsx`:
  - Remover import do antigo `Checklist`.
  - Remover rota `/checklist`.
- [ ] Encontrar e substituir referências de rota no Front-end:
  - Substituir botões e links que apontavam para `/checklist` para apontarem para `/auditoria`.
