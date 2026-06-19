# Proposal: 062 - Audit Layout Restructure

## 1. Visão Geral
A página `/auditoria` atual é uma tela preta em ecrã inteiro (fullscreen) que oculta o menu lateral e o cabeçalho. O objetivo desta Spec é reestruturar a tela de Início da Auditoria para utilizar o mesmo Layout (Sidebar/Header) do resto do sistema. Além disso, adicionaremos um painel de "Vistorias Recentes" usando grid de 2 colunas e separaremos a tela de "Execução da Auditoria" para uma rota limpa (`/auditoria/execucao`) a fim de garantir a imersão total (fullscreen) apenas durante a vistoria.

## 2. Mudanças de Roteamento (`App.tsx`)
1. **Auditor Layout**: Para usuários com cargo `auditor`, atualmente eles caem direto na raiz. Vamos criar um `<AuditorLayout />` simples (ou reutilizar o `<ManagerLayout />` / `<DashboardLayout />` com permissões cortadas) para que eles também tenham Sidebar e Header. Mas como o foco é "o mesmo layout do CRM", vamos usar o `ManagerLayout` ou um layout customizado com a Sidebar.
2. **Nova Rota**: Adicionar a rota `/auditoria/execucao` em todos os blocos de autenticação (Admin, Unit Manager e Auditor) que renderiza o steper (a interface atual de quando `draft` é true). Esta rota **NÃO** terá Layout (sem header, sem sidebar).

## 3. Mudanças na Interface (`src/pages/Auditoria/index.tsx`)
1. **Painel Base**: O componente atual `AuditoriaApp` será dividido em dois. O `index.tsx` passará a ser a "Dashboard da Auditoria".
2. **Componente de Execução**: Criaremos um componente separado `AuditoriaExecution.tsx` para a tela de imersão.
3. **Layout em Grid**: Na tela de Início (nova `AuditoriaApp`), usaremos `<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">`.
4. **Painel Esquerdo**: Card de "Nova Auditoria" existente.
5. **Painel Direito**: Card "Últimas Vistorias". Buscará da tabela `store_inspections` as 3 últimas auditorias concluídas, mostrando o Score (com as cores corretas), Data/Hora e Unidade. E um botão "Ver Histórico Completo" que envia para `/historico-auditorias`.

## 4. Otimização (LocalForage vs Supabase)
Embora o usuário tenha sugerido LocalForage para as concluídas, auditorias finalizadas são apagadas do LocalForage atual assim que sincronizadas. O cache local só guarda o `draft` em andamento. Como o histórico é crítico, faremos uma query otimizada (limit 3) via Supabase que será cacheada em memória pelo React (useEffect) para evitar chamadas múltiplas.

## 5. Análise de Impacto (Zero Trust & Bugs)
- Redirecionamentos: O estado de `draft` precisará ser verificado. Se a pessoa abrir `/auditoria` e já tiver um rascunho em andamento, o card inicial mostrará "Continuar Inspeção" e mandará para `/auditoria/execucao`.
- Sem Egress Bloat: A query de histórico puxará apenas colunas rasas (id, store_id, completed_at, final_score), evitando o payload gigante.
