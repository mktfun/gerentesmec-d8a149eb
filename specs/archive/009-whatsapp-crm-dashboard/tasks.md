# Tasks: WhatsApp CRM Dashboard (Executive View)

## Fase 1: Arquitetura de UI e Dashboard Executivo (Daniel's View)
- [ ] Restaurar o projeto React para uma estética "Light Mode Clean" (estilo Lovable/ConciliaMec), usando um fundo claro (`bg-slate-50`).
- [ ] Criar Layout Global `DashboardLayout.tsx` contendo um Sidebar Menu moderno e responsivo à esquerda e um topo com saudação ("Olá, Daniel").
- [ ] Implementar a página `Index.tsx` (rota `/`) como o Dashboard Principal:
  - Cards superiores de resumo (Total de Leads, Média Global de Qualidade, Leads em Alerta).
  - Componente de Gráfico de Barras ou Linhas animado (usando Recharts) mostrando a evolução do Score da semana.
  - Componente de Ranking (`RankingList.tsx`) listando as oficinas e seus gerentes em ordem de melhor score, com mini barras de progresso animadas (Framer Motion).
- [ ] Criar Mock Data JSON rico o suficiente para popular a visão macro do Dashboard de forma convincente.

## Fase 2: Módulo CRM e Auditoria Granular (João's View)
- [ ] Criar a página de CRM (`/crm`), acessível via Sidebar.
- [ ] Desenvolver a Lista/Grid de Conversas ativas e passadas. Cada linha ou card deve ser muito clean, mostrando o status SLA e um botão "Auditar".
- [ ] Construir o Componente `AuditPanel.tsx` (deslizando lateralmente ou Modal).
- [ ] Implementar os Checklists Granulares usando `Accordion` do Shadcn:
  - Etapa 1: Checkbox "Cordial?" + Checkbox "Registrou?". (Vale 12.5% cada)
  - Etapa 2: Checkbox "Orçamento?" + "Vídeo?" + "Texto Efeitos?". (Vale ~8.33% cada)
  - Etapa 3: Checkbox "Checklist Mecânico?" + "Vídeo?" + "Texto?". (Vale ~8.33% cada)
  - Etapa 4: Checkbox "Agradeceu?" + "Pediu Review?". (Vale 12.5% cada)
- [ ] Criar o componente `EvidenceUploader.tsx`: Área de arrastar e soltar (Dropzone) para uploads de imagens/prints e um Textarea para as anotações textuais atreladas àquela avaliação.
- [ ] Calcular dinamicamente o Score fracionado em tempo real e exibi-lo no painel.

## Fase 3: Detalhes e "Vida" (Micro-interações)
- [ ] Revisar todos os botões e links para garantir efeitos `hover` sutis.
- [ ] Garantir que números nos cards de topo façam "Count Up" (animem de 0 até o valor real).
- [ ] Adicionar transições de página usando Framer Motion entre o Dashboard e o CRM.
- [ ] Ajustar espaçamentos, tipografia (peso das fontes) e bordas arredondadas para refletir o design premium desejado.

## Fase 4: Integração com Backend Supabase (Apenas após Frontend OK)
- [ ] Criar/atualizar migrações no banco para consolidar o modelo de dados de Auditoria atrelado a ciclos de conversa.
- [ ] Sincronizar UI com chamadas reais do Supabase.
