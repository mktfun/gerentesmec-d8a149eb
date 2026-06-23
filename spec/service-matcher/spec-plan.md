# Spec Plan: ServiceMatcher

- [ ] **1. Fundação & Configuração**
  - [ ] Criar o módulo principal `ServiceMatcher.mjs` no diretório do worker ou utils.
  - [ ] Instalar e configurar bibliotecas leves auxiliares para n-grams e Levenshtein (ex: `fuzzball` ou custom functions de Jaro-Winkler/Trigram se não houver dependências aprovadas).

- [ ] **2. Normalização & Sinônimos**
  - [ ] Implementar `normalizeText(text)` (lowercase, sem pontuação, sem acento, trim).
  - [ ] Implementar remoção de stopwords baseadas em contexto mecânico (`de`, `do`, `da`, `para`, `com`).
  - [ ] Configurar dicionário de sinônimos dinâmico (`synonyms.json` ou const in-file).
  - [ ] Adicionar testes unitários para a etapa de normalização (assegurar que `Troca de biela!` vira `substituicao biela`).

- [ ] **3. Candidate Generation & Blocking**
  - [ ] Implementar busca de prefixos e exact match no subset já normalizado.
  - [ ] Criar gerador de N-Gramas/Trigramas locais.

- [ ] **4. Scoring Engine**
  - [ ] Implementar `calculateTokenOverlapScore`.
  - [ ] Implementar `calculateTrigramScore`.
  - [ ] Implementar `calculateStringSimilarity` (Levenshtein ou Jaro-Winkler).
  - [ ] Implementar sistema de penalidades e bônus (tokens importantes: biela, motor, cambio, suspensao).
  - [ ] Consolidar pesos na fórmula mestre `final_score`.

- [ ] **5. Regras de Negócio e Thresholds**
  - [ ] Configurar thresholds (AutoMatch >= 0.93, Confirm >= 0.85, Suggest >= 0.70).
  - [ ] Implementar regra da margem (Gap mínimo de 0.08 entre o Top 1 e o Top 2).
  - [ ] Implementar regra de exclusão por Token Obrigatório Crítico (evitar que consulta "biela" faça match com item sem a palavra/sinônimo de biela).

- [ ] **6. Estrutura de Retorno (Explicabilidade)**
  - [ ] Formatar o retorno JSON no modelo `MatcherResult` contendo as chaves `decision`, `top_match`, `alternatives` e log detalhado `reasons` no top match para depuração/tuning.

- [ ] **7. Testes e Validação**
  - [ ] Criar suíte de testes com Jest ou Node `--test` com cenários variados.
  - [ ] Validar falsos positivos proibidos na suíte.
  - [ ] Validar cenários de plural, erro ortográfico severo e abreviação.
