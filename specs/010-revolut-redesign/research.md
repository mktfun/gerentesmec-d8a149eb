# Research: Redesign Visual Revolut-Inspired — GerêntesMec CRM

## ID da Feature
`010-revolut-redesign`

## Estado Atual (Auditoria Visual)

### Problemas identificados nas 3 telas capturadas:

**Dashboard (tela 1):**
- Cards muito simples e "burocrático"
- Gráfico sem personalidade — apenas uma área azul genérica
- Ranking sem peso visual — só texto e barras finais
- Sidebar sem identidade visual, parece um SaaS genérico de 2019
- Zero glassmorphism, zero dark mode, zero animações reais
- Não há informação de *tempo real* (horário, dia, última atualização)
- Não comunica urgência de forma visual forte

**CRM / Auditoria (tela 2):**
- Lista plana sem separação visual por unidade, status ou urgência
- Impossível escanear quem está em perigo sem ler cada linha
- Não existe agrupamento por coluna de status (apenas texto "SLA Estourado")
- Ausência de cor em cada linha para diferenciar visualmente o estado
- Painel lateral de auditoria não existe ainda visível simultaneamente

**Gerentes (tela 3):**
- **Página 404** — não existe ainda

## Benchmarking: Revolut Design Language

Analisando as imagens do Revolut compartilhadas:

### Fundamentos Visuais do Revolut
1. **Dark-first**: Background quase preto (`#0d0d12` aproximado). Nunca cinza genérico.
2. **Glassmorphism em cards**: Cards translúcidos com `backdrop-blur`, bordas `border-white/5` a `border-white/10`.
3. **Tipografia heroica**: Números grandes (`font-black` enorme, tipo £2,420.39). A *métrica* é o herói.
4. **Botões de ação em grid**: Quick actions em botões circulares pequenos com ícone + label abaixo. Não botões grandes retangulares.
5. **Lista de itens limpa e densa**: Cada item tem ícone colorido (avatar/logo), título, subtítulo (hora), valor alinhado à direita.
6. **Indicadores de variação**: Verde para positivo (▲), vermelho para negativo (▼), com valor percentual.
7. **Barra de navegação inferior** no mobile / **sidebar compacta** no desktop com ícones pequenos.
8. **Fundos com textura/gradiente**: Imagem desfocada no card principal (os "fundos" do Revolut usam arte).
9. **Transições de Spring**: Elementos surgem com spring physics, não ease linear.
10. **Microinterações em tudo**: Todo toque/clique tem feedback háptico visual.

## Adaptação para o GerentesMec

| Elemento Revolut | Adaptação GerentesMec |
|---|---|
| `£2,420.39` heroico | Score global `78.5%` gigante em destaque |
| Lista de transações | Lista de atendimentos por gerente (com tempo, status) |
| Botões de ação circular | Ações rápidas: "Auditar", "Intervir", "Ver Unidade" |
| Indicador ▲▼ | Indicador de score semanal (subindo/caindo) |
| Múltiplas abas (Invest, Crypto, etc.) | Tabs: Todos / Esperando / Atrasados / Concluídos |
| Bottom nav (mobile) | Sidebar com ícones + labels (desktop) |
| Fundo com textura artística | Fundo dark com orbs de luz (gradiente difuso) |
| Card de conta com blur | Card de Unidade com blur e score |

## Stack Técnico Existente
- React 18 + TypeScript + Vite
- Tailwind CSS v3
- Shadcn UI (Accordion, Checkbox, Sheet, etc.)
- framer-motion v11
- recharts v2
- lucide-react
- react-router-dom v6
