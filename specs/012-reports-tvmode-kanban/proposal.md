# Proposal: Reports, TV Mode, Kanban Fixes & CRUDs (012)

## 1. Escopo das Funcionalidades

### 1.1 Kanban Reconstruído
- Refatoração do `KanbanView.tsx` para garantir colunas com bordas delimitadas, fundo translúcido e scroll independente.
- **Integração de Drag and Drop:** Uso de `@hello-pangea/dnd` para arrastar e soltar leads entre os funis.
- Adição do campo de "Valor do Orçamento" (Ticket) visível no card do lead.

### 1.2 Gestão de Funcionários (CRUD de Gerentes)
- Nova funcionalidade em `Gerentes.tsx`: Botão "Novo Funcionário".
- Modal para Adicionar, Editar e Excluir gerentes (Nome, Unidade vinculada, Telefone).

### 1.3 Gestão de Leads (CRUD de Atendimentos)
- O sistema já integra conversas na "surdina", mas o usuário precisa ter poder total de **Adicionar, Editar e Excluir leads manualmente**.
- Modal no CRM para "Novo Atendimento" ou editar um existente (Nome, Veículo, Valor do Orçamento, Unidade, etc).

### 1.4 Filtro de Datas e Relatórios (`/relatorios`)
- Implementar um Date Picker global ou por tela (Hoje, Últimos 7 dias, Este Mês).
- Criação da página `/relatorios` que trará tabela de dados e comparativos (ex: `▲ +15% vs período anterior`).

### 1.5 Modo TV (Dashboard Fullscreen)
- Botão "TV Mode" no topo do Dashboard. Remove sidebar/header e expande o grid 16:9.
- O modo TV terá ciclos ou simulações estáticas "piscando" novos dados para engajar a equipe na oficina.

---

## 2. BDD Scenarios

### Cenário: CRUD de Leads na Surdina
- **Given:** O usuário está na tela de CRM.
- **When:** Ele clica em "Adicionar Atendimento", preenche "João (Fiesta)" e coloca o ticket como "R$ 800".
- **Then:** O lead entra imediatamente na coluna "Novo Lead" sem menção alguma à automação externa. O usuário também pode clicar em "Editar" no card e deletar a conversa caso seja spam.
