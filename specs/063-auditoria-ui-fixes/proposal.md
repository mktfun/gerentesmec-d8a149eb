# Proposal: 063 - Auditoria UI Fixes & Histórico Premium

## 1. Visão Geral
Esta spec visa corrigir bugs visuais críticos na navegação global (overlap e flickering na LumaBar e Toasts) e elevar a qualidade da interface da Auditoria e de seu Histórico. Além disso, removemos o "hardcoded dark mode" das páginas da Auditoria para que elas respeitem perfeitamente o Light Mode do sistema, com alto contraste (muito importante para visibilidade sob luz solar).

## 2. Escopo das Correções
1. **Z-Index e Toaster (Sonner):**
   - Configurar o `<Toaster position="bottom-right" />` global em `App.tsx` ou onde estiver montado, garantindo que as notificações não entrem em conflito com o Cabeçalho ou a LumaBar.
   - Ajustar o `z-index` do Header (`DashboardLayout`) para `z-50` fixo, impedindo que modais ou o LumaBar o sobreponham incorretamente.
   
2. **Flicker da LumaBar:**
   - Travar a largura (`w-12 h-12`) dos botões da `LumaBar` e evitar que a animação ou variação do peso da fonte (`font-bold`) no estado `active` empurre os demais ícones.
   
3. **Refatoração do Light Mode (`AuditoriaExecution.tsx` e `AuditoriaItemCard.tsx`):**
   - Trocar cores hardcoded (ex: `bg-[#0a0a0f]`, `text-white`) por classes mutáveis (`bg-zinc-50 dark:bg-[#0a0a0f]`, `text-zinc-900 dark:text-white`).
   - Usar `border-zinc-200 dark:border-zinc-800` para componentes estruturais e cards.
   - Botões de "Conforme" usarão Verde Vivo e "Não Conforme" usarão Vermelho Vivo no light mode para o máximo de legibilidade debaixo do sol.

4. **Histórico Premium (`AuditHistory.tsx` / `AuditDetails.tsx`):**
   - Converter a lista simples em Cards arredondados modernos (shadow-sm no Light Mode).
   - Aplicar badges de pílulas coloridas translúcidas para exibir o Score e os Status (Conforme/Não Conforme).
   - Layout em grid na galeria de fotos do Histórico (usando `aspect-square object-cover`) integrado com a Lightbox in-place (fundo estilo WhatsApp).

## 3. Benefícios
- **Usabilidade Solar:** As cores em alto contraste garantem legibilidade total ao realizar inspeções externas.
- **Hierarquia Funcional:** Alertas não bloquearão a navegação nem poluirão o centro visual da tela.
- **Design Consistente:** O histórico herdará a UI premium do Stepper, fechando o ciclo de experiência.
