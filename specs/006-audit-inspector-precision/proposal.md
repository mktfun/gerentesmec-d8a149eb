# Proposta: Audit Timeline Precision & Media (Feature 006)

## 1. Requisitos
1. **Fim do Chute Estatístico**: A IA deve ancorar sua nota exatamente na mensagem onde o trigger ocorreu, através do mapa `lead.audit_checklist_messages`. Falsos positivos de timeline serão eliminados.
2. **Minimalismo na Avaliação**: Onde a avaliação ocorrer, exibir apenas um balão anexo à mensagem principal (uma "sub-mensagem" acoplada ou "notinha"), evitando quebrar brutalmente a timeline com "Eventos Inline" intrusivos.
3. **Mídias Nativas**: Se `media_url` existir na mensagem, renderizar o visualizador adequado (Imagem ou Áudio).
4. **Filtro Estético de Anexo**: Se uma mensagem for predominantemente a flag bruta de `[ANEXO ENVIADO: X]`, omiti-la no texto para deixar apenas a mídia limpa, caso exista.
5. **Micro-interações (Framer Motion)**: Aplicar layout-animations fluidas. Usar animações de física "spring" nas mensagens, garantindo um "web design vivo".

## 2. User Stories
- **Como Gerente**, eu quero que a nota da IA grude como um post-it na mensagem real que validou a regra, **para que** eu veja de forma cirúrgica o que provou o checklist, sem ruído.
- **Como Gerente**, eu quero reproduzir o áudio enviado pelo mecânico direto no chat do inspetor, **para que** eu consiga atestar a qualidade e cordialidade na fala dele, em vez de ler uma tag solta de "Anexo".

## 3. BDD Scenarios

### Cenário: Exibição Precisa da Nota de Checklist
- **Given (Dado):** O gerente abre a vistoria de um lead e a IA marcou o checklist '1a' na mensagem ID 'msg_xyz'.
- **When (Quando):** A timeline renderiza as mensagens.
- **Then (Então):** A mensagem 'msg_xyz' do cliente ou atendente aparece com uma caixa minimalista conectada à sua base, afirmando "✓ Cordialidade no Atendimento: O atendimento foi conduzido...", e nenhuma outra parte aleatória da tela possui marcações.

### Cenário: Áudio Rico Ocultando Texto Bruto
- **Given (Dado):** O banco de dados envia uma `ChatMessage` contendo conteúdo `[ANEXO ENVIADO: audio]` e uma `media_url` de MP3.
- **When (Quando):** A interface renderiza o balão de chat.
- **Then (Então):** O texto `[ANEXO ENVIADO: audio]` é limpo/ocultado e um player HTML `<audio>` nativo (estilizado fluidamente) aparece no lugar.
