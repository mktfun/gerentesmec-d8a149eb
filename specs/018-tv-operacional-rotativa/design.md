# Design: TV Operacional Rotativa

## Padrões Visuais (UX/UI 2026 - SDD)
A interface deve transmitir a sensação de um "Painel de Comando Executivo de Engenharia":
- **Tipografia:** Clean e imponente (Inter/Outfit), pesos grandes para números, labels discretas em upppercase tracking-widest.
- **Fundo:** Dark scheme escuro puro (slate-950 ou black) com sutis texturas ou gradientes de profundidade.
- **Microinterações:** Transições suaves de fade/slide entre as páginas do carrossel (`framer-motion` ou AnimatePresence).
- **Sem Poluição:** Apenas os dados cruciais. Muito espaço em branco (negative space) entre os componentes.

## Divisão de Componentes (Stitch/React)

1. **`TvOperacionalCarousel.tsx` (Page/Component)**
   - O contêiner principal.
   - Puxa o contexto de dados `useAppData()`.
   - Organiza os gerentes por `unit_id`.
   - Possui o loop temporal (ex: `setInterval` de 15s) que incrementa o índice da página.
   - Controla a transição das views.

2. **`UnitOperationalSlide.tsx` (Subcomponente de Visualização)**
   - Recebe como props a `Unit` atual e a lista de seus `Managers` (com os `Leads` filtrados deles).
   - Renderiza no topo: O nome da Unidade Gigante e Elegante, total de fila da loja e TMR da Loja.
   - Renderiza no corpo: Um Grid responsivo (ex: 3 colunas) de `ManagerOperationalCard.tsx`.

3. **`ManagerOperationalCard.tsx`**
   - Recebe um `Manager` e seus `Leads`.
   - Exibe foto (se houver) ou Iniciais elegantes.
   - Exibe o TMR atual dele em destaque (Fonte enorme).
   - Mostra o indicador de `danger` (SLA estourado) através de uma borda sutil `ring-1 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]`.
   - Exibe 3 badges minimalistas abaixo: Fila (`lead_new`), Em Negociação (`negotiation`), Orçamentos (`quote`).

## Modelagem de Banco de Dados (Supabase)
- Nenhuma alteração no esquema de banco de dados é necessária, pois utilizaremos os mesmos dados já injetados no contexto (`units`, `managers`, `leads`). A métrica de TMR será calculada on-the-fly pelo `calculateTmr` ajustado na branch anterior.
