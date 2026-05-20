# Design Document: Premium Aura Restoration (013)

## 1. UI / UX Updates (2026 Guidelines)

### 1.1 O Hero Card do Dashboard (Score Global)
- **Visual:** Um contêiner dark massivo (ex: `bg-[#0a0a0f]`) com um overlay de gradiente radial sutil puxando para o índigo/esmeralda. Bordas `border-white/[0.08]` e shadow glow `shadow-[0_0_80px_rgba(99,102,241,0.06)]`.
- **Anatomia:**
  - **Esquerda:** Título "SCORE GLOBAL DA REDE" em uppercase espacado, e o número massivo (ex: `78.5%`) em fonte Sans-serif bold, acompanhado por um badge esmeralda de "+2.5% esta semana".
  - **Direita:** Três "caixinhas" com glassmorphism exibindo os scores individuais das unidades (Dom Pedro 62.5%, Jabaquara 87.5%, Kennedy 75%).

### 1.2 TV Mode Layout (`TvDashboard.tsx`)
- Sair completamente da grid padrão de gráficos.
- O TV mode será um Flex/Grid de 3 colunas iguais.
- Cada coluna é um "Pilar" de uma unidade:
  - Fundo super escuro, quase preto absoluto.
  - Título massivo no topo com o nome da unidade.
  - Indicador circular (Ring) gigante no centro com o Score.
  - Footer com número de leads em perigo vermelho piscante.

### 1.3 Relatórios Health-First
- Remover os cards de Faturamento gigantões cinzas.
- Usar cards com gradients radiais como no Dashboard.
- **Métricas:** 
  1. Tempo Médio de Primeira Resposta (TMR).
  2. Taxa de Resolução de SLAs.
  3. Taxa Média de Sucesso de Checklist.
- O faturamento e ticket vão para gráficos menores.

### 1.4 Audit Panel Inline Edit
- No painel lateral, adicionar um container "Informações Financeiras".
- O input do ticket usa um estilo ghost (`bg-transparent hover:bg-white/5 border-b border-transparent hover:border-white/20`), focando em ser imperceptível até a interação. Ao focar, revela bordas primárias.
