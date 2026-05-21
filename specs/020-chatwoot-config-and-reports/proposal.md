# Proposal: Chatwoot Setup UI & Realtime Analytics (020)

## Identificador
`020-chatwoot-config-and-reports`

## O Problema
1. O usuário não possui uma interface fácil para descobrir qual a URL de Webhook deve ser colada no Chatwoot para fazer o sistema receber conversas.
2. Não há mecânica para sincronizar conversas antigas automaticamente.
3. Os Relatórios (`Relatorios.tsx`) estão congelados, não atualizam via WebSockets e não mostram os scores auditados, que é a métrica principal.
4. O Dashboard (`Index.tsx`) apresentou falhas visuais.

## A Solução
1. **Configuração Chatwoot Premium (Stitch UI)**: Criaremos uma aba "Integrações" em `Config.tsx`. Nela, o usuário poderá preencher a URL da API do Chatwoot e o Token (para chamadas outbound) e copiar a URL do Supabase Webhook. 
2. **Botão Mágico "Sincronizar Histórico"**: Na aba do Chatwoot, haverá um botão para puxar o histórico. Faremos um Edge Function "Sync Chatwoot" que busca conversas anteriores via API do Chatwoot e popula nosso banco.
3. **Analytics Realtime (Relatórios)**: Refatoraremos o `Relatorios.tsx` para consumir os `leads` do `useAppData()` que já estão sincronizados em tempo real, calculando os Scores, TMR (Tempo Médio de Resposta) e listando as auditorias completas na tabela inferior dinamicamente.
4. **Resgate do Dashboard**: Vamos revisar a estética do Dashboard (Hero) e aplicar um Grid CSS inteligente que se acomode bem na tela ao invés de um slider horizontal que pode não ter ficado natural na versão web desktop dele.

## BDD Scenarios

### Cenário: Configuração Guiada do Chatwoot
- **Given (Dado):** que o Administrador quer integrar o CRM ao Chatwoot da oficina.
- **When (Quando):** ele entrar em Configurações > Aba "Chatwoot".
- **Then (Então):** ele verá um painel Liquid Glass com um botão "Copiar Webhook URL", uma lista de instruções visuais (quais checkbox marcar no Chatwoot) e campos para preencher sua URL base do Chatwoot e API Token para sincronização reversa.

### Cenário: Relatórios e Scores Reais
- **Given (Dado):** que 10 Leads receberam notas do IA Auditor.
- **When (Quando):** o Gerente entrar na aba "Relatórios".
- **Then (Então):** ele verá o painel de Analytics Premium com o TMR real e o Log de Auditorias Recentes na tabela sendo populado por leads reais que tiveram notas atribuídas (em vez da mensagem de 'Nenhuma auditoria registrada').
