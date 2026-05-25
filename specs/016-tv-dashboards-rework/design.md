# Design & UI/UX

## TV Executiva
Vamos integrar as lógicas do `TvExecutivo.tsx` atual para o layout do antigo `TvDashboard.tsx` (que já tinha os filtros perfeitos, topo de comando e background de Liquid Glass).
- O carrossel terá uma página extra (Página 0) que será o "Macro Dashboard".
- A animação será do Framer Motion (slide in e slide out).

## TV Operacional
O layout não terá letras de 8rem. Terá 3 colunas:
- **Coluna 1 (Fila do Desespero):** Apenas Leads `lead_new` aguardando. Com timer e cores corais.
- **Coluna 2 (Orçamentos e Negociações):** Quantidade e visão compacta dos leads ativos, separando por unidade.
- **Coluna 3 (KPIs Gerais):** TMR da Oficina, Total Ativos, Total Críticos.
