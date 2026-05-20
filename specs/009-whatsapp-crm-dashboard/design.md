# Design Document: WhatsApp CRM Dashboard (Executive View)

## 1. UX/UI Architecture (Stitch MCP + UX 2026)
O design deixará o conceito exclusivo de "Kanban Escuro Furtivo" e se tornará um autêntico Dashboard Executivo SaaS B2B, inspirado puramente no visual de `conciliamec.lovable.app`. 

### Estética Visual e Interação (ConciliaMec Style & O App "Vivo")
- **Vibe:** Clean, corporativo, iluminado (Light Mode nativo preferencial) e altamente profissional.
- **Paleta de Cores:** Fundo principal quase branco (`slate-50` ou cinza muito suave), cards e painéis totalmente brancos com sombras esparsas e suaves (`shadow-sm`, `shadow-md` pontuais). Cores de destaque: Tons de azul royal (`blue-600` a `blue-400`) para ações primárias e esmeralda (`emerald-500`) para status positivos.
- **Tipografia:** Fonte Sans moderna (Inter ou similar do Tailwind/Google), com forte uso de pesos para contraste (ex: Nomes grandes em `font-bold` acompanhados de legendas em `text-xs text-slate-500`). Muito *whitespace* (espaçamento respirável).
- **Animações e Micro-interações:**
  - O sistema usará `framer-motion` para parecer "vivo".
  - Gráficos animam do zero ao carregar a página (crescimento de barras).
  - Score circular de avaliação fará animação fluída e contagem numérica crescente.
  - Sidebar elegante e animada, com ícones (Lucide React) realçando sutilmente no hover.

### Estrutura de Rotas e Telas
- **`/` (Dashboard Executivo):** Tela principal para o Daniel.
  - Header: Boas-vindas.
  - Top Cards: Média global de pontuação da empresa, SLAs estourados hoje.
  - Conteúdo Central: Tabelas ou Cards mostrando o Ranking das Unidades e dos Gerentes (com pequenas barras de progresso ao lado das notas).
- **`/crm` (CRM / Auditoria):** Tela para o João trabalhar.
  - Uma view dividida. Lado esquerdo: Lista de conversas/leads (podendo até ser um Kanban limpo e claro).
  - Lado direito (Drill-down): Formulário de Auditoria Avançado.
    - **Checklists Granulares (Accordions):** Cada uma das 4 Etapas abre um sanfona (accordion) revelando seus sub-itens de checklist (ex: Etapa 1 revela "Foi Cordial?" e "Registrou no WhatsApp?").
    - **Área de Provas (Evidence Upload):** Abaixo de cada etapa ou no final do formulário, uma Dropzone para upload de imagens/arquivos (ou colar URLs) e um bloco de anotações (Textarea) para gerar o "Dossiê".

## 2. Banco de Dados (Supabase MCP)
As regras do banco mantêm a essência, mas adicionaremos hierarquias mais claras.
- **`units`:** As oficinas (ex: Dom Pedro, Jabaquara).
- **`managers`:** Os gerentes atrelados a unidades.
- **`whatsapp_cycles`:** As conversas individuais.
  - Novas colunas (ou existentes revisadas): `lead_name`, `wait_time_minutes`, `status` (`waiting_reply`, `in_progress`, `closed`), `calculated_score`.
- **`audits` (Novo):** Tabela que centraliza as auditorias feitas pelo João, ligada ao `cycle_id`.
- **`audit_steps` (Novo):** Tabela relacional detalhando QUAIS sub-itens o auditor marcou em cada etapa.
- **`audit_evidences` (Novo):** Tabela para armazenar as URLs de Storage (imagens) e as anotações textuais vinculadas a uma auditoria.

## 3. Estratégia de Implementação (Frontend-First Local)
Antes de configurar o backend real, o projeto será 100% desenvolvido usando **Mock Data (JSON local)**. A UI será polida exaustivamente na máquina do usuário, refinando cada pixel, sombra, fonte e animação, para que o "Dashboard do Daniel" fique tão impressionante quanto o link de referência. Apenas após a aprovação visual final do frontend local integraremos com o banco de dados.
