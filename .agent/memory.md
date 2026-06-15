# Agent Memory

## Preferências de Arquitetura
- Frontend: Vite + React + Tailwind + shadcn/ui.
- Interatividade UI: Uso de `framer-motion` para micro-interações (hover/tap em cards e modais). Preferência por transições suaves (`transition-all duration-200/300`).
- Estado UI: Persistir preferências locais (como sidebar colapsada) no `localStorage`.
- Backend/DB: Supabase. Uso de RPCs para operações pesadas no banco (ex: Limpeza de mídia).
- Limites do BD: Atenção ao armazenamento de mídia (`media_url`) direto no Supabase free tier. Sempre criar botões/cron de limpeza (limite de 7 dias) se houver anexos/base64 pesando.
- Configuração Vite: Variáveis de ambiente prefixadas com `VITE_`.

## Erros Passados
- (Nenhum registrado até o momento)

## Persona do Usuário
- (Nenhuma característica registrada até o momento)
