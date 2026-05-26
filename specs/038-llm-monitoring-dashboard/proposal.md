# Proposal: LLM Monitoring Dashboard

## Objetivo
Prover à gestão (e ao administrador do sistema) a capacidade de monitorar o consumo das APIs de IA, exibindo métricas de saúde, custos operacionais indiretos (limites de tier gratuito vs pagante) e rastreabilidade total de erros em tempo real.

## Escopo
- **Tabela `llm_usage_logs`**: Coletar metadados das chamadas disparadas pela IA autônoma (Avaliador e Roteador).
- **Componente de Dashboard (Frontend)**: Interface robusta localizada dentro das Configurações da IA, apresentando painéis organizados por Provedor.
- **Log Viewer**: Lista paginável/filtrável das últimas chamadas feitas para debug e verificação de erros.

## BDD Scenarios

### Cenário: Exibição de Limites do Provedor Ativo
- **Given (Dado):** O sistema está utilizando o provedor `Google Vertex AI` com limite de 15 RPM.
- **When (Quando):** O gerente acessa a aba "Observabilidade" nas configurações da IA.
- **Then (Então):** Ele vê um card temático do Vertex AI (Azul Escuro), com uma barra de progresso preenchida baseada no número de requisições disparadas no último minuto, e o gráfico de taxa de sucesso ao lado.

### Cenário: Tracing de Falhas na API (Ex: Limite excedido ou billing negado)
- **Given (Dado):** A conta de serviço falhou com erro 500 (Lightning dunning decision).
- **When (Quando):** O gerente clica na aba de "Logs Recentes".
- **Then (Então):** A tabela lista o horário exato, o modelo acionado, o status visual em formato de badge (`Falha`) e o payload do erro para rápido debug.

### Cenário: Troca de Provedor reflete na UI de Monitoramento
- **Given (Dado):** O gerente estava acompanhando métricas da OpenAI e resolve mudar para NVIDIA NIM.
- **When (Quando):** Ele aplica a modificação.
- **Then (Então):** A tela de monitoramento instantaneamente foca o contexto visual e os painéis de limites para o `NVIDIA NIM` (Verde Neon), resetando os mostradores de RPM ativos para a nova API.
