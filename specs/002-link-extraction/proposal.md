# Proposta: Otimização de Extração de Dados de Links (Feature 002)

## 1. Requisitos
1. **Obrigatoriedade de Agente:** A extração automática de dados dos links só deve ser disparada quando o remetente for do tipo Gerente (`sender_type !== 'contact'`).
2. **Desempenho Otimizado:** Evitar timeouts na raspagem de links de orçamentos (como sistemas do tipo Oficina Integrada, etc) aumentando o tempo limite da requisição do Jina Reader.
3. **Extração Agnóstica:** Qualquer tipo de URL enviada pelo gerente deve ser lida via Jina Reader para puxar o conteúdo textual em Markdown (orçamentos, checklists digitais, peças).
4. **Alimentação da Memória:** O conteúdo extraído deve ser repassado ao modelo na variável `scrapedContent` como contexto primário para tomada de decisão no Score.

## 2. User Stories
- **Como gerente de oficina**, eu quero que ao enviar qualquer link de orçamento ou peça para o cliente no WhatsApp, a IA abra o link e leia o conteúdo dele em tempo real, **para que** a nota da minha auditoria seja precisa e leve em conta os itens que ofereci no PDF/site, sem precisar que eu os descreva em texto.
- **Como dono da oficina (pagador da conta da IA)**, eu quero que a IA ignore completamente e não abra os links que os clientes (motoristas) mandam, **para que** o processamento seja rápido, evite ler lixo da web enviado por cliente e economize consumo de tokens na minha API.

## 3. BDD Scenarios

### Cenário: Cliente envia um link aleatório
- **Given (Dado):** O lead está na etapa `negotiation`.
- **When (Quando):** O cliente (`contact`) envia a mensagem "Vê esse link de peça no mercado livre: https://produto.mercadolivre.com.br/123".
- **Then (Então):** O sistema deve reconhecer que a mensagem é do cliente, NÃO executar a rotina do Jina Reader, manter o `scrapedContent` vazio e economizar tokens.

### Cenário: Gerente envia um link de orçamento online
- **Given (Dado):** O lead está na etapa `negotiation` aguardando preço.
- **When (Quando):** O gerente (`attendant`) envia a mensagem "Aprovado chefe! O checklist completo das peças + foto tá nesse link: https://oficinadigital.com/orc/999".
- **Then (Então):** O sistema detecta o link e o remetente, extrai os dados via `r.jina.ai`, constrói o `scrapedContent` e passa os dados das peças no prompt para o LLM mudar o funil para `quote` e dar nota 10 no requisito `2a` (Enviou Orçamento).

## 4. Critérios de Aceite
- [ ] A lógica de scraping `urlRegex` roda `if (sender_type !== 'contact')`.
- [ ] O Timeout do `fetch` do Jina Reader passa de 5.000ms para 12.000ms.
