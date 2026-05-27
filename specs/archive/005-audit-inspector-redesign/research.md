# RPI-R: Pesquisa e Contexto (Feature 005)

## 1. Mapeamento do Código Atual
- **`src/components/Manager/ManagerAuditInspector.tsx`**: Trata-se de um modal (overlay de tela cheia) que exibe o log de conversa entre o mecânico (bot) e o cliente, intercalado por marcações temporais de auditoria feitas pela IA ("Demora na resposta", "Checklist cumprido").
- O design atual usa `framer-motion` e paleta Dark Mode estrita (`background: rgba(15,15,20,0.95)`). Os balões de mensagem são baseados no tema cyberpunk (bordas com cores neon, fundo translúcido escuro, glows).
- Há um painel deslizante direito (Quality Index Drawer) que resume se o atendente passou em cada item da auditoria, também em fundo muito escuro.

## 2. Necessidades de Negócio & Feedback
- A feature 004 modificou a visualização principal do gerente (Manager Dashboard) para uma UX estilo "TripGlide" de 2026 (design Anti-burro, limpo, tema claro/escuro nativo).
- O inspetor de auditoria (ManagerAuditInspector) não seguiu essa mudança ainda. O gerente percebe um choque de estilos quando clica em "Avaliar Atendimento": sai de uma tela clara/minimalista para um modal escuro e complexo.
- O termo "Avaliar Atendimento" gerou dúvida, já que o gerente apenas "vistoria" (a IA é quem avalia). No botão da tela anterior, devemos usar "Vistoriar" em vez de "Avaliar".

## 3. Lacunas para Adaptação
- **Theming Dinâmico**: Remover fundos rígidos HEX (`#0f0f14`) e usar as variáveis dinâmicas de Tema (Claro/Escuro) recém adicionadas à aplicação.
- **Micro-UI de Conversa**: Transformar os balões de conversa neon em balões de chat limpos estilo iMessage/WhatsApp modernos (cores sólidas e sombras físicas difusas, não "glow").
- **Quality Drawer**: Substituir o drawer lateral de listagem minúscula por um design mais acessível (maiores espaços, ícones claros).
