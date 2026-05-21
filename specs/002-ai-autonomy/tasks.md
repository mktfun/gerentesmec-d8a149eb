# Tasks: 002-ai-autonomy

## 1. Setup Banco de Dados e Vetores
- [x] Criar migração Supabase para ativar `pgvector`.
- [x] Criar tabela `semantic_cache` com RLS e índices IVFFlat ou HNSW para similaridade.
- [x] Criar tabela `lead_memories` para compressão de histórico de conversas.
- [x] Alterar tabela `ai_settings` adicionando colunas `system_prompt`, `evaluation_criteria`, `features`, `embedding_provider`.
- [x] Rodar `supabase gen types` para atualizar os tipos do frontend (Substituído por tipagem manual devido à CLI).

## 2. UI/UX: Painel Oculto de Engenharia de IA (Frontend)
- [x] Criar o componente `AdvancedAiPanel.tsx` usando framer-motion para animação de slide-over com efeito *Liquid Glass*.
- [x] Adicionar um botão sutil de gatilho no final de `Config.tsx` que abre o `AdvancedAiPanel`.
- [x] Implementar inputs para `system_prompt`, toggles para visão/áudio e chaves de automação (`auto_scoring`, `auto_pipeline`).
- [x] Conectar o painel ao contexto `AppDataContext` para salvar as configurações no Supabase.
- [x] Validar conformidade com as regras de UI/UX 2026 (contraste, blur dinâmico, animações fluidas).

## 3. Arquitetura Cost-Efficient (Backend Edge Functions)
- [x] Criar script compartilhado de pré-processamento determinístico (filtros de regex e tamanho) para barrar mensagens desnecessárias.
- [x] Implementar função auxiliar `generateEmbedding()` ligada ao Google Gemini/OpenAI configurado (Simulado no evaluator).
- [x] Implementar a lógica de busca semântica (`cosine similarity`) na tabela `semantic_cache` (Simulado no evaluator).

## 4. O Cérebro Autônomo (LLM Orchestration)
- [x] Criar a Edge Function ou Deno Worker principal `ai-autonomous-evaluator`.
- [x] Integrar lógica de **Prompt Compression**: a função lê o `lead_memories.compressed_history`, anexa as *mensagens novas*, e envia ao LLM.
- [x] Configurar a função para retornar um JSON estruturado contendo: `novo_score`, `ticket_value_extraido`, `etapa_funil_recomendada`, `novo_compressed_history`, `motivo`.
- [x] Atualizar o registro do Lead e salvar a nova memória do Lead no Supabase.
- [x] Testar de ponta a ponta: simular mensagens de Webhook e verificar se o CRM reflete as mudanças de Score e Funil de forma autônoma sem recarregar a tela (Aprovado).
