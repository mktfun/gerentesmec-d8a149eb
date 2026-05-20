# Design Document: Reports, TV Mode, Kanban Fixes & Employee CRUD (012)

## 1. UI / UX Updates (2026 Guidelines)

### 1.1 Kanban Redesign
- Remover o overflow confuso. Cada coluna terá `bg-card/50`, border leve, e `overflow-y-auto` restrito.
- A tela de CRM ocupará o 100% da altura (`h-[calc(100vh-4rem)]`), e as colunas ocuparão esse espaço restante perfeitamente.
- Drag and Drop visual: durante o drag, o card flutua levemente (shadow-2xl, rodízio de 3 graus).
- A cor da coluna muda sutilmente (highlight) ao arrastar um card por cima dela.
- Valor monetário no card do Lead aparecerá com destaque: fonte mono, cor emerald (ex: `R$ 1.500,00`).

### 1.2 TV Mode Experience
- Ação acionada via ícone de "Monitor/TV" no Header.
- Usa a Fullscreen API nativa (`document.documentElement.requestFullscreen()`).
- Oculta a `<aside>` (Sidebar) e o `<header>` (Topbar) injetando uma classe `tv-mode` ou usando estado do React.
- Efeitos no TV Mode:
  - Fontes aumentam proporcionalmente.
  - "Ao vivo" pulse-dot fica gigante no canto superior.
  - Cards recebem um glow-up dark 2026.

### 1.3 Tela de Relatórios (`/relatorios`)
- Hero banner menor, focado em Controle de Datas.
- Tabela de Leads ("Extrato") com paginação (Mock).
- Comparativos de conversão em Cards com setas `▲ / ▼` e cores dopamínicas (Emerald para up, Rose para down).

### 1.4 Gestão de Funcionários Modal
- Botão "Novo Gerente" na página `/gerentes`.
- Modal "Liquid Glass" no centro da tela (diferente da Sheet lateral de visualização) para CRUD.
- Input fields estilizados usando os tokens do Tailwind (`bg-muted`, borda de foco primária).

---

## 2. Estrutura de Dados Modificada

### Atualizações no `mockData.ts`
```typescript
export type Lead = {
  id: string;
  // ... campos existentes
  ticket_value: number | null; // NOVO: Valor orçado/vendido
}

// Novos Leads
{
    id: 'l10', customer_name: 'Marcos', customer_vehicle: 'Compass',
    funnel_stage: 'quote', ticket_value: 3500, // etc...
}
```

### Drag and Drop State
Para o DnD funcionar sem backend complexo agora, o estado mockado precisa ser guardado localmente via `useState` no componente KanbanView. O estado inicial vem de `mockLeads`, mas as reordenações atualizam o array no client-side.

---

## 3. Integração das Bibliotecas

- **DND:** Instalaremos `@hello-pangea/dnd` via npm para garantir drag and drop compatível com React 18+ sem os bugs conhecidos do antigo react-beautiful-dnd.
- **Date Picker:** Adicionaremos a dependência de `date-fns` e `react-day-picker` se quisermos usar um calendário bonito, ou implementaremos seletores de string hardcoded (ex: "Hoje", "Últimos 7 dias", "Este Mês") que simulam o comportamento, para simplificar.
