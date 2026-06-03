# Design Specifications (UI/UX 2026)

## Arquitetura de Interface (`Index.tsx`)

A tela será remodelada utilizando uma Grid CSS (ex: `grid-cols-1 lg:grid-cols-3 gap-6`).

### 1. Coluna Principal (Esquerda - `col-span-2`)
- **Card de Saúde Geral (Herói):** Um componente de impacto visual alto (Maximalismo Tátil). Similar ao card "Massive Score" do ManagerDashboard. Fundo escuro com blur (`bg-[#212529]`), texto gigante para o score global, subtítulo "Saúde Geral".
- **Gráfico de Evolução:** O `AreaChart` atual, porém movido para ficar logo abaixo do card Herói. Terá a correção de `connectNulls` aprimorada com "Backfill Linear" no array de dados para evitar quedas a zero irreais.

### 2. Coluna Lateral (Direita - `col-span-1`)
- **Card de Ranking de Unidades:** Um novo painel listando o top 3 Lojas baseado na média de score.
- **Design do Ranking:** Lista de avatares/ícones, progress bars simulando o medidor de score (ex: barras esmeralda para >75, âmbar para >50). Efeito Hover de deslocamento sutil (Y:-2px) para interatividade.

## Modelagem de Dados
- Nenhuma alteração no Supabase. O bug do gráfico é 100% de representação e cálculo frontend. Reutilizaremos o hook atual do `leads` contextualmente.

---

# Tasks

- [ ] 1. Corrigir cálculo de histórico de score em `Index.tsx` (`scoreHistory`).
  - Iterar pelo array final gerado e preencher `nulls` com o próximo valor válido disponível (backfill) se `validPoints > 0`.
- [ ] 2. Ajustar `Index.tsx` Layout.
  - Remover a disposição atual de 3 caixinhas horizontais de "Métricas".
  - Criar grid principal `lg:grid-cols-3`.
  - Inserir "Massive Score Card" (Saúde Geral) e o AreaChart na `lg:col-span-2` (lado esquerdo).
  - Desenvolver o componente "Ranking de Unidades" e inseri-lo na coluna da direita.
- [ ] 3. Melhoria na Tela Operacional (`Relatorios.tsx`).
  - Ajustar o fallback do Card de "Score Global" para exibir "Processamento Batch Pendente" quando o score for nulo para o dia atual.
