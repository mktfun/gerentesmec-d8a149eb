# Research: TV Mode Visuals & Metrics Engine

## Contexto
O usuário possui um "TV Mode" (`TvDashboard.tsx`) que atua como um Command Center da operação B2B. As seguintes dores foram levantadas:
1. **Problemas de Renderização Visual:** O fundo está cortado, a iluminação (glow) está vazando ou contida de forma errada, e o padding/tamanho dos cards não está harmonioso.
2. **Falta de Motor de Dados (Filtro de Data):** Hoje a tela é "hardcoded" para mostrar dados de hoje (`today0`). O usuário precisa de um botão acessível para trocar o período analisado (Últimos 7 dias, Hoje, Mês, Calendário) e que essa configuração seja salva.
3. **Métricas Falsas/Incompletas:** Os valores como "Leads em Risco: 0" estão mocados ou não calculados corretamente.

## Arquivos Afetados
- `src/components/Dashboard/TvDashboard.tsx`: O layout central dos cards e o topbar onde o filtro será inserido.
- Possível necessidade de usar componentes de `DatePicker` e `Popover` do Shadcn UI (ou construir um nativo bonito).

## Desafios Técnicos
1. Filtrar as listas (`leads`) com base em um range de datas de forma performática.
2. Armazenar a preferência de data (`localStorage` ou `system_settings`) para que a TV ligue sozinha e já abra no filtro correto.
3. Arrumar o CSS de "Liquid Glass" nos cards que atualmente têm `overflow-hidden` conflitando com blurs de fundo.
