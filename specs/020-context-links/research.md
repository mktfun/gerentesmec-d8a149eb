# Pesquisa: Extração de Links Avançada

## Contexto Atual
A Edge Function `ai-autonomous-evaluator` já possui uma lógica nativa de regex (`/(https?:\/\/[^\s]+)/g`) que detecta URLs em qualquer mensagem do chat e usa a API `fetch` nativa do Deno para puxar o código HTML da página.

## O Problema
1. O `fetch` nativo falha em capturar o conteúdo real de sites modernos (SPAs) que utilizam React/Vue, pois não roda o JavaScript, resultando em conteúdo vazio (ex: "You need to enable JavaScript").
2. O conteúdo extraído (mesmo que com sucesso) é injetado no prompt de avaliação como `${scrapedContent}`, mas não há uma garantia estrutural de que a IA preserve as evidências cruciais (peças, defeitos relatados no link) na Memória de Longo Prazo (`compressed_history`). Assim, nos próximos turnos da conversa, a IA "esquece" o que estava no link.

## Solução Ideal
1. Usar um serviço de Web Scraping para LLMs que retorne Markdown limpo, como o `https://r.jina.ai/` ou Firecrawl, resolvendo o problema de SPAs sem precisar de chaves complexas (Jina Reader API é nativo e gratuito para volumes baixos).
2. Atualizar o prompt para forçar a IA a fazer o sumário dos itens raspados (peças, preços, diagnósticos) DE DENTRO DO LINK diretamente para dentro do `new_compressed_history`.
3. (Opcional) Salvar os links encontrados e o resumo diretamente numa coluna na tabela do lead ou message para uso no RAG ou no dashboard, mas isso pode encarecer tokens. A injeção na memória contínua é o padrão correto para conversas autônomas.
