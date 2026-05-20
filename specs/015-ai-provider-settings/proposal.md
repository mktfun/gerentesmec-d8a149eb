# Proposal: Dynamic AI Provider Settings (015)

## 1. Requisitos do Sistema

### 1.1 Painel de Configurações de IA (`/config`)
- Criar a página de configurações focada no "Motor de IA" do Agente Auditor.
- Dropdown para selecionar o Provider (OpenAI, Anthropic, OpenRouter).
- Input de texto dinâmico para preencher o Modelo (ex: `gpt-4o-2024-05-13`, `claude-3-opus-20240229`).
- Input seguro (tipo password) para a API Key.

### 1.2 Módulo Multimodal
- Checkboxes/Switches elegantes para habilitar capacidades visuais e auditivas do Agente:
  - "Análise de Imagens (Orçamentos em PDF/Foto)"
  - "Análise de Vídeos (Checklist do Mecânico)"
  - "Transcrição de Áudios (Mensagens de Voz do Cliente)"
- Ao ativar vídeo/áudio, mostrar um alerta sutil informando que requer modelos específicos (ex: GPT-4o, Gemini 1.5 Pro).

### 1.3 Botão de Teste de Conexão
- Botão "Testar Provedor" que valida se a API Key fornecida está ativa. (No cenário atual mockado, ele simulará um delay e dará sucesso se os campos estiverem preenchidos).

## 2. User Stories

1. **Como CEO (Daniel)**, quero acessar as Configurações e colar a minha própria API Key da OpenAI, para não depender de um servidor de terceiros travando meus limites.
2. **Como CEO**, quero mudar para um modelo mais barato via OpenRouter nos finais de semana, apenas trocando o nome do modelo em um campo de texto fácil de usar.
3. **Como CEO**, quero ativar a "Auditoria de Áudio" com um clique, para que a IA escute os áudios enviados pelos mecânicos para avaliar se foram cordiais.

## 3. BDD Scenarios

### Cenário: Configuração de Novo Provedor
- **Given:** O usuário está na tela `/config`.
- **When:** Ele seleciona "OpenRouter", digita `meta-llama/llama-3-70b-instruct` e cola uma API Key.
- **And:** Ele clica em "Salvar & Testar".
- **Then:** O sistema exibe um spinner (loading) elegante, e após 1 segundo um toast de "Conexão Estabelecida com Sucesso", salvando os dados no contexto.
