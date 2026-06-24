# Spec 06: Design (TV 2.0)

## Interface Architecture
A televisão é uma interface não-interativa (do ponto de vista de mouse) que exige componentes super dimensionados, paleta contrastante e auto-suficiência informacional.

### 1. DashboardLayout Imersivo
- Hook `isTvRoute`: Detecta `/tv` no path.
- Efeito: `<aside>` e `<header>` são condicionalmente ocultados (`if (!isTvRoute && !isTvMode)`).
- Resultado: 100% da tela é coberta pelo Canvas Principal (`flex-1 h-screen`).

### 2. Painel Crítico da TV Operacional (`ManagerDashboard`)
A TV que fica na sala do Operacional.
O gerente não deve apenas ver o gráfico e os SLAs. Ele precisa ver a "Lista da Morte" para focar em reverter orçamentos ou punir o mal atendimento na hora.

- **Layout do Painel Crítico**: Lado direito ou esquerdo do Slide da Unidade (`UnitOperationalSlide.tsx`).
- **Data Source**: Leitura dos leads da unidade (`unitLeads`). 
- **Filtro Waterfall (Fallback Inteligente)**:
  1. Busca leads auditados hoje com Score < 60. Se `count >= 3`, mostra-os.
  2. Se não, busca leads auditados na SEMANA com Score < 75. 
  3. Se ainda faltar, adiciona leads com status `closed_lost` (Orçamento recusado ou Vácuo) das últimas 24-48h.
- **Card Design**: Fundo avermelhado escuro/transparente, com o Score gigante. Resumo do Lead, status de risco e alerta pulsante.

### 3. Painel de Vergonha (`TvRadarView.tsx`) na TV Executiva
A TV que fica na sala da Diretoria.
O objetivo é evitar que a mensagem "Radar Limpo!" apareça quando na verdade as coisas não estão bem e a régua de corte só foi muito rígida.

- **Layout**: Um carrossel interno ou grid robusto.
- **Filtro Waterfall (Global)**:
  1. Piores do Dia (Score < 60).
  2. Piores da Semana (Score < 70).
  3. Orçamentos Perdidos sem motivo justificável.
- As anomalias devem ser mostradas com Avatar da Unidade, Ícone de Fogo ou Lixo (representando a perda), Nota exata e o trecho final do feedback.
