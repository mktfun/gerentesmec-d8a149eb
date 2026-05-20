# Research: WhatsApp CRM & Dashboard (Visão Executiva Daniel)

## Contexto e Lacunas
O usuário corrigiu uma interpretação anterior. O projeto NÃO deve ser apenas um "Kanban escondido". O projeto é, na verdade, um **CRM/ERP completo**.
A expressão "na surdina" referia-se à forma como os dados são extraídos: a inteligência (o sistema) deve conectar ao Chatwoot **escondido/em background** sem que os gerentes precisem usar um sistema novo. Os gerentes continuam no WhatsApp/Chatwoot, e o nosso sistema puxa tudo "na surdina" para preencher o Banco de Dados.
O frontend a ser construído é o **Dashboard Principal para o Daniel (CEO/Chefe)** ter a visão clara e analítica de como os gerentes de cada unidade de mecânica estão operando.

## Requisitos de UX/UI
- **Inspiração Absoluta:** O design clean e minimalista do `https://conciliamec.lovable.app/`.
- **Natureza do Sistema:** Alto nível corporativo, limpo, focado em dados (Data-heavy), mas com respiração (white space) e tipografia primorosa.
- **Animações e Vida:** O app deve parecer "vivo". Micro-interações, hover nos cards de gerentes, números crescendo ao carregar a página, gráficos com fade-in suave.

## Core Business (O que o Daniel quer ver)
O Daniel precisa entrar no sistema e bater o olho para saber:
1. **Ranking/Score por Unidade:** Qual mecânica (Jabaquara, Dom Pedro, etc.) está performando melhor nas 4 etapas obrigatórias.
2. **Score Individual por Gerente:** A nota de 0 a 100 de cada vendedor/gerente.
3. **Database de Conversas:** Uma visão CRM/Auditoria (aqui entra o Kanban e a lista de auditorias) onde o auditor (João) pode entrar, ler o que foi sincronizado do Chatwoot e marcar se o gerente fez ou não o checklist.
4. **Alarme de SLA:** Leads sem resposta há mais de 20 minutos (para intervenção).
