# Feature 008 - AI Settings & Engineering Logs

## Requisitos
1. **Ocultação da IA**: A interface do `AiRouterConfig` (onde define-se Provider, Modelo, API Key e acompanha-se Telemetria) deve ser completamente removida da visão padrão da página de `Configurações`. Tudo isso deve existir APENAS dentro do modal `AdvancedAiPanel` (Acesso de Engenharia).
2. **Correção do "Salvar Configuração"**: O banco deve salvar a API key, Modelo e Provedor corretamente. O estado do React deve receber optimistic updates.
3. **Novos Modelos**: Incluir "gemini-2.5-flash", "gemini-2.5-flash-8b", "gemma-2", "gemma-3" nativos na lista do provider Google/Vertex.
4. **Logs Detalhados (Telemetria Premium)**: A tabela `llm_usage_logs` e a visualização no Frontend devem suportar o registro do Texto de Input (Prompt enviado), Texto de Output (Resposta da IA formatada contendo pensamento e ação) e Tokens Restantes (quota do modelo).

## BDD Scenarios

### Cenário: Configurando a IA ocultamente
- **Given (Dado):** O gerente de unidade abre a página de Configurações
- **When (Quando):** Ele rola a página inteira
- **Then (Então):** Ele não vê nenhuma menção à provedores de IA (Google, OpenAI, API Keys).
- **When (Quando):** Ele clica no botão quase invisível "Acesso de Engenharia"
- **Then (Então):** O modal de Acesso de Engenharia se abre, contendo a interface completa de `AiRouterConfig` e telemetria.

### Cenário: Salvando o modelo da IA
- **Given (Dado):** O administrador está no Acesso de Engenharia
- **When (Quando):** Ele seleciona o modelo `gemini-2.5-flash`, insere uma API Key e testa/salva
- **Then (Então):** As informações persistem no banco de dados, o hook `useAppData` é atualizado na mesma hora sem necessidade de recarregar a tela, e nas próximas aberturas a seleção se mantém.

### Cenário: Visualizando os rastros da IA
- **Given (Dado):** Ocorreu uma auditoria de qualidade feita pela IA
- **When (Quando):** O administrador acessa a guia "Métricas & Telemetria" no Acesso de Engenharia e clica no log de SUCESSO
- **Then (Então):** Abre-se um modal detalhado (Lightbox) mostrando o Prompt exato que foi enviado para a IA, os Tokens processados e o Texto cru (markdown formatado) que a IA retornou, para debugging preciso.
