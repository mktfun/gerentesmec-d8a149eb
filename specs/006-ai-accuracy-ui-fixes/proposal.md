# Proposta de Arquitetura e Solução (006-ai-accuracy-ui-fixes)

## Requisitos
- **Prompt Engineering de Alta Fidelidade:** Aplicar a técnica de *Chain-of-Thought (CoT)*. A IA será forçada a escrever seu raciocínio passo-a-passo e interpretar intenções e gírias de mecânica ANTES de decidir a etapa e os cheques da auditoria.
- **Tolerância Zero para Alucinação de Contexto:** Adicionar "Negative Constraints" (Ex: Um "ok" não é aprovação de orçamento se o valor final nunca foi enviado).
- **Correção da Lógica de Funil:** O estágio do funil do CRM (`funnel_stage`) não pode retroceder sem intervenção manual explícita (backend hardcoded lock).
- **UI Não-Invasiva:** Substituir as "bolhas gigantes" verdes por uma anotação visual discreta conectada diretamente à mensagem original.
- **Áudios Transcritos no Chat:** A transcrição de mídia deve ser armazenada em `chat_messages` e renderizada embaixo do áudio.

## BDD Scenarios

### Cenário: Chain-of-Thought na Avaliação Híbrida (Gírias)
- **Given (Dado):** O Gerente enviou um vídeo do motor e o valor R$ 2000. O cliente responde: "manda bala, pode marcha".
- **When (Quando):** A IA avalia a mensagem do cliente.
- **Then (Então):** A IA gera primeiro a chave `"reasoning"`, analisando que "manda bala" e "marcha" no jargão brasileiro significam aprovação clara, e só *depois* classifica o funil como `closed_won`.

### Cenário: Agradecimento Falso (Alucinação)
- **Given (Dado):** O Gerente está no meio do atendimento e envia: "Valeu amigo, veja essa peça".
- **When (Quando):** A IA avalia para pontuar o item 4a.
- **Then (Então):** A IA explica no `"reasoning"` que a palavra "Valeu" foi usada coloquialmente e que o atendimento não encerrou (funnel != closed_won). Portanto, crava `4a: false`.

### Cenário: Progressão Estrita de Funil
- **Given (Dado):** O Lead já está em `closed_won` (Vendido). A IA se confunde com um "bom dia" e tenta retornar o funil para `negotiation`.
- **Then (Então):** A API Edge Function descarta a sugestão da IA e mantém `closed_won`, aceitando apenas mudanças para `closed_lost`.

### Cenário: Indicador Visual Minimalista na UI
- **Given (Dado):** A IA marcou Orçamento (2a).
- **When (Quando):** O usuário abre o chat.
- **Then (Então):** Sob a mensagem do gerente aparece uma micro-nota: *✓ Marquei Orçamento: [Texto exato do "reasoning" da IA]*.
