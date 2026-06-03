# Proposal: Transparência Absoluta na Avaliação da IA (Evidence-Based UI)

## Requisitos
- **Transparência Irrefutável:** Os gerentes devem entender o porquê de cada nota sem margem para dúvida.
- **Rastreabilidade (Evidências):** Cada item pontuado como "Feito" deve ter um link direto para a mensagem exata na conversa que comprova a ação.
- **Justificativa Contextual:** Cada item pontuado como "Não Feito" (que deveria ter sido) deve exibir a justificativa específica daquela conversa gerada pela IA.
- **Laudo da IA:** Um espaço claro mostrando o "raciocínio" bruto da IA (Chain-of-Thought) de forma legível.

## User Stories
- **Como gerente**, eu quero ver exatamente qual mensagem provou que eu enviei o orçamento, para não ter dúvidas de que o sistema é justo.
- **Como gerente**, eu quero ler a justificativa do porquê perdi pontos em um item específico, para entender onde errei.
- **Como administrador**, eu quero ver o laudo de pensamento da IA para poder julgar se ela avaliou corretamente e mostrar isso aos gerentes em reuniões de feedback.

## Critérios de Aceite
- [ ] O componente de Checklist da UI deve mudar o layout para acomodar "Evidências" (links para mensagens) e "Justificativas" (textos da IA).
- [ ] A interface deve ter um botão "Raio-X da IA" ou uma seção "Laudo" que mostra o `reasoning_step_by_step` do banco de dados de forma estética.
- [ ] O backend já fornece os dados (`audit_checklist_messages` e `audit_reasons`), o trabalho é garantir que esses dados sejam carregados na store (`AppDataContext.tsx`) e renderizados perfeitamente na UI sem quebrar layouts antigos.

## BDD Scenarios

### Cenário: Exibição de Justificativa de Erro
- **Given:** Um lead foi auditado e o gerente não enviou um vídeo do defeito (item 2e = false), gerando uma \`audit_reason\` no banco de dados.
- **When:** O gerente ou administrador abre o "Painel de Qualidade" desse lead no CRM.
- **Then:** O item "Enviou vídeo educativo?" aparece com um ícone de alerta vermelho, e logo abaixo dele a justificativa descritiva: "Gerente pulou direto pro orçamento sem enviar foto/vídeo do defeito."

### Cenário: Rastreabilidade de Evidência Positiva
- **Given:** A IA marcou que o orçamento foi enviado (item 3a = true) na mensagem de ID `msg-123`.
- **When:** O gerente clica em "Ver Evidência" ao lado do item 3a no checklist.
- **Then:** A interface rola o painel de histórico de chat exatamente para a mensagem `msg-123`, e ela pisca com um destaque (glow) para provar que a IA leu aquilo.
