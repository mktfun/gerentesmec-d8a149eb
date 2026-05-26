# Proposal: WhatsApp Monitoring Playbook (v1.1)

## Visão Geral
O projeto tem como objetivo monitorar se os gerentes das unidades estão seguindo as 4 etapas obrigatórias de atendimento no WhatsApp, gerando histórico de 1 mês para depois definir KPIs e metas com o Daniel (Dani o CEO).

Este projeto será construído no repositório `gerentesmec`, adotando a estética e a estrutura limpa e minimalista inspirada no [ConciliaMec](https://conciliamec.lovable.app/), focada em alta conversão, escaneabilidade e micro-interações de 2026.

**Informações do Projeto:**
- **Responsável de execução:** david (Monitor)
- **Stakeholder principal:** Daniel (Dani o CEO)
- **Prazo de implantação:** 10 dias
- **Canal monitorado:** WhatsApp por unidade
- **Tempo máximo de resposta:** 20 minutos

## Requisitos Core (As 4 Etapas)

1. **Etapa 1 — Cordialidade e Registro:** 
   Verificar se o gerente é cordial e se registra no WhatsApp tudo que foi combinado em loja ou por ligação, com a mensagem padrão "Conforme conversamos por telefone, ficou combinado: [itens]".
2. **Etapa 2 — Processo de Orçamento:** 
   O orçamento deve ser enviado por link acompanhado de: vídeo mostrando o defeito, vídeo de efeitos e consequências, e texto explicativo — tudo no mesmo atendimento.
3. **Etapa 3 — Checklist do Mecânico:** 
   Após aprovação do orçamento principal, o gerente deve enviar checklist do mecânico com vídeo e texto identificando outros itens do veículo (objetivo: aumentar ticket médio).
4. **Etapa 4 — Encerramento e Avaliação Google:** 
   Ao final do ciclo, o gerente envia mensagem padrão de encerramento solicitando avaliação no Google. Este dado é cruzável com as avaliações reais recebidas no Google Meu Negócio.

## Dashboard e Métricas (KPIs)
- **Visualização:** Percentual de cumprimento por etapa, por gerente e por unidade.
- **Fase 1 (Atual):** Todas as etapas têm peso igual (1/4 da nota total) para gerar um baseline limpo.
- **Fase 2 (Futuro):** Pesos diferenciados a serem definidos com o Daniel em reunião de KPIs.
- **Rastreabilidade Google:** O sistema deve comparar a quantidade de mensagens de encerramento enviadas (rastreáveis) com o número de avaliações reais recebidas no Google no mesmo período. A diferença sinaliza falha ou atrito.

## Gestão de Unidades e Gerentes
O sistema inclui um módulo de cadastro onde cada gerente é registrado e vinculado à sua respectiva unidade. Isso garante que:
- O dashboard possa ser filtrado por unidade ou por gerente específico.
- As metas e avaliações sejam direcionadas para o responsável correto.

## Configuração e Sincronização (Backstage)
Para otimizar o tempo de avaliação, o monitoramento das conversas é alimentado por uma conexão nativa via API ao Chatwoot. Essa integração atua nos bastidores, configurada de forma discreta para automatizar a checagem das mensagens, garantindo alta performance na apuração sem necessitar de exposição na interface principal do CEO.

## User Stories

- **Como CEO (Daniel),** quero ver um dashboard consolidado mostrando a % de cumprimento de cada gerente por etapa, para saber quem está seguindo o processo.
- **Como Monitor (David),** quero um painel detalhado para auditar atendimentos individuais que caíram na malha fina ou que falharam no tempo de resposta (20 min).
- **Como Monitor (David),** quero cadastrar novas unidades e vincular os gerentes a elas, bem como ajustar silenciosamente o token de conexão do Chatwoot para manter a coleta em dia.
- **Como Gerente de Unidade,** quero ver minha própria pontuação para entender onde estou falhando nas 4 etapas.

## BDD Scenarios

### Cenário: Verificação de Sucesso do Ciclo Completo (100% Compliance)
- **Given (Dado):** Um novo atendimento de cliente no WhatsApp.
- **When (Quando):** O gerente envia a mensagem de registro padrão, o orçamento com vídeos explicativos, o checklist extra do mecânico após aprovação e a solicitação de review no Google no encerramento, todos com intervalo de resposta menor que 20 minutos.
- **Then (Então):** O sistema pontua o atendimento com 100% de compliance e contabiliza 1 review pendente para validação com a API do Google.

### Cenário: Falha no Envio de Vídeos no Orçamento (Etapa 2)
- **Given (Dado):** O gerente iniciou a Etapa 2 de Processo de Orçamento.
- **When (Quando):** O gerente envia o link do orçamento e o texto explicativo, mas esquece de anexar os vídeos do defeito e das consequências.
- **Then (Então):** O atendimento é flagrado com falha na Etapa 2, reduzindo a pontuação geral do gerente e alertando o Monitor.

### Cenário: Rastreabilidade de Review no Google (Etapa 4)
- **Given (Dado):** Uma unidade enviou 10 solicitações de review (Etapa 4 concluída 10 vezes na semana).
- **When (Quando):** O sistema sincroniza com a API do Google Meu Negócio e detecta apenas 3 novas avaliações recebidas no período.
- **Then (Então):** O dashboard da unidade aponta uma discrepância de 7 avaliações, sinalizando possível atrito na conversão final.
