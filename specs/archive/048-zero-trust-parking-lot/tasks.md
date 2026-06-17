# Tasks: Auditoria Zero Trust & Parking Lot (Spec 048)

- [x] Criar estrutura.
- [ ] Atualizar `scripts/ai-cli-runner.md` e `scripts/autonomous_auditor_v2.mjs`:
  - Ensinar a IA a identificar conversas com pouca substância (ex: apenas follow-up).
  - Configurar a regra: se não houver contexto, definir o `funnel_stage` como `parking_lot`.
  - Configurar a regra: ao usar `parking_lot`, preencher um array de insights ou o texto `reasoning`/`closing_summary` (no caso do JS atualizar a coluna correta) com perguntas para o mecânico.
- [ ] Atualizar o script de Node `autonomous_auditor_v2.mjs` para salvar o "conselho da IA" na coluna `closing_summary` da tabela `leads`.
- [ ] Atualizar `src/components/Crm/AuditPanel.tsx` para renderizar o bloco do `closing_summary` dentro da view `parking_lot`.
- [ ] Build e validação.
