# Pesquisa e Contexto (RPI-R)

## Escopo do Pedido
O usuário pediu duas adições fundamentais à interface de Auditoria e Histórico de Chat:
1. **Resumo de Mídias Visual:** Abaixo de anexos como áudios, vídeos e imagens na timeline de chat, o sistema deve apresentar um "resumo" do que a IA extraiu/transcreveu daquela mídia.
2. **Justificativa de Score Granular:** Para cada item do checklist de pontuação marcado ou zerado, o painel de auditoria (`AuditPanel` e `ReadOnlyAuditPanel`) deve exibir um pequeno texto abaixo explicando o *porquê* (justificativa) daquela avaliação.

## Diagnóstico do Sistema Atual
Atualmente:
- **Mídias:** As mídias (image_url/audio/video) são injetadas no contexto do LLM durante a avaliação (Edge Function `ai-autonomous-evaluator`), e a transcrição acaba se diluindo no `new_compressed_history` ou no `closing_summary`. Não temos um campo estruturado no banco de dados para salvar a transcrição/resumo associada a um `message_id` específico.
- **Score Justifications:** O JSON gerado pela IA possui o formato: `{"audit_checklist": {"1a": true, "2b": false}}`. Não existe campo para explicações por item. A IA atual gera um `closing_summary` global e um `message_insight` quando move o lead de etapa.

## Viabilidade Técnica
- **Resumo de Mídia:** Precisaremos salvar esse resumo na tabela `chat_messages`, que possui uma coluna `metadata` (JSONB) não explorada ou criar um padrão no `content`. Como a IA processa mensagens em bloco, a IA precisaria mapear a transcrição da mídia. Outra opção é alterar o backend para processar a mídia individualmente no momento do envio e gravar a transcrição. Mas como a IA Autônoma já lê o chat todo de uma vez, é mais complexo atrelar retrospectivamente.
  *Melhor abordagem:* A IA Autônoma já devolve um objeto JSON. Podemos adicionar a chave `media_summaries`: `{ "id_da_mensagem_de_midia": "Resumo do que foi dito" }`. A Edge Function pode então atualizar a `chat_messages.content` ou adicionar uma mensagem de sistema logo abaixo, ex: `[SISTEMA] Resumo da mídia acima: ...`
- **Justificativa de Score:** Precisamos alterar o JSON Schema exigido do LLM para que `audit_checklist` continue sendo booleano (para retrocompatibilidade), mas adicionar um objeto paralelo `audit_justifications: { "1a": "O gerente foi cordial...", "2a": "Enviou orçamento" }`. O painel exibirá esse valor.

## Problema Relatado Anteriormente (Botão de Salvar)
Enquanto pesquiso o sistema de IA, ficou claro que o botão "Aplicar Modificações" do modal salva o `system_prompt` mas *não* salva a aba de Provedor (que possui seu próprio botão "Diagnóstico Inteligente"). É um erro de UX comum. Isso será endereçado no spec.
