# Research: WhatsApp Monitoring v2 (Surdina / João & Dani)

## Contexto e Lacunas
O usuário (João) ficou extremamente insatisfeito com a implementação anterior (v1). As principais lacunas identificadas foram:
1. **Exposição Indevida:** A tela foi exposta como um dashboard principal. O usuário quer que o sistema rode "na surdina" para ajudá-lo a monitorar sem que outras pessoas da empresa (incluindo o chefe Daniel, inicialmente, ou os gerentes) tenham acesso explícito ao painel principal até que o modelo esteja validado.
2. **Design e UX Impróprios:** O usuário detestou o formato de tabela simples ("a merda mais feia que eu ja vi"). Ele deseja algo mais profundo, que permita abrir cada unidade, visualizar um histórico de anotações e provas documentais (vídeos, textos), em um formato mais visual como **Kanban**.
3. **Métrica de Avaliação Incorreta:** O sistema deve calcular uma pontuação de 0 a 100 baseada no cumprimento das etapas, onde, no momento inicial, todas as etapas têm o **mesmo peso**.
4. **Fidelidade ao Processo Transcrito:** As etapas não refletiam com exatidão a transcrição do áudio/reunião.

## Transcrição do Processo (Regras de Negócio Core)

O monitoramento se divide nas seguintes etapas de avaliação para gerar o **Score do Gerente (0 a 100)**:

*   **Etapa 1: Cordialidade e Registro**
    *   Verificar a cordialidade no atendimento.
    *   Verificar se o gerente está transferindo para o WhatsApp (deixando registrado por escrito) tudo o que foi acordado em loja física ou por ligação. Exemplo: "Conforme conversamos por telefone..."
*   **Etapa 2: Aderência ao Processo (Orçamento Principal)**
    *   Verificar se o orçamento está sendo enviado por link.
    *   Obrigatório: Vídeo mostrando o defeito.
    *   Obrigatório: Texto explicativo com efeitos e consequências (o porquê da troca e os riscos de não fazer).
*   **Etapa 3: Orçamento Complementar (Checklist do Mecânico)**
    *   Após a aprovação do orçamento principal, o gerente deve enviar um checklist do que *mais* precisa ser feito no veículo para aumentar o ticket.
    *   Obrigatório: Vídeo e texto explicativo deste orçamento complementar.
*   **Etapa 4: Relacionamento e Google Reviews**
    *   No final do atendimento, enviar uma mensagem padrão de agradecimento e solicitação de avaliação no Google.
    *   Auditoria: Comparar a quantidade de mensagens de "Etapa 4" enviadas vs. a quantidade de avaliações reais que caíram no Google Meu Negócio daquela unidade para achar a discrepância.

## Intervenção e SLA (Segunda Fase do Monitoramento)
*   **Tempo de Resposta (Lead Quente):** O tempo máximo de resposta sem esfriar o lead é de **20 minutos** (limite tolerável debatido: 30m, mas 20m é a meta).
*   **Tempo de Resposta (Pós-Venda/Reclamação):** Se um cliente reclamar ou voltar, não pode ficar sem resposta (ex: relato de 2 dias sem resposta no Jorge Bereta).
*   **Ação do Monitor:** Se o gerente bater 20 minutos sem responder, ou ignorar um cliente, o monitor deve intervir no lead para salvar a venda/evitar reclamação. Intervenções bem sucedidas gerarão bônus ao monitor (João/Agência).

## Estratégia de UI/UX (Clean, Minimalista e Viva)
*   **Oculto (Stealth Extremo):** O acesso a este painel deve ser via rota escondida (ex: `/hermes-vault` ou atalho de teclado). NENHUMA menção a "Chatwoot", "Monitoramento" ou palavras do tipo na tela principal (Index). Deve parecer uma página normal e limpa.
*   **Design ConciliaMec (Elevado):** Basear-se rigorosamente na paleta e visual do `conciliamec.lovable.app`, mas com foco massivo em **micro-interações**. O app precisa parecer "vivo": botões suaves, números animando, cards flutuando em transições, hover states e animações de layout na montagem da tela. Atenção aos mínimos detalhes.
*   **Visão Kanban por Unidade:** Uma interface onde cada "Card" é um atendimento/cliente ativo. As colunas podem ser as Etapas (1, 2, 3, 4) ou os Status do Lead (Aguardando Resposta, Em Atendimento, Concluído, Em Risco).
*   **Drill-down Profile:** Ao clicar em uma Unidade ou Card, abre-se a visão profunda: Score geral animado, lista de gerentes, histórico de conversas, proofs (provas: links de vídeos capturados) e anotações do auditor.

## Arquitetura de Integração (Chatwoot)
Como a ferramenta oficial deles é o Chatwoot e não permite exportação fácil para IA, a automação fará a extração via API do Chatwoot em background, populando o Supabase para que a visualização Kanban tenha os dados prontos.
