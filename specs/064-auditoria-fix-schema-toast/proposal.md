# Proposal: 064 - Hotfix Auditoria Execution & Toast Mobile Overlap

## 1. Visão Geral
Esta spec visa corrigir dois comportamentos anômalos relatados:
1. **Loop / Refresh Infinito da Tela de Auditoria:** Quando um auditor tenta iniciar uma nova inspeção, o aplicativo entra numa espécie de "refresh", negando o acesso à tela de execução.
2. **Overlap do Toast (Badge) na LumaBar (Mobile):** O `Toaster` foi configurado para `bottom-right`, mas em dispositivos móveis ele acaba conflitando (sobrepondo) a Navbar flutuante (LumaBar) da parte inferior da tela.

## 2. Diagnóstico Técnico

### Problema 1: "A tela da refresh e não fala o erro"
**Causa:** Na spec anterior, alteramos o schema dos payloads locais no IndexedDB para a versão `v3_granular` (no arquivo `constants.ts`). Porém, a checagem que determina se o cache local deve ser "limpo" no hook `useAuditStorage.ts` ficou com a versão antiga hardcoded (`v2_granular`). 
Quando o usuário cria a nova auditoria, ela é salva com `v3`. A tela de execução carrega e o hook lê o cache. Como ele compara com `v2`, ele acha que o cache está corrompido, APAGA a auditoria em andamento e redireciona o usuário de volta para o início.

### Problema 2: Overlap de Toasts
**Causa:** No mobile, os Toasts do Sonner no `bottom-right` caem para o final da tela (bottom). Como a nossa `LumaBar` é fixa no rodapé (`bottom-4`), o aviso de sucesso sobe exatamente em cima dela.

## 3. Solução Proposta

1. **Correção do Cache (Zero Refresh Bug)**
   - No arquivo `src/hooks/useAuditStorage.ts`, importar o `SCHEMA_VERSION` correto diretamente de `constants.ts` em vez de deixar uma string solta (`v2_granular`). Isso vai estancar o wipe automático imediato.

2. **Repicionamento Responsivo do Toast**
   - No `App.tsx`, aplicar um estilo customizado no componente `<Sonner />` que injeta uma margem na base SOMENTE no mobile (ex: `className="max-md:mb-24"`). 
   - Com isso, no Desktop as notificações ficam contidas lindamente na direita inferior, mas no celular elas vão flutuar logo acima do LumaBar (respeitando o espaço sem conflitar visualmente).

Posso seguir com o **`/vibe-apply`** para matar esse bug em definitivo?
