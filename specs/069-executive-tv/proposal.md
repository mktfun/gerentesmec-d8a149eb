# Spec 069: Executive TV Mode (Radar & Semáforo)

## 1. Visão Geral
Implementação do Modo TV (Dashboard Executivo Rotativo) focado em escaneabilidade extrema. O objetivo é permitir que o executivo posicione uma TV na sala, que irá iterar automaticamente por 3 telas de forma autônoma, destacando de relance a saúde das lojas, as piores infrações em vendas (Radar) e os problemas de infraestrutura física (Parede de Imagens). O ambiente terá fontes massivas, fundo `#121214` constante, e foco em ação imediata (WhatsApp QR Codes para cobrança no ato).

## 2. Arquitetura das Telas (Views Rotativas)
Um componente base `TvExecutiveWrapper` orquestrará as telas. O estado `activeScreen` iterará entre as visualizações a cada X segundos (padrão 15s).

### 2.1. Tela 1: Radar de Vacilos (O Feed de Vendas/Atendimento)
- **Grid:** Estilo Pinterest/Cards.
- **Card:**
  - Header vermelho escuro/translúcido com o nome da Loja gigante e timestamp.
  - Título/Problema em negrito (resumo).
  - Caixa cinza (`bg-zinc-900`) com a citação exata da falha.
  - Veredito da IA.
  - QR Code de WhatsApp no rodapé para cobrança rápida.

### 2.2. Tela 2: O Semáforo (Ranking Geral do Atendimento)
- **Lado Esquerdo:** Leaderboard limpo das lojas baseado nos scores das conversas. Barras grandes ou círculos coloridos (Verde/Amarelo/Vermelho).
- **Lado Direito:** 
  - 🏆 Card Ouro: O melhor gerente/loja da semana (com foto do gerente se houver, senão, placeholder premium).
  - 💀 Card Trágico: O pior caso extraído da IA.

### 2.3. Tela 3: Raio-X Operacional (Checklists Físicos)
- **Coluna Esquerda:** Leaderboard das notas de infraestrutura/Auditoria de lojas. Alerta intermitente se atrasado (SLA > 24h sem vistoria).
- **Coluna Direita:** Grid (2x2) fotográfico de alta resolução das piores "Não Conformidades" auditadas fisicamente no app. Tarja preta nas fotos com o item reprovado (ex: "Elevador com Vazamento - Carijós") e o *notes* preenchido pelo auditor.
- **QR Code:** Direcionado também ao gerente daquela loja com link pra enviar o WhatsApp.

## 3. Diretrizes de Design & UX (Headless AI constraints)
- **Tamanho das Fontes:** Multiplicação geral. O que era base vira `text-lg`/`text-xl`, Títulos ficam entre `text-3xl` e `text-5xl`.
- **Interação Proibida:** Nenhuma tela exige scroll. O volume de itens se adapta ao grid ou alterna ao rodar o timer de loop. O usuário na TV apenas *assiste*.
- **Cores Estritas:** Dark mode (`#121214`) obrigatório, borders suaves `border-zinc-800`.
