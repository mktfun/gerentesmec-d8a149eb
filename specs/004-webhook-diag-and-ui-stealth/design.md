# Design: 004-webhook-diag-and-ui-stealth

## 1. Ajuste de UI (Stealth Mode)
A interface deve adotar o design **Liquid Glass**, mas sem o branding de "Inteligência Artificial".
- **Aparência do Feedback:**
  - O contêiner de feedback atual usa cores "índigo" (`bg-indigo-500/10`) e bordas que remetem a algo "Tech" (IA).
  - Vamos alterar a paleta de cores para algo mais sóbrio, como tons de neutros (zinc/slate) ou âmbar sutil (`bg-amber-500/10`) caso represente uma "Atenção da Auditoria".
  - O título "Motivo do Score (IA)" será alterado para **"Parecer da Auditoria"**.
  - O ícone `Sparkles` será substituído pelo ícone `CheckCircle2` (para scores altos) ou `AlertTriangle` (para scores baixos), ou simplesmente removido para manter o visual limpo.
- **Opacidade do Checklist Interativo:**
  - O checklist deve continuar exibindo o "blur de vidro" para impedir cliques.
  - A pill flutuante "Gerenciado por IA" será completamente removida ou alterada para uma pill discreta "Avaliação Fechada".

## 2. Diagnóstico de Banco de Dados (Supabase)
As funções na nuvem dependem do Deploy. 
- Foi modificado o código `chatwoot-webhook/index.ts` recentemente, mas o deploy não foi feito, de forma que a nuvem ainda executa a versão velha ou a versão que não suporta a estrutura de `text` no UUID ou de anexos de mídia corretamente.
- Na arquitetura do Supabase, sempre que alterarmos uma Edge Function em `supabase/functions/`, devemos comandar a CLI do Supabase para fazer o deploy via API utilizando os tokens injetados. Caso contrário, a infraestrutura fica cega.

Nesta fase, faremos o **Deploy forçado** das Edge Functions utilizando scripts em Powershell do `.env` e validaremos o log de entrada no Painel do Supabase.
