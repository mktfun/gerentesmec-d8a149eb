# Proposal

## Requisitos
1. **Justificativa de Checklist (Auditoria):** O modelo LLM deve retornar para cada item do checklist avaliado um pequeno texto justificando o motivo da nota (`true` ou `false`).
2. **Exibição na UI:** Os componentes `AuditPanel` e `ReadOnlyAuditPanel` devem exibir essa justificativa abaixo da marcação de verificado/não verificado em uma tipografia discreta.
3. **Resumo de Mídias (Transcrição):** A IA deve identificar quando mídias (áudio/vídeo/imagem) foram processadas no último turno e retornar seus resumos.
4. **Exibição na Timeline de Chat:** A UI deve exibir um componente anexado à mídia chamado "Insight da IA" contendo o que a IA compreendeu daquele conteúdo, para o usuário bater o olho e saber que o proxy/Google analisou corretamente.
5. **Correção de UX do Botão Salvar (Adendo Rápido):** Colocar um aviso visual claro de que as rotas de IA só salvam via botão Diagnóstico, ou unificar as funções de salvar, para parar a confusão de UX.

## User Stories
- **US1:** Como gerente de unidade, ao ver que perdi ponto no quesito "Orçamento Enviado (2a)", quero ler a justificativa "A mensagem continha apenas texto, não havia valor final ou link do PDF." para poder corrigir meu erro na próxima.
- **US2:** Como gerente de unidade, ao enviar um áudio longo para o cliente, quero ver na tela de chat uma caixinha abaixo do meu áudio dizendo "Resumo: Gerente justificando a troca da correia pois está com folga", provando que o LLM "escutou".

## BDD Scenarios

### Cenário: Geração e Exibição de Justificativas de Auditoria
- **Given (Dado):** Uma conversa em andamento que passou por auditoria autônoma.
- **When (Quando):** O gerente clica para abrir o `AuditPanel`.
- **Then (Então):** Ao expandir a etapa, além da bolinha verde/vermelha, deve existir uma linha descritiva com fundo fosco (Liquid Glass) exibindo o texto retornado pelo LLM para aquele item.

### Cenário: Transcrição de Áudio na Timeline
- **Given (Dado):** O gerente enviou uma mensagem do tipo `[ANEXO ENVIADO: audio]`.
- **When (Quando):** A Edge function avalia o chat e extrai insights da mídia.
- **Then (Então):** A mensagem do chat no frontend deve renderizar um container pequeno "Transcrição:" abaixo do reprodutor de áudio, mostrando o resumo do conteúdo.
