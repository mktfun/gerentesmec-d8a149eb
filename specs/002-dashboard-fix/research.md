# Research: Dashboard Metrics & Layout Redesign

## 1. Contexto e Problema Reportado
O usuário relatou 3 problemas no sistema de Analytics:
1. **Gráfico Histórico Quebrado:** "Vários dias zerados e só hoje com score em vários".
2. **Dashboard Operacional:** "Na visualização do geral (operacional) não mostra score geral de hoje no gráfico".
3. **Dashboard Executivo:** O layout atual está feio, com o gráfico no meio. Ele solicitou uma reformulação com 2 cards no lado esquerdo (incluindo o gráfico de saúde geral) e um ranking das top 3 lojas no lado direito.

## 2. Análise Técnica (Root Cause)

### 2.1 Gráfico Histórico (`Index.tsx`)
A função que calcula o `scoreHistory` usa uma janela rolante de 30 dias para cada dia da última semana. No entanto, se não houver leads avaliados naqueles dias (porque o cliente começou a usar a IA hoje/ontem, ou usa o Batch Mode), o `avgScore` retorna `null`. O componente `Recharts` interpreta excesso de `nulls` como 0 ou quebra a linha, parecendo que o score era 0% nos dias anteriores.
**Solução:** Implementar um "Backfill Semântico". Se o dia X tem score nulo, ele herda o score do dia X+1 mais próximo, ou simplesmente garantimos que o fallback linear funcione se houver poucos dados.

### 2.2 Visão Operacional (`Relatorios.tsx`)
O usuário mencionou "gráfico" na visão operacional, mas a página `Relatorios.tsx` não possui gráfico, apenas Cards (Score Global, TMR, SLAs). A confusão provavelmente ocorre porque se o filtro de data estiver restrito a "Hoje" e o Batch Mode não rodou ainda, o Score Global exibirá `—` (nulo). 
**Solução:** Deixar claro no Card de Score Global que ele depende de leads *auditados*. Se a seleção for apenas "Hoje" e não houver auditorias, mostrar um tooltip ou aviso amigável ("Aguardando processamento em lote").

### 2.3 Visão Executiva (`Index.tsx`)
O layout atual é uma grade flexível simples (Top Cards -> Gráfico -> Nada).
O usuário deseja um layout de Painel de Controle (Dashboard Layout) com colunas:
- **Coluna Esquerda (2/3):**
  1. Card de Saúde Geral (O "Massive Score Card" semelhante ao do ManagerDashboard ou um grande medidor de score).
  2. Gráfico de Evolução (AreaChart atual, consertado).
- **Coluna Direita (1/3):**
  1. Ranking das 3 Lojas com melhor performance.

## 3. Diretrizes de Design (UX/UI 2026)
Aplicar as regras da skill `ux-ui-architect-2026`:
- **Apple Liquid Glass:** Cards com `backdrop-blur`, bordas semitransparentes `border-white/10`.
- **Maximalismo Tátil:** Tipografia grande para os Scores (ex: `text-6xl font-black`), uso de gradientes e contrastes fortes (Cores Dopamínicas: Indigo 500, Emerald 500).
- **Microinterações:** Hover states nos cards de ranking das lojas.
