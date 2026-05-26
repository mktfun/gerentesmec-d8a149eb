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
   - Faz o fetch do `daily_score_snapshots` (últimos 14 dias) na montagem do componente.
   - Organiza a lista de "Slides" (Sendo Slide 1 a N as unidades, e o último slide a visão Geral).
   - Possui o loop temporal (ex: `setInterval` de 15s) que incrementa o índice da página.
   - Controla a transição das views com `framer-motion`.

2. **`UnitOperationalSlide.tsx` (Subcomponente de Visualização)**
   - Recebe a `Unit` atual, seu `Manager` (único), os `Leads` da unidade, e o histórico diário de scores dessa unidade (extraído do JSONB do snapshot).
   - Renderiza no topo: O nome da Unidade Gigante e Elegante e o TMR atual.
   - **Esquerda/Centro:** Um gráfico de linha ou barra suave e brilhante mostrando a nota dos últimos dias.
   - **Direita (Lista de Alertas):** Uma lista scrolável (ou limitada aos Top 5) de leads com SLA estourado, exibindo "Nome | Telefone (formatado) | Tempo de Espera".

3. **`GlobalOperationalSlide.tsx` (Última tela do loop)**
   - Renderiza a Visão Geral da Empresa.
   - **Esquerda/Centro:** Gráfico Histórico do `global_score` dos últimos dias.
   - **Direita:** Ranking minimalista das lojas com mais leads em atraso (ou as piores em TMR no momento atual).

## Modelagem de Banco de Dados (Supabase)
- Nenhuma alteração no esquema é necessária. Utilizaremos a tabela `daily_score_snapshots` (que já salva o breakdown diário por unidade) junto com os dados injetados via `AppDataContext`. Apenas faremos uma query simples no mount do carrossel.
