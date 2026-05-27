# RPI-R: Pesquisa e Contexto

## 1. Mapeamento do Código Atual
- O arquivo principal da lógica de inteligência é a Edge Function `ai-autonomous-evaluator/index.ts`.
- **Descoberta Crítica:** Diferente do que foi dito anteriormente ao usuário, o código atual **JÁ POSSUI** uma rotina de scraping utilizando a API gratuita e sem chaves do `Jina Reader` (`https://r.jina.ai/[URL]`).
- O código atual intercepta regex de URLs `/(https?:\/\/[^\s]+)/g` e extrai até 4000 caracteres de markdown para injetar na variável `scrapedContent` e ensinar a IA.

## 2. Lacunas e Desvios de Regra de Negócios
- **Problema 1 (Restrição de Remetente):** O scraping atual dispara *toda vez que encontra uma URL*. Isso significa que se o CLIENTE (`sender_type === 'contact'`) enviar um link, a IA também fará o scraping, gastando requisições e tempo de processamento à toa. A regra de negócio exige que o scraping ocorra *Apenas quando o GERENTE envia o link*.
- **Problema 2 (Agnóstico a Tipos de Link):** O Jina Reader converte qualquer link que seja uma página web HTML para markdown de forma limpa. Se for um link de orçamento PDF puro, ele consegue converter texto de PDFs com bom formato. O requisito do cliente "qualquer link" é totalmente coberto pelo Jina Reader atual. 
- **Problema 3 (Confiabilidade do Jina Reader Timeout):** Atualmente o código faz um timeout agressivo de 5000ms (5 segundos). Algumas páginas de sistemas de orçamento mecânico demoram mais que 5s para carregar. É prudente aumentar o timeout para 12000ms.

## 3. Benchmarking de Extração Semântica
O uso de Firecrawl para isso exigiria gerenciar chaves e créditos, o que causaria dor de cabeça de *Rate Limits* extras. O `Jina Reader` é superior para Edge Functions pela facilidade e por já transformar SPAs e sistemas web simples em `Markdown` sem precisar abrir headless browsers pesados, o que é perfeito pro LLM.

## 4. Conclusão da Pesquisa
O foco da implementação será refinar e proteger a lógica existente, limitando a extração exclusivamente aos envios do gerente, melhorando a extração do regex de links e ajustando timeouts para garantir que orçamentos pesados sejam lidos antes da IA auditar a conversa.
