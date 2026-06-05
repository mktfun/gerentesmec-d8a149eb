# Research: Vertex AI Config Improvement (012-vertex-ai)

## 1. Contexto Atual
Atualmente, quando o usuário seleciona o provedor **Google Vertex AI** no `AiRouterConfig.tsx`, ele precisa preencher manualmente três campos:
- GCP Project ID
- GCP Region
- Service Account JSON

Isso causa atrito, pois o arquivo JSON da Service Account (`credentials.json`) já contém a chave `project_id` internamente, além de outras informações essenciais. O usuário não deveria ter que saber qual é o seu `project_id`, apenas "jogar o JSON lá" e o sistema configurar tudo.

Além disso, a tabela de modelos para o `Google Vertex AI` estava desatualizada, contendo apenas `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash-exp`.

## 2. Análise da Solução
1. **Frontend (`AiRouterConfig.tsx`)**:
   - Simplificar a interface: remover a necessidade do usuário digitar o `Project ID` manualmente se ele fornecer o JSON.
   - Criar um analisador de colagem (onPaste / onChange) no textarea do JSON que faz um `JSON.parse` silencioso, extrai o `project_id` e salva no banco.
   - Deixar a região (`us-central1`) implícita ou apenas com um select opcional e oculto/avançado se o usuário precisar mudar.
2. **Atualização de Modelos**:
   - O usuário mencionou `gemini-3.5-flash`. Para estar alinhado às novidades solicitadas, a lista será atualizada para refletir as versões corporativas de ponta do Vertex (como `gemini-1.5-pro-002`, `gemini-1.5-flash-002`, `gemini-2.0-flash-exp`, e o suposto `gemini-3.5-flash`).
3. **Backend / Edge Function (`ai-autonomous-evaluator/index.ts`)**:
   - A Edge function já utiliza a função `getGoogleAccessToken()` com sucesso.
   - No entanto, ela procura a variável `aiSettings.gcp_project_id`. Podemos mantê-la ou extraí-la diretamente de `gcpCredentials.project_id` caso a string da config esteja vazia, servindo como "fallback" resiliente (o que já atende ao princípio de "jogar só o json").
   - Atualizar a regra de formatação para requisição do Vertex AI caso os novos modelos exijam algo diferente (os modelos de série 1.5 e posteriores aceitam o endpoint `/v1/projects/.../publishers/google/models/<modelo>:generateContent`).

## 3. Considerações de UX 2026
Segundo o guia **ux-ui-architect-2026**:
- O textarea para colagem do JSON pode ter um aspecto de *Apple Liquid Glass* — ao ser validado e reconhecido como um Service Account válido, exibir um *Micro-animation* de "Check" com as chaves destrinchadas elegantemente (ex: "Projeto Reconhecido: `meu-projeto-gcp`").
- Isso dá um feedback dopamínico e elimina a ansiedade de configurar infraestrutura de nuvem.
