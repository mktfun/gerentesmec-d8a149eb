# Proposal: CRM Search + Webhook Fix + Número Duplicado em Unidades

## Contexto

Três problemas identificados pelo usuário:

1. **BUG CRÍTICO:** O webhook `chatwoot-webhook` parou de salvar mensagens no banco. Chatwoot recebe normalmente, mas nenhuma mensagem nova é salva há 2h+.

2. **Feature:** Barra de pesquisa global no CRM — por nome ou número de telefone, com escopo global ou apenas na pipeline/unidade atual.

3. **Feature:** Detecção de número de telefone duplicado entre unidades — quando duas lojas estão configuradas com o mesmo número, o sistema deve alertar.

---

## Bug: Webhook não salva mensagens

### Causa Raiz Identificada

A tabela `units` possui apenas as colunas: `id`, `name`, `created_at`, `chatwoot_inbox_id`.

O webhook na linha 90 faz:
```typescript
const { data: ignoreUnit } = await supabase.from('units').select('id').eq('phone', contactPhone).maybeSingle();
```

A coluna `phone` **não existe** em `units`. Isso gera um erro 400 silencioso do PostgREST. O código não verifica `error`, então `ignoreUnit` fica `null` e a execução continua normalmente.

**O bug real está em outro lugar:** O problema mais provável é que o **`chatwoot_inbox_id` das units está NULL** ou não está mapeado — logo, a query na linha 120-129 não encontra nenhuma `unit` e retorna "Unmapped unit" para TODAS as conversas.

### Fix

1. Remover a query com `.eq('phone', ...)` (coluna inexistente)  
2. Adicionar logs de diagnóstico temporários no webhook
3. Verificar se as units têm `chatwoot_inbox_id` preenchido
4. Garantir que o `inboxId` está sendo extraído corretamente do payload Chatwoot para `message_created`

---

## Feature 1: Barra de Pesquisa no CRM

### Requisitos
- Input de pesquisa posicionado **entre** o botão "Novo Atendimento" (direita) e os botões de toggle de view (esquerda)
- Pesquisa em tempo real (debounce 200ms) por:
  - Nome do cliente (`customer_name`)
  - Número de telefone (`customer_phone`)
- Dois modos:
  - **Global:** busca em todos os leads independente da unidade selecionada
  - **Pipeline:** busca apenas nos leads da unidade/filtro atual
- Ícone de lupa + placeholder "Buscar por nome ou número..."
- Quando pesquisa está ativa: o UnitSwitcher fica visível mas a busca sobrepõe o filtro

### BDD Scenarios

#### Cenário: Busca global por número
- **Dado** que existem leads de múltiplas unidades
- **Quando** o usuário digita um número de telefone na barra de pesquisa
- **Então** são exibidos todos os leads com aquele número, independente da unidade selecionada, com destaque visual no resultado

#### Cenário: Busca filtrada pela pipeline atual
- **Dado** que o usuário tem a unidade "Loja A" selecionada no UnitSwitcher
- **Quando** digita um nome na busca
- **Então** apenas leads da Loja A que correspondem ao nome são exibidos

#### Cenário: Limpar pesquisa
- **Dado** que uma pesquisa está ativa
- **Quando** o usuário clica no X ou apaga o texto
- **Então** a view volta ao estado anterior (pipeline/lista normal)

---

## Feature 2: Detecção de Número Duplicado em Unidades

### Requisitos
- Cada unidade pode ter um número de WhatsApp (campo `chatwoot_inbox_id` mapeia para um inbox do Chatwoot)
- O sistema deve **detectar e avisar** se dois inboxes mapeados pertencem ao mesmo número de telefone no Chatwoot
- O alerta deve aparecer na tela de **Configurações** na seção de Unidades
- O warning deve ser inline, não um modal bloqueante

### BDD Scenarios

#### Cenário: Número duplicado detectado
- **Dado** que duas unidades estão mapeadas para inboxes do Chatwoot com o mesmo número de WhatsApp
- **Quando** o usuário acessa a tela de Configurações
- **Então** um aviso amarelo aparece: "Atenção: as unidades X e Y estão usando o mesmo número de telefone. Isso pode causar conflitos de atribuição."

---

## Escopo Técnico

### Fix Webhook
- `supabase/functions/chatwoot-webhook/index.ts`:
  - Remover query com coluna `phone` inexistente
  - Adicionar `console.log` no início da execução e nos pontos de saída
  - Garantir que `inboxId` de `message_created` é `payload.inbox_id` (não `payload.inbox?.id`)

### CRM Search
- `src/pages/Crm.tsx`:
  - Estado `searchQuery: string`
  - Lógica de filtragem: `filteredBySearch` sobrepõe `filteredLeads`
  - UI inline no topbar entre os elementos existentes
  - Botão X para limpar + ícone de lupa

### Número Duplicado
- `src/pages/Config.tsx`:
  - Ao carregar os inboxes do Chatwoot, comparar `chatwoot_inbox_id` entre unidades
  - Se duplicado, renderizar badge de warning na seção de Unidades

---

## Tasks (para /vibe-apply)

Ver `tasks.md`.
