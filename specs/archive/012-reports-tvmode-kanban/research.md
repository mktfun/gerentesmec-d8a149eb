# Research: Kanban Fixes, TV Mode & Analytics (012)

## 1. Contexto do Pedido
O usuário (Daniel, CEO) solicitou um conjunto de melhorias profundas no sistema, divididas em 4 áreas principais:
1. **Gerenciamento de Equipe:** Modal para adicionar/editar funcionários (gerentes), vinculado aos atendimentos.
2. **CRM Kanban e Ticket Médio:**
   - Adição de valor monetário (Ticket Médio/Orçamento) visualizável nos cards do Kanban e associado aos leads.
   - Kanban atual está "quebrando a tela, confuso, sem divisões claras, sem drag-and-drop". Precisa ser totalmente reescrito para ser fluido e arrastável.
3. **Analytics e Filtros:**
   - Comparação automática com o período anterior.
   - Filtro de datas intuitivo ("coiso bem bonitinho") no Dashboard e demais telas.
   - Nova página dedicada a **Relatórios (`/relatorios`)** com mais dados e visualizações.
4. **TV Mode (Apresentação):**
   - Um modo "TV" no Dashboard que remove sidebar e topbar, expande os gráficos e atualiza em tempo real, ideal para colocar em uma TV na parede da mecânica.

## 2. Análise Técnica e Componentes Necessários

### 2.1 Kanban Fixes (Drag and Drop)
- O Kanban atual usa apenas CSS flexbox e botões estáticos. Não há biblioteca de Drag and Drop.
- **Solução:** Implementar `@hello-pangea/dnd` ou usar `framer-motion` (Reorder) para permitir arrastar os cards entre as colunas.
- O layout do Kanban deve ter colunas com altura 100% e `overflow-y-auto` interno, para não quebrar a tela inteira quando há muitos cards.
- Cores de fundo distintas por coluna para clareza visual.

### 2.2 Date Picker & Comparativo
- O sistema precisará de um `DateRangePicker`. A Shadcn UI possui um componente baseado em `react-day-picker` e `date-fns` que é muito elegante.
- Comparativos requerem dois conjuntos de dados: o período selecionado e o período anterior.

### 2.3 TV Mode
- Pode ser ativado por um botão "Modo Apresentação / TV Mode".
- Ao ser ativado, o estado do app (`isTvMode`) esconde o `DashboardLayout` (sidebar e header) e renderiza apenas o conteúdo do Dashboard em modo Fullscreen nativo da web (`element.requestFullscreen()`).

### 2.4 Modal de Gerentes e Ticket
- No arquivo `Gerentes.tsx` ou na aba de Config, é necessário ter um CRUD (Create, Read, Update, Delete) para os funcionários.
- O mock data de `Lead` precisa receber um novo campo: `ticket_value: number | null`.

## 3. Desafios e Restrições
- **Drag and Drop com React 18+:** Devemos garantir que não haverá conflitos no modo estrito se usarmos bibliotecas de DND antigas. `@hello-pangea/dnd` é o fork moderno do `react-beautiful-dnd` mais estável.
- **TV Mode Responsivo:** No TV Mode, a fonte e os gráficos precisam escalar (dar zoom). O grid deve adaptar a proporção para 16:9.
