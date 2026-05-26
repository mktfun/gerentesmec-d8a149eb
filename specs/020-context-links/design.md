# Design & Arquitetura

O impacto é puramente Backend (Edge Function):

1. **Troca do Extrator HTML para Jina Reader:**
   - O `fetch` nativo no Supabase para puxar os links será atualizado para chamar `https://r.jina.ai/${url}`.
   - Isso garante suporte automático a conversões completas de páginas em SPA para Markdown, pulando barreiras de CORS e executando o DOM corretamente sem custo adicional para a Edge Function.

2. **Engenharia de Prompt (Memória Rígida):**
   - Injetar no prompt do `ai-autonomous-evaluator` uma diretriz severa sob o tópico "MEMÓRIA": "Sempre que houver conteúdo raspado de um link, resuma de forma cirúrgica e técnica os defeitos, peças e valores no campo \`new_compressed_history\`. Se você omitir informações vitais dos links nesse sumário, você causará amnésia no próximo turno, o que resultará em erro fatal de auditoria."
