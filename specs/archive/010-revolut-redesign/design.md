# Design Document: Redesign Visual Revolut-Inspired

## 1. Sistema de Design Global

### 1.1 Paleta de Cores (Dark Technical + Premium)
```css
/* Dark Mode (Padrão) */
--bg-base:        #0a0a0f     /* fundo principal: quase preto com tom violeta */
--bg-surface:     #111118     /* cards e painéis */
--bg-elevated:    #1a1a24     /* dropdowns, hover states */
--border-subtle:  rgba(255,255,255,0.06)
--border-default: rgba(255,255,255,0.10)

/* Acents (Revolut-inspired) */
--accent-primary: #6366f1    /* indigo-500: ações principais */
--accent-green:   #34d399    /* emerald-400: score alto, positivo */
--accent-red:     #f87171    /* rose-400: SLA, negativo */
--accent-amber:   #fbbf24    /* amber-400: atenção, médio */

/* Light Mode */
--bg-base-light:     #f4f4f8
--bg-surface-light:  #ffffff
--bg-elevated-light: #f8f8fc
```

### 1.2 Tipografia
- **Font:** `Plus Jakarta Sans` (Google Fonts) — headlines e números
- **Fallback:** `Inter`, `system-ui`
- **Escala dos KPIs:** `text-7xl font-black` para o herói do dashboard
- **Labels:** `text-xs uppercase tracking-widest font-medium opacity-50`
- **Nomes:** `text-sm font-semibold`

### 1.3 Glass Card Pattern (Padrão para todos os cards)
```
Dark:  bg-white/5  backdrop-blur-xl border border-white/10  shadow-[0_4px_24px_rgba(0,0,0,0.4)]
Light: bg-white    backdrop-blur-xl border border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.06)]
```

### 1.4 Animações (Framer Motion Spring)
```tsx
// Entrada de componentes
initial: { opacity: 0, y: 20 }
animate: { opacity: 1, y: 0 }
transition: { type: 'spring', stiffness: 300, damping: 30 }

// Stagger list
children delay: index * 0.05s

// Hover em cards
whileHover: { scale: 1.02, y: -2 }
transition: { type: 'spring', stiffness: 400, damping: 25 }
```

---

## 2. Layout — Sidebar

### Nova Sidebar Premium
- Largura: `w-[72px]` colapsada (apenas ícones) ou `w-[220px]` expandida
- Fundo: `bg-[#0d0d14] border-r border-white/5`
- Logo no topo: Ícone + texto `GerentesMec` em `font-black text-white`
- Itens: ícone + label, hover com `bg-white/5 rounded-xl`
- Item ativo: `bg-indigo-500/20 text-indigo-400 border-l-2 border-indigo-500`
- Toggle Dark/Light: no rodapé da sidebar com ícone animado

---

## 3. Dashboard (Tela Principal — Daniel)

### Layout em 3 Zones:
1. **Hero Zone** (topo, 40% da viewport):
   - Fundo: card glass com orb de luz indigo/violet difusa atrás
   - Score global GIGANTE: `78.5%` em `text-7xl font-black`
   - Sub-label: `Qualidade Geral da Rede • Hoje`
   - Badge de tendência: `▲ +2.5% esta semana` em verde animado
   - Chips de unidade ao lado: Dom Pedro 62% | Jabaquara 87% | Kennedy 75%

2. **Metrics Row** (3 KPI cards glass, linha horizontal):
   - Atendimentos Hoje: número grande com ícone
   - Auditorias Pendentes: com badge laranja se > 0
   - Leads em Alerta: com pulse vermelho se > 0

3. **Bottom Split** (gráfico 60% + ranking 40%):
   - Gráfico: `AreaChart` com linha branca fina e gradiente sutil abaixo
   - Ranking: cards compactos com avatar letra, barra animada e `▲▼`

---

## 4. CRM / Auditoria (Tela João)

### Layout Inteligente por Status (sem filtros dropdown):
```
TELA DIVIDIDA: [Lista esquerda] [Painel auditoria direita]

Lista Esquerda:
┌─────────────────────────────┐
│ 🔴 AÇÃO IMEDIATA (2)        │  ← Seção vermelha no topo
│  Paulo (BMW) · 25 min       │
│  Juliana (Corolla) · 22 min  │
├─────────────────────────────┤
│ 🟡 EM ANDAMENTO (1)         │  ← Seção amarela
│  Roberto (Hilux) · 10 min   │
├─────────────────────────────┤
│ ✅ CONCLUÍDOS HOJE (1)  ▼   │  ← Colapsável
│  Ana (Civic) · Score: 91%   │
└─────────────────────────────┘
```

### Cada Lead Card:
- Borda esquerda colorida (vermelho/amarelo/verde)
- Avatar-círculo com inicial do gerente
- Nome do cliente + nome do gerente em linha
- Unidade + tempo em badge
- Score se auditado, ou "Pendente" se não

---

## 5. Página Gerentes & Unidades (Nova — `/gerentes`)

### Grid de Cards por Unidade:
- Cada card = uma unidade mecânica
- Score da unidade em destaque central (`text-4xl font-black`)
- Barra de progresso colorida por performance
- Lista de gerentes vinculados com mini-score individual e `▲▼`
- Clique no gerente → Modal/Sheet com histórico de auditoria dele

### Modal de Gerente (Drill-down):
- Header: nome + unidade + foto/avatar
- Score médio do mês, da semana e do dia
- Gráfico de linha com evolução do score nas últimas 4 semanas
- Lista das últimas auditorias com botão "Ver detalhes"

---

## 6. Banco de Dados (Futuro — Supabase)
Não há mudança de estrutura nesta fase. Os dados continuam mockados até aprovação do frontend.
Quando integrarmos, precisaremos de:
- `units` (já existe)
- `managers` (já existe)
- `whatsapp_cycles` com `status`, `wait_time_minutes`, `calculated_score`
- `audits` com foreign key para `cycle_id`
- `audit_items` para os sub-checkboxes granulares
