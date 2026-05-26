# Proposal: Redesign Visual Revolut-Inspired — GerentesMec CRM

## 1. Visão Geral
Redesign visual completo da aplicação, elevando cada tela ao nível de polish do Revolut. O objetivo não é copiar o Revolut, mas absorver a sua linguagem de design (dark, glass, tipografia heroica, microinterações de spring, agrupamento visual inteligente) e traduzi-la para o contexto de um CRM de auditoria de gerentes de mecânicas.

As mudanças cobrirão:
- **Sistema de Design Global** (CSS, paleta, tipografia, dark/light mode toggle)
- **Dashboard** (herói com score gigante, gráfico elegante, ranking premium)
- **CRM / Auditoria** (agrupamento por status visual, sem filtros confusos)
- **Página de Gerentes & Unidades** (criada do zero — hoje é 404)
- **Sidebar** (identidade visual forte, compacta, elegante)

## 2. Requisitos Funcionais

### 2.1 Sistema de Design
- Implementar **Dark Mode como padrão** com toggle para Light Mode
- Design Token System via CSS variables (cores, raios, sombras)
- Fonte premium: `Plus Jakarta Sans` ou `Inter` via Google Fonts
- Glassmorphism em todos os cards: `backdrop-blur-xl bg-white/5 border-white/10`

### 2.2 Dashboard Executivo (Daniel)
- **Herói Central**: Score global da rede em número GIGANTE (text-7xl/8xl, animação count-up)
- **Cards de KPI**: Redesenhados como "capsulas" de vidro escuro com gradiente de acento na borda
- **Gráfico Revolut-style**: Linha fina branca sobre fundo dark (sem área preenchida exagerada), com ponto interativo que segue o cursor
- **Ranking Premium**: Cards individuais por gerente com avatar colorido, barra animada, e indicador ▲▼ de tendência semanal
- **Chip de status de unidade**: Cada unidade mostrada como uma tag/chip animado com seu score

### 2.3 CRM / Auditoria (João)
- **Agrupamento por Status Visual** (sem filtro dropdown confuso):
  - Seção "🔴 Ação Imediata (SLA Estourado)" — listagem topo
  - Seção "🟡 Em Andamento" — abaixo
  - Seção "✅ Concluídos Hoje" — ao final (colapsável)
- **Cada item** da lista: card compacto com fundo glass, cor na borda esquerda por status, avatar do gerente, tempo em destaque
- **Painel de Auditoria**: Slide-in da direita com accordion de sub-etapas e área de evidências
- **Separação visual clara** entre unidades: cabeçalho de seção com nome da unidade + badge de score

### 2.4 Página Gerentes & Unidades (Nova)
- **Grid de Unidades**: Cards glass com nome da unidade, score grande, lista compacta dos gerentes vinculados
- **Drill-down de Gerente**: Ao clicar em um gerente, abre um painel/modal com histórico de avaliações e gráfico de evolução pessoal do score

## 3. User Stories
1. **Como Daniel (CEO)**, ao abrir o dashboard eu quero ver instantaneamente o score geral da rede em destaque enorme, sentindo que tenho controle total da operação.
2. **Como João (Auditor)**, ao entrar no CRM eu quero que os leads em perigo (SLA estourado) apareçam no topo, visualmente em vermelho, sem precisar filtrar nada.
3. **Como Daniel**, ao ver o ranking eu quero identificar de relance quem está subindo (▲) e quem está caindo (▼) na semana, sem ler nenhum texto.
4. **Como Daniel**, ao clicar em "Gerentes" eu quero ver um card bonito para cada unidade e os gerentes dentro dela, sem 404.

## 4. Critérios de Aceite
- Dark Mode funciona via toggle (sem refresh de página)
- Todos os números do dashboard fazem count-up animation na entrada
- CRM mostra leads agrupados por status SEM dropdowns de filtro
- Página `/gerentes` carrega e exibe unidades + gerentes corretamente
- Todas as transições de navegação têm spring animation (não linear)
- Build sem erros no Lovable e localmente

## 5. BDD Scenarios

### Cenário: Dashboard com identidade visual forte
- **Given:** O Daniel acessa a rota `/`
- **When:** A página carrega
- **Then:** Ele vê o número `78.5%` (score global) em tipografia enorme animada fazendo count-up de 0 a 78.5, sobre um fundo dark premium com orb de luz

### Cenário: CRM com agrupamento automático por urgência
- **Given:** Existem 2 leads com SLA estourado, 1 em andamento e 1 concluído
- **When:** O João abre `/crm`
- **Then:** Os 2 leads vermelhos aparecem no topo numa seção "Ação Imediata", o 1 em andamento está na seção "Em Andamento", e o concluído está na seção colapsada "Concluídos"

### Cenário: Página de Gerentes funcional
- **Given:** O Daniel clica em "Gerentes" na sidebar
- **When:** A página `/gerentes` carrega
- **Then:** São exibidos cards glass para cada unidade (Dom Pedro, Jabaquara, Kennedy) com o score da unidade em destaque e os nomes dos gerentes vinculados listados abaixo

### Cenário: Toggle Dark/Light Mode
- **Given:** O sistema está em Dark Mode (padrão)
- **When:** O usuário clica no ícone de sol/lua no topo direito
- **Then:** A interface inteira transiciona suavemente (300ms) para Light Mode sem refresh da página
