# Research: 005-reports-and-ai-closure

## Descobertas do Sistema Atual

### 1. Parecer de Fechamento via IA
- Atualmente, o arquivo `AuditPanel.tsx` exige que o `lead.closing_summary` seja preenchido. Se estiver vazio, a UI mostra "Aguardando parecer...".
- A Edge Function `ai-autonomous-evaluator` gera o novo Score, Ticket e Funnel Stage, e envia para o Supabase, mas **não gera** o `closing_summary` final do lead.
- É necessário alterar o payload do Prompt enviado ao Gemini para exigir, além de "score", "etapa_scores" e "audit_checklist", um "closing_summary" descritivo (O Dossiê da negociação).

### 2. Importação de Imagens não Funciona
- No `chatwoot-webhook`, os anexos são convertidos em `media_type`. O Chatwoot repassa tipos MIME literais (ex: `image/jpeg`, `image/png`, `video/mp4`).
- No arquivo `src/components/Crm/ChatHistoryView.tsx`, a lógica de renderização verifica: `msg.media_type === 'image'`.
- Como o tipo real é `image/jpeg` ou `image/png`, a verificação booleana falha e a imagem não é desenhada na tela.
- **Solução:** Alterar as verificações para `msg.media_type?.startsWith('image')`, `msg.media_type?.startsWith('video')` e `msg.media_type?.startsWith('audio')`.

### 3. Filtros no Relatório (Analytics)
- O arquivo `Relatorios.tsx` possui apenas o filtro de Data (`DateRangePicker`).
- O usuário pediu filtros para: Order de SLA, Melhor/Pior Score, e Filtro por Unidade.
- A arquitetura atual carrega todos os leads em memória (via `AppDataContext`) e processa no Client Side. Portanto, implementar os filtros será uma questão de controle de estado do React.
