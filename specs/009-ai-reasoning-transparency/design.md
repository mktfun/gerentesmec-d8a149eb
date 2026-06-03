# Design: UI de Transparência da IA (Evidence-Based Scoring)

## 1. Abstração de Dados (Supabase -> React Context)
A estrutura de dados que chega do Supabase na tabela `leads` já tem o que precisamos:
- `audit_checklist` (JSON com `{ "1a": true, "2b": false }`)
- `audit_checklist_messages` (JSON com mapeamento ID_Check -> ID_Mensagem_Chatwoot. Ex: `{ "1a": 54321 }`)
- `audit_reasons` (JSON com `{ "2b": "Não enviou vídeo do defeito." }`)
- Precisaremos buscar também os "memories" do lead, onde o campo `insight` ou a tabela de logs contém o `reasoning_step_by_step` (Laudo Bruto da IA).

## 2. Modificações na UI (Stitch / React)

### Componente `ManagerAuditInspector` ou similar (ex: `QualityPanel`)
Este é o coração da mudança visual.
- **Antes:** Uma lista simples de checkboxes verdes e vermelhos.
- **Agora (2026 UX):** 
  - Cada item avaliado será um "Card Expansível" sutil ou terá informações adicionais alinhadas à direita/abaixo.
  - **Item Positivo (TRUE):** Ícone verde com borda de Apple Liquid Glass. Um pequeno botão semi-transparente "🔍 Ver Evidência". Ao clicar, acionaremos um evento ou passaremos uma prop para o componente de Chat rolar (`scrollIntoView`) até a mensagem exata usando o ID contido em `audit_checklist_messages`.
  - **Item Negativo (FALSE):** Ícone vermelho desbotado. Logo abaixo do texto da regra, uma caixa sutil em tons de vermelho escuro/vinho com o ícone de IA (Sparkles) contendo o texto da `audit_reasons`. Isso materializa o "porquê" de forma incontestável.

### Painel "Laudo da IA" (Raio-X)
- Criaremos um novo sub-painel ou modal acessível a partir da tela do lead chamado "Raio-X da IA".
- Esse painel vai consumir o Log bruto de execução da IA e exibir o `reasoning_step_by_step`. 
- **Estética Maximalismo Tátil:** Fundo escuro imitando um console/terminal futurista (fonte mono-espaçada colorida para JSON/Logs, efeitos sutis de Scanline ou brilho de matriz), passando a sensação de que o gerente está lendo o "cérebro" da máquina.
- Um botão de "Sobrescrever Auditoria (Override)" para permitir ao gerente ou admin alterar o checklist manualmente se provar que a IA estava errada.

## 3. Integração com a Skill `ux-ui-architect-2026`
- **Acessibilidade WCAG 2.2:** Contraste alto nos alertas vermelhos. Não dependa apenas da cor vermelha para itens falsos, use ícones `X` bem demarcados e texto auxiliar claro.
- **Microinterações:** Quando clicar em "Ver Evidência", a rolagem do chat deve ser suave (smooth scroll) e a mensagem alvo deve pulsar (pulse animation) em cor primária (roxo/azul claro) por 2 segundos para focar a atenção do olho humano.
