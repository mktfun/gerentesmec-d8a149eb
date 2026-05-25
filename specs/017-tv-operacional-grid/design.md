# Design & UI/UX

## Nova TV Operacional
O design adotará um padrão de **Cards de Unidade (Grid)** preenchendo o corpo da tela.
- **Header Compacto:** No topo da tela, uma barra fixa com os dados Macro (TMR Geral, Total na Fila, Total em Atendimento e SLAs Críticos Globais).
- **Corpo (Grid):** Uma grade responsiva (`grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).
- **Cartões de Gerente:** 
  - Fundo translúcido `bg-white/[0.02] border border-white/10`.
  - Nome do gerente no topo.
  - TMR isolado daquela unidade com destaque visual (verde se < 15, vermelho se > 15).
  - 3 minicards internos mostrando os números absolutos de `Novo Lead`, `Orçamentos` e `Em Negociação`.
  - Se a unidade tiver SLAs estourados, o cartão da unidade terá uma borda em `border-rose-500/50` e uma sombra pulsante `shadow-[0_0_30px_rgba(244,63,94,0.3)]`.
