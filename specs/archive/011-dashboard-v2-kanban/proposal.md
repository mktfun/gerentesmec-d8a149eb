# Proposal: Dashboard CEO v2 + Kanban CRM + Bug Fixes (011)

## 1. Visão Geral
Esta spec cobre:
1. **Bug Fixes críticos** (light mode quebrado, fundo estranho, recarregamento de página)
2. **Dashboard CEO v2** — Analytics profundas para o Daniel entender impacto de negócio em segundos
3. **Kanban CRM** — Toggle entre vista Lista e Kanban por funil de atendimento, por unidade

---

## 2. Bugs a Corrigir

### 2.1 Light Mode Amarelo/Quebrado
- **Causa:** Cores hardcoded dark (`#111118`, `#0d0d14`) não mudam com o toggle de tema
- **Solução:** Substituir todas as cores hardcoded por variáveis CSS semânticas (`bg-card`, `bg-sidebar`) que respondem ao `:root` e `.dark`. Criar Context global de tema.

### 2.2 Fundo Estranho (Marrom)  
- **Causa:** Fundo `bg-[#0d0d14]` no empty state do CRM cria contraste errado com o background
- **Solução:** Usar `bg-background` e `bg-card` de forma consistente

### 2.3 Re-renderização ao Navegar
- **Causa:** `useDarkMode` tem estado local — ao navegar o layout re-monta e o estado é recriado, causando flash
- **Solução:** `ThemeProvider` via React Context em `App.tsx`, para que o estado de tema seja global e persistente entre navegações

---

## 3. Dashboard CEO v2

### 3.1 Requisitos
- **Visão de Impacto Financeiro:** Card "Leads em Risco" mostrando não só a quantidade, mas a estimativa de faturamento em jogo (ex: "3 leads sem resposta = ~R$900 em risco")
- **Comparativo de Unidades (Bar Chart):** Gráfico de barras horizontal com cada unidade rankeada por score, com cor vermelha/verde
- **Radar de Etapas por Unidade:** Spider/Radar chart mostrando qual das 4 etapas está mais fraca em cada unidade (Daniel vê de relance: "Dom Pedro falha na Etapa 3 — up-sell")
- **Score por Etapa (Donut Charts):** 4 mini-donuts mostrando a taxa de cumprimento global de cada etapa obrigatória
- **Tendência Histórica por Unidade** (já existe, mas melhorar): Multiline chart com uma linha por unidade

### 3.2 Narrativa Visual (CEO Story)
A leitura do Dashboard de cima para baixo conta a história:
1. **"Como estou hoje?"** → Score global 78.5% hero
2. **"Qual unidade está arrastando minha nota?"** → Comparativo de barras horizontais por unidade
3. **"O que especificamente está errado?"** → Radar de cumprimento por etapa por unidade
4. **"Quanto isso está me custando?"** → Card de impacto de SLA com valor monetário estimado
5. **"Está melhorando ou piorando?"** → Multiline histórico por unidade (7 dias)

---

## 4. Kanban CRM

### 4.1 Colunas (Funil de Atendimento)
| Coluna | Descrição | Cor |
|--------|-----------|-----|
| **Novo Lead** | Mensagem recebida, aguardando resposta inicial | Cinza/Azul |
| **Em Orçamento** | Gerente respondeu, proposta enviada | Amarelo |
| **Em Negociação** | Cliente respondeu, fase de follow-up | Laranja |
| **Encerrado** | Atendimento finalizado (ganho ou perdido) | Verde/Vermelho |

### 4.2 Cards
Cada card mostra:
- Nome do cliente + veículo
- Avatar do gerente responsável
- Tempo no funil / SLA
- Indicador de score (se já auditado)
- Badge de SLA Estourado (se aplicável)

### 4.3 Filtro por Unidade
Tabs horizontais no topo do Kanban: **Todos · Dom Pedro · Jabaquara · Kennedy**. Filtra os cards sem recarregar a página.

### 4.4 Toggle Lista / Kanban
Botão toggle no canto superior direito do CRM (ícone de lista | ícone de kanban). Transição suave entre as duas views.

---

## 5. User Stories

1. **Como Daniel (CEO)**, ao abrir o dashboard quero ver em 5 segundos qual unidade está puxando a nota para baixo e o que especificamente está errado nela.
2. **Como Daniel**, quero ver um número claro de quanto estou arriscando em receita por causa de leads sem resposta (>20 min).
3. **Como João (Auditor)**, quero poder ver o CRM em formato Kanban agrupado por etapa de atendimento, filtrando por unidade com um clique.
4. **Como qualquer usuário**, ao mudar para o modo claro, tudo fica elegante e limpo (não amarelo), sem nenhum piscar de tela ou reload.

---

## 6. BDD Scenarios

### Cenário: CEO entende o problema em 5 segundos
- **Given:** A unidade Dom Pedro tem score 62.5% e falha mais na Etapa 3 (apenas 28% de cumprimento)
- **When:** Daniel abre o dashboard
- **Then:** O gráfico radar mostra visivelmente que Dom Pedro tem o ponto mais baixo no eixo "Up-sell" e o comparativo de barras mostra Dom Pedro em vermelho na última posição

### Cenário: Kanban por unidade sem recarregar
- **Given:** Estão abertas 4 conversas (2 em Dom Pedro, 1 Jabaquara, 1 Kennedy)
- **When:** O auditor João clica na tab "Dom Pedro" no Kanban
- **Then:** Apenas os 2 cards de Dom Pedro aparecem nas colunas, sem reload, com animação de fade

### Cenário: Toggle Lista / Kanban com persistência
- **Given:** O auditor está no Kanban
- **When:** Ele clica no ícone de lista
- **Then:** A visualização muda para a lista agrupada por urgência em <200ms com animação suave e a preferência é mantida ao voltar para a tela

### Cenário: Light Mode sem quebrar layout
- **Given:** O sistema está em Dark Mode
- **When:** O usuário clica em "Modo Claro" na sidebar
- **Then:** Toda a interface transiciona para fundo branco/slate suave em 300ms SEM flash de cor amarela, com textos legíveis e cards com sombras claras
