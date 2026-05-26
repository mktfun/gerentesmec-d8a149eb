# Proposal: 004-webhook-diag-and-ui-stealth

## Requisitos
1. **Diagnóstico do Webhook (Chatwoot):** O sistema parou de receber mensagens do Chatwoot no CRM. É necessário investigar se as edge functions foram devidamente "deployed" após a refatoração do processamento de mídias (`media_url`, `media_type`) e analisar erros de cast/tipagem no payload.
2. **"Stealth Mode" na UI de Auditoria:** O gerente de operações não pode saber que uma Inteligência Artificial avaliou o lead. O feedback no `AuditPanel.tsx` deve parecer 100% humano (escrito pela gerência sênior).
    - Remover ícones da IA (`Sparkles`).
    - Remover qualquer menção explícita de "IA" (ex: "Motivo do Score (IA)").
    - Remover o banner de "Gerenciado por IA" no checklist quando em modo automático.

## User Stories
- **Como Administrador**, quero que o webhook processe perfeitamente o histórico de mensagens e anexos do Chatwoot para o Supabase sem travar, para que o CRM acompanhe os leads em tempo real.
- **Como Gerente de Oficina (Usuário Final)**, quero receber um feedback claro (Motivo do Score) sobre o atendimento que prestei, parecendo que a direção da rede fez a avaliação humanamente, sem indícios de robôs ou IAs.

## BDD Scenarios

### Cenário: Recepção de Mensagem no Webhook
- **Given (Dado):** O Supabase possui a Edge Function `chatwoot-webhook` atualizada e ativa na nuvem.
- **When (Quando):** Um cliente envia uma nova mensagem (com ou sem anexo) via Chatwoot.
- **Then (Então):** A mensagem deve aparecer em tempo real no banco de dados e na UI do CRM, sem erros de "Foreign Key" ou "Data Type".

### Cenário: Exibição Camuflada do Feedback da IA
- **Given (Dado):** O `AuditPanel` de um lead possui um `ai_feedback` gerado automaticamente (ex: "Faltou enviar orçamento").
- **When (Quando):** O gerente abre o dossiê para verificar sua nota.
- **Then (Então):** A caixa de texto exibe apenas algo como "Feedback da Auditoria" ou "Parecer Operacional" e **não possui ícones de estrelas/robôs**, sendo camuflado como uma avaliação natural. O checklist interativo (se estiver bloqueado por Auto-Scoring) ficará com opacidade reduzida, **sem a etiqueta "✨ Gerenciado por IA"**.
