# Tasks: WhatsApp Monitoring v2 (Surdina Kanban)

## Fase 1: Interface Principal & Rota Secreta (Frontend-First)
- [x] Restaurar `Index.tsx` para uma página neutra/comum.
- [x] Construir Rota Invisível (`/vault` ou atalho de teclado).
- [x] Criar `VaultLayout.tsx` no padrão "Command Center" Liquid Glass (Blur intenso, bordas suaves).
- [x] Criar Mock Data JSON para que possamos desenvolver o frontend sem depender do banco neste momento.

## Fase 2: O Kanban "Vivo" (UI & Animações)
- [x] Instalar e configurar o Framer Motion para lidar com as transições, fade-ins e contadores de números.
- [x] Desenvolver `KanbanBoard.tsx` separando as conversas em colunas baseadas no `status` do atendimento.
- [x] Desenvolver o `KanbanCard.tsx` que destaque visualmente em vermelho piscante atendimentos com mais de 20 minutos de espera. Efeitos hover sofisticados (táteis).
- [x] Implementar o `AuditSheet.tsx` (utilizando componente Sheet do Shadcn) com animação suave de deslizar.

## Fase 3: Formulário de Auditoria & Score Visual
- [x] Dentro do AuditSheet, listar os detalhes da conversa, nome do gerente e os campos para anotações do auditor (João).
- [x] Construir o formulário de validação (Checkboxes com micro-interações) para as 4 etapas exatas:
    1. Cordialidade e Registro no WhatsApp.
    2. Orçamento c/ Vídeo do defeito e Texto Explicativo de Efeitos.
    3. Orçamento Complementar c/ Checklist do Mecânico (Vídeo + Texto).
    4. Encerramento padrão solicitando Review no Google.
- [x] Criar um indicador numérico (Radial Chart ou ProgressBar) com "Count Up Animation" calculando o Score (0 a 100, 25 por etapa).

## Fase 4: Integração com Backend Supabase
- [ ] Ajustar tabela `whatsapp_cycles` para incluir as colunas necessárias ao Kanban: `status` (text), `last_message_at` (timestamptz), e `auditor_proofs` (jsonb ou text).
- [ ] Atualizar o script de Edge Function (`chatwoot-sync`) para ler e alimentar corretamente a flag de atraso e status.
- [ ] Trocar os Mock Datas pelos dados reais em tempo real.

## Fase 5: Dashboard Executivo (Visão "Daniel") - Opcional para o V2
- [ ] Criar uma visão secundária (separada da auditoria crua) onde o chefe possa ver apenas os gráficos consolidados de pontuação (KPs finais, sem precisar ver os cards), preparando o terreno para a "Avaliação do Gerente".
