# Proposal: 002-ai-autonomy

## 1. Visão Geral
Transformar o CRM em um sistema verdadeiramente **autônomo**. A IA atuará como um gerente invisível: lendo mensagens que chegam via webhook, julgando a cordialidade, pontuando os leads, estimando o valor do ticket, movendo o lead entre os estágios do funil (Pipeline) e gerando o resumo final. Tudo isso sob uma arquitetura de **Altíssima Eficiência de Custos (Cost-Efficient AI)**, utilizando Cache Semântico, Compressão de Prompt e Vetorização (pgvector) para evitar o desperdício de tokens.

## 2. Requisitos e Escopo
- **Automação de Pipeline e Score:** A IA deve analisar a conversa e preencher o `AuditPanel` automaticamente, além de atualizar o `ticket_value` e mover o `funnel_stage`.
- **Configuração de IA Segura e Oculta:** Na tela de Configurações, adicionar um botão sutil (design minimalista) no final da página que abre um painel avançado (modal/slide-over). Nesse painel, o usuário poderá editar:
  - O System Prompt e os Critérios de Avaliação.
  - Ativação de análise de Áudio/Imagem/Vídeo.
  - Modelos a serem usados (Routing).
- **Economia de Tokens (RAG & Cache):**
  - Implementar **Semantic Caching** com `pgvector` para respostas repetitivas.
  - Implementar **Pré-processamento Determinístico**: ignorar mensagens curtas ("ok", "valeu", emojis) sem gastar tokens.
  - Implementar **Prompt Compression & Memoization**: Em vez de enviar o histórico inteiro cru a cada nova mensagem, a IA manterá um "resumo comprimido" (Memória do Lead) que é atualizado incrementalmente.

## 3. User Stories
- **Como gerente da agência**, quero que a IA avalie os atendimentos automaticamente com base nas minhas regras, para que eu não precise preencher checklists manualmente.
- **Como engenheiro de automação**, quero que o painel de configurações de IA seja escondido dos gerentes de unidade, acessível apenas por um botão sutil, permitindo ajustes finos de prompt e modelos.
- **Como financiador do projeto**, quero que a arquitetura economize tokens usando RAG, Cache Vetorial e compressão, para que eu não pague fortunas à OpenAI/Google por análises redundantes.

## 4. BDD Scenarios

### Cenário: Atualização de Configuração Avançada de IA
- **Given (Dado):** O usuário está na tela de `Config`.
- **When (Quando):** Ele rola até o final e clica no botão sutil "Advanced AI Engine".
- **Then (Então):** Um painel *Liquid Glass* desliza revelando os campos de Prompt, JSON de Critérios, Toggles de Mídia (Áudio/Visão) e Configuração de Embeddings.

### Cenário: Filtragem Determinística (Economia de Tokens)
- **Given (Dado):** O webhook recebe uma nova mensagem do lead dizendo apenas "Obrigado!".
- **When (Quando):** O script de pré-processamento avalia o tamanho e conteúdo da mensagem.
- **Then (Então):** A mensagem é salva no banco, mas a IA analítica NÃO é acionada, economizando 100% dos tokens dessa iteração.

### Cenário: Avaliação Autônoma com Compressão de Histórico
- **Given (Dado):** Um gerente envia um orçamento em PDF e o lead responde aprovando.
- **When (Quando):** A Edge Function é acionada via Webhook.
- **Then (Então):** O sistema busca o "Resumo Atual do Lead" (ao invés de todo o histórico cru), combina com a nova mensagem, envia ao modelo (Gemini), e o modelo atualiza o Score para 100%, define o valor do ticket e move o lead para "Fechado Ganho".
