# Design: Fallbacks, Chatwoot Link e Chart Fix

## UI Components
- **Botão Chatwoot no CRM**: Localizado no cabeçalho do `AuditPanel`, um pequeno ícone da `ExternalLink` ou da logotipo simulada com texto `Abrir Conversa`. Usaremos um `button` estilizado com classe `glassmorphism` discreta e hover de luminescência azul do chatwoot.
- **Gráfico de Evolução (Index)**: Para tratar o "vazio" da falta de dados passados, iremos customizar o comportamento do array de dados do chart. Em vez de simplesmente plotar o array vazio ou 1 dia de dado isolado sem eixos claros, a linha de dados precisa passar a mensagem visual correta. A média global mostrada será = `sum(scores) / count(scores)`.

## Logic Architecture
- **Fallback do TMR**: Em `Index.tsx`, `TvDashboard.tsx` e `Relatorios.tsx`. Se `last_client_message_at` for null (que é o caso de todos os leads antigos), vamos voltar a usar `last_message_at` mas limitando o TMR aos casos em que `wait_time_minutes > 0` (se houver essa tag do webhook antigo).
- **Relatórios**: Garantir que as lógicas corrigidas e importadas do TMR sejam centralizadas ou aplicadas manualmente de forma idêntica. Em React, o ideal seria exportar o Helper `calculateTmr(leadsList)` para um `utils.ts`, limpando o código duplicado.
