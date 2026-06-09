# UI Design (Stitch / Frontend)

- **AuditPanel.tsx**:
  - Transformar o ícone estático \`<Circle /> / <CheckCircle2 />\` no \`AccordionItem\` em componentes clicáveis.
  - Ao clicar, inverter o valor do item no estado local \`checked\`.
  - Re-calcular e animar o "Score Ring" em tempo real usando a função \`calcLeadScore\` ao interagir com os checkboxes.
  - O botão "Aprovar Avaliação" chamará \`saveLeadAudit\` salvando o checklist modificado e o score manualmente atualizado no Supabase.

# Backend Design (Supabase MCP / Edge Functions)

- **ai-autonomous-evaluator/index.ts**:
  - **Otimização de Prompt (Cost Efficiency):** Adicionar instrução dinâmica no prompt:
    > "SE a etapa de funil ATUAL não for closed_lost nem closed_won, NÃO processe a chave audit_checklist e devolva um JSON com ela vazia. Foque apenas em atualizar a etapa do funil (funnel_stage) baseada nas interações, e ler mídias."
  - **Funnel Stage Regression Lock (Código Type-Safe):**
    Criaremos um mapa numérico de ranking das etapas:
    \`\`\`ts
    const stageRank = {
      lead_new: 1,
      quote: 2,
      negotiation: 3,
      closed_lost: 4,
      closed_won: 4
    };
    \`\`\`
    Se \`stageRank[novaEtapaSugerida] < stageRank[etapaAtual]\`, o sistema **ignora** a regressão e devolve a \`etapaAtual\`.
  - Essa modificação fará a IA ser usada apenas como um "Funnel Manager" inteligente durante o fluxo de atendimento, e se transformar em um "Auditor Severo" no segundo final.
