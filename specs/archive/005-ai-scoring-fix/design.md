# Design: Scoring System & Checklist Fixes

## Interface de Usuário (Stitch)
O `AuditPanel.tsx` atualmente carrega as propriedades css `opacity-40 pointer-events-none` se a flag de AI auto_scoring estiver ligada, juntamente de um selo overlay "Avaliação Fechada".

Vamos simplificar:
- Remover a prop classname dinâmica condicional (`opacity-40...`) da div wrapper do Checklist.
- Apagar completamente o selo "🔒 Avaliação Fechada".
- A interface passa a ser livre e independente da IA. O usuário vê a IA alterando as notas em tempo real e pode sobreescrever se discordar.

## Arquitetura de Banco / API (Supabase)
Na Edge Function `ai-autonomous-evaluator`:

**Extração de Configuração de Pesos:**
O `aiSettings` contém a configuração dos pesos. Vamos parsear e usar ele para a conta:
- 1a e 1b dividem `peso_cordialidade`.
- 2a, 2b e 2c dividem `peso_orcamento`.
- etc.

**Merging Logic:**
Ao receber o output do LLM `mockOutput`:
```typescript
const mergedChecklist = { ...currentChecklist };
// A IA só tem permissão de adicionar TRUE. O que é false da IA não apaga o true do Banco.
if (mockOutput.audit_checklist) {
  for (const key of Object.keys(mockOutput.audit_checklist)) {
    if (mockOutput.audit_checklist[key] === true) {
      mergedChecklist[key] = true;
    }
  }
}
```

**Score Calculation:**
Após mesclar, varremos as chaves `mergedChecklist` e calculamos o `score`. O score do LLM é completamente ignorado no banco, mas pode continuar no output apenas para debug.

**Valuation Logic:**
Se o LLM não achou o veículo:
```typescript
const finalTicket = mockOutput.ticket_value || leadData.ticket_value;
const finalVehicle = mockOutput.customer_vehicle || leadData.customer_vehicle;
```
Salvamos `finalTicket` e `finalVehicle`.
