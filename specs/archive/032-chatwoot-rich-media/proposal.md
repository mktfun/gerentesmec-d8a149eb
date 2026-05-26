# Proposal: Mídia Rica e Preparação para IA (Áudio, Vídeo e Imagem)

## Objetivos
1. Capturar links de Imagens, Áudios, Vídeos enviados pelo Chatwoot no webhook e salvar no nosso banco de dados.
2. Renderizar uma interface rica no CRM (imagens com zoom, players de áudio e vídeo).
3. Transformar áudios em Texto automaticamente para que as IAs futuras consigam auditar.
4. **Respeitar o Provedor de IA Configurado**: Utilizar inteligentemente o provider (OpenAI, Gemini, Groq) e o modelo selecionado pelo gerente na tela de Configurações, verificando suas capacidades nativas antes de processar as transcrições e imagens.

## User Stories
1. Como Diretor, quero que meu Robô Auditor consiga ler a transcrição dos áudios que os vendedores mandam, para que não haja "pontos cegos" na auditoria de orçamentos.
2. Como Administrador, se eu selecionei o "Gemini 1.5 Pro" e coloquei minha chave na tela de Configurações, quero que o sistema use automaticamente a API do Google para transcrever meus áudios, não me forçando a usar a OpenAI.
3. Como Gerente, ao abrir o Dossiê de um lead, quero ver a foto da peça que ele mandou e ouvir o áudio direto no CRM.

## BDD Scenarios

### Cenário: Transcrição Dinâmica Inteligente
- **Dado** que o webhook recebeu um áudio do cliente e o banco está configurado com o Provider "Groq" e chave de API válida.
- **Quando** a rotina de transcrição for acionada.
- **Então** ela vai verificar que a Groq suporta transcrição (modelo `whisper-large-v3`), vai processar o áudio com altíssima velocidade e injetar no banco `[🎙️ Áudio Transcrito: via Groq]`.

### Cenário: Processamento Multimodal (Gemini/OpenAI)
- **Dado** que a configuração de IA atual do sistema aponta para `gemini-1.5-flash`.
- **Quando** a transcrição de áudio ou a auditoria de imagens ocorrer.
- **Então** o sistema alimentará a mídia (Áudio ou Imagem) nativamente na API do Google Generative AI, economizando chamadas desnecessárias e usando o que já está configurado.
