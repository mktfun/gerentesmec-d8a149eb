# Design: Correção de Exibição do Histórico de Vistorias (bugfix-audits-display)

## Arquitetura Técnica
A correção é focada apenas na camada de interface e fetching (React + Supabase Client).
Componente (`Auditoria/index.tsx` e `AuditHistory.tsx`) → Busca dados na tabela `store_inspections` → Resolve Score Híbrido → Renderiza UI.

## Componentes / Lógica Core

1. **`src/pages/Auditoria/index.tsx`**:
   - Ajustar query para: `.select('id, store_id, completed_at, raw_payload, score')`
   - Ajustar query para: `.in('status', ['synced', 'completed'])`
   - Cálculo de score: `const finalScore = audit.score !== null ? audit.score : fallbackCalculate(audit.raw_payload)`

2. **`src/pages/AuditHistory.tsx`**:
   - Ajustar query para: `.in('status', ['synced', 'completed'])`
   - Adicionar propriedade `score` na tipagem local `StoreInspection`
   - Cálculo de score (igual acima)
   - Na renderização do Drawer:
     - Adicionar verificação: `if (!selectedAudit?.raw_payload?.categories)`
     - Se `categories` não existir, renderizar um bloco JSON formatado (`JSON.stringify(selectedAudit?.raw_payload, null, 2)`) como modo fallback de debug, para que vistorias baseadas em IA (que possuem checklists diferentes) possam ser visualizadas ao invés de tela em branco.

## Cenários de Verificação (SCAN → INFER → VERIFY → FIX)
- **Cenário 1:** Histórico de auditoria manual (com fotos e categorias).
  - Ação: Clicar no histórico.
  - Resultado: Exibe drawer normalmente, nota é calculada via `categories` ou coluna native.
- **Cenário 2:** Histórico de auditoria de IA (status `completed`, sem `categories`).
  - Ação: Clicar no histórico.
  - Resultado: Nota vinda diretamente da coluna `score` é exibida. Drawer abre mostrando o Payload Cru, não quebrando a tela.
