# Design & Componentização

## Reuso do Componente `AuditPanel`
Na página `Relatorios.tsx`, o modal `Global Audit Panel Overlay` atualmente usa apenas o `ChatHistoryView`:
```tsx
  <ChatHistoryView 
    lead={selectedLead} 
    messages={modalMessages}
    isLoading={isLoadingMessages} 
  />
```

No entanto, o componente pai/completo que embute tanto o chat à esquerda quanto as pontuações e opções de salvamento à direita é o `AuditPanel`. O `AuditPanel` inclusive lida com a sua própria requisição de mensagens do chat internamente via Supabase e Realtime, tornando desnecessário injetar mensagens nele de cima para baixo.

Dessa forma, trocaremos essa renderização por:
```tsx
  <AuditPanel 
    lead={selectedLead} 
    onClose={() => setSelectedLeadId(null)} 
  />
```

## Ajuste de Layout (Largura)
Em `Relatorios.tsx`, a div container é `md:w-[600px]`.
Como o `AuditPanel` tem duas colunas (chat e painel lateral), precisamos dar mais espaço horizontal, semelhante à forma como é feito em `Crm.tsx`. Mudaremos a largura para `md:w-[85vw] lg:w-[1200px]` e faremos uso da tela toda.

## Limpeza de Estado Redundante
Uma vez que o `AuditPanel` busca os dados por conta própria (fetchMessages), podemos remover com segurança os estados locais `modalMessages` e `isLoadingMessages` em `Relatorios.tsx`, bem como o `useEffect` responsável por buscar as mensagens, otimizando o código.
