# Proposal: Premium Aura Restoration (013)

## 1. Requisitos do Sistema

### 1.1 Dashboard "Score Global" Hero
- Remover os 4 cards quadrados superiores.
- Voltar com o card panorâmico massivo: "Score Global da Rede" (78.5%), com os mini-cards de cada unidade embutidos na direita.
- Uso extremo de Liquid Glass: fundo `bg-[#111118]/80`, backdrop blur, gradientes radiais iluminando o componente.

### 1.2 TV Mode Dedicado
- Criar um componente separado para o Modo TV (`TvDashboard.tsx`), renderizado condicionalmente pelo `Index.tsx`.
- Layout: 3 Cards Colossais (1 por Unidade).
- O que mostrar em cada card: Nome da Unidade, Foto/Avatar do Gerente, Score Gigante (ex: 91%), e os SLAs Pendentes em vermelho pulsante.

### 1.3 Edição Inline no AuditPanel
- O painel lateral (`AuditPanel.tsx`) ganhará um input estiloso para **"Orçamento Projetado"** logo abaixo do dossiê do cliente.
- Ao digitar e dar Enter/Blur, o valor já salva no context e atualiza o Kanban instantaneamente, evitando o uso de modais extras que quebram o fluxo de navegação.

### 1.4 Refatoração de `/relatorios` (Foco em Saúde)
- A tela de Analytics não pode parecer uma tela de contabilidade bancária. Ela deve ser focada em "Saúde do Atendimento".
- KPIs Principais: 
  1. Score de Qualidade (Média).
  2. SLAs Atrasados (Queda é bom).
  3. Taxa de Up-sell de Orçamentos.
- O tema da tela deve voltar a usar os tons escuros premium com detalhes de brilho, em vez de cinza chapado.

---

## 2. User Stories

1. **Como CEO**, ao abrir o Dashboard, quero ver imediatamente o "Score Global da Rede" em um painel majestoso no topo, para entender a qualidade média da minha mecânica numa pancada só.
2. **Como Auditor/CEO**, enquanto leio a conversa de um cliente no Painel de Auditoria, quero clicar no campo "Orçamento" ali mesmo e já preencher o valor de `R$ 1.500`, refletindo no Kanban sem abrir outras telas.
3. **Como Gerente**, ao olhar para a TV na parede da mecânica, preciso ver 3 grandes blocos (um para cada oficina) para saber quem está na frente no ranking de qualidade e onde a casa está caindo (SLA atrasado).
4. **Como CEO**, na tela de Relatórios, quero ver como anda a qualidade do atendimento da rede versus o mês passado, sabendo se o tempo de resposta melhorou, em vez de ver apenas faturamento frio.

---

## 3. BDD Scenarios

### Cenário: TV Mode de Alto Impacto
- **Given:** O usuário está no Dashboard.
- **When:** Ele clica no botão "TV Mode".
- **Then:** O layout padrão some. A tela renderiza três colunas gigantes, ocupando 100% do monitor, cada uma com o nome de uma unidade e seu Score de Qualidade em texto super dimensionado.

### Cenário: Edição Inline de Orçamento no AuditPanel
- **Given:** O usuário está com o Kanban aberto e clicou em um cliente, abrindo o AuditPanel lateral.
- **When:** Ele vê o campo "Orçamento", clica, digita "2500" e clica fora do campo.
- **Then:** O sistema salva no contexto sem recarregar a tela, e o card do cliente no Kanban no fundo já é atualizado instantaneamente para exibir "R$ 2.500,00".
