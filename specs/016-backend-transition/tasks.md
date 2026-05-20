# Tasks: Backend Transition & Smart AI Router (016)

## Fase 1: DB Schema & Migrations
- [ ] Conectar ao Supabase (via CLI ou script local).
- [ ] Criar arquivo de migration SQL com as tabelas `units`, `managers`, `leads` (incluindo `closing_summary`) e `ai_settings`.
- [ ] Configurar RLS (Row Level Security) básico nas tabelas.
- [ ] Gerar as tipagens do Supabase via CLI (`supabase gen types`) para o TypeScript do frontend.

## Fase 2: Front-end (UI de Teste Automático)
- [ ] Desenvolver a UI `/config` onde o usuário digita a Key e o Modelo.
- [ ] Desenvolver a requisição síncrona que chama a Edge Function de teste.
- [ ] Desenhar o "Motor de Diagnóstico": caixas visuais de feedback com o checklist de capacidades (Áudio/Visão/Vídeo) e recomendação de modelos.

## Fase 3: Edge Functions
- [ ] Criar a Edge Function `test_ai_capabilities`. Implementar lógica de fallback para modelos restritos e gerar a recomendação.
- [ ] Criar a Edge Function `generate_summary`.
- [ ] Configurar um Supabase Database Webhook que dispara `generate_summary` ao atualizar `funnel_stage` para 'closed_won'.

## Fase 4: Transição do Context (Zero Mock)
- [ ] Refatorar `src/context/AppDataContext.tsx`.
- [ ] Remover as importações e dependências do `mockData.ts`.
- [ ] Substituir os `useState` de leads e managers por chamadas ao `@supabase/supabase-js`.
- [ ] Ativar Supabase Realtime para que a edição de leads em uma aba atualize os dashboards (TV Mode).

## Fase 5: UI do Sumário Final
- [ ] No `AuditPanel.tsx` ou modal de lead concluído, exibir o `closing_summary` retornado pelo banco após a IA processá-lo.
