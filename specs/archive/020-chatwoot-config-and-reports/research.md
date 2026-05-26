# Research: Chatwoot Config UI & Reports Fixes (020)

## Problemas Reportados
1. **Painel de Configuração do Webhook**: O usuário não sabe qual URL colocar no Chatwoot para fazer a integração funcionar 100%. O sistema precisa de uma tela de "Integração Chatwoot" clara (em `Config.tsx` ou nova tab) que exiba a URL correta do Webhook (Edge Function do Supabase) e dê as instruções de configuração (Quais eventos marcar).
2. **Relatórios Sem Tempo Real e Sem Scores**: A tela `Relatorios.tsx` está desatualizada, não reage em tempo real (provavelmente não usa os dados providos pelo `AppDataContext` ou os subscriptions) e não exibe as métricas de Score calculadas pela auditoria.
3. **Dashboard Feio/Quebrado**: A interface do `Index.tsx` ainda apresenta quebras (possivelmente o Carrossel horizontal implementado não ficou responsivo na tela dele). Precisa de um ajuste de Grid mais polido ou um componente de "Evolução do Score" que preencha melhor o espaço sem esmagar as unidades.

## Arquivos a Serem Modificados
- `src/pages/Config.tsx`: Adicionar Aba "Integrações" -> "Chatwoot".
- `src/pages/Relatorios.tsx`: Conectar ao estado real e exibir os Scores das unidades.
- `src/pages/Index.tsx`: Ajustar estética do "Score Global da Rede".

## Funcionalidade de Sincronização Antiga
O usuário também mencionou: "puxar as conversas antigas e tals certinho que ta no chatwoot ja registrado".
- Para puxar conversas antigas, precisaremos de um botão "Sincronizar Histórico" que dispare uma chamada para o Chatwoot API (via Edge Function) buscando o histórico de um contato. Isso exigirá configurar o **Chatwoot Access Token**.
