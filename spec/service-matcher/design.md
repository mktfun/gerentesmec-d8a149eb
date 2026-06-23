# Design: ServiceMatcher Híbrido

## 1. Arquitetura e Fluxo de Dados
O `ServiceMatcher` receberá a `query` (string do usuário) e um `catalog` (array de strings de serviços extraídos do Tempario, ou acessados via SQL).
Como nossa estrutura atual usa Worker Playwright, o módulo principal (`ServiceMatcher.ts` ou `.mjs`) será um utilitário puro e agnóstico de I/O, processando as strings em memória ou através de extensões Node.js (ex: `string-similarity`, `fuzzball`). Se no futuro migrarmos a base para PostgreSQL nativo (como Supabase), esse módulo pode ser transformado numa Edge Function ou Stored Procedure com `pg_trgm`. Por enquanto, construiremos no Worker Node.js que possui o catálogo obtido do scraper ou hardcoded em memória/cache.

## 2. Contratos de Dados (Interfaces)
```javascript
/**
 * O catálogo será uma lista dos serviços oficiais do sistema.
 */
interface CatalogItem {
  service_id: string;
  service_name: string;
}

interface MatcherResult {
  query_original: string;
  query_normalized: string;
  decision: "auto_match" | "confirm" | "suggest" | "not_found";
  top_match?: {
    service_id: string;
    service_name: string;
    score: number;
    reasons: string[];
  };
  alternatives: Array<{
    service_id: string;
    service_name: string;
    score: number;
  }>;
}
```

## 3. Módulos Internos

### 3.1 Normalizer
- Remove acentos/diacríticos (`.normalize("NFD").replace(/[\u0300-\u036f]/g, "")`).
- Para lowercase.
- Remove pontuação e formatação extra.
- Remove stopwords (`de`, `do`, `da`, `para`, `com`).
- Singulariza strings (ex: `bielas` -> `biela`).

### 3.2 Dicionário de Sinônimos
Mapeamento M:1.
```javascript
const synDict = {
  "troca": "substituicao",
  "substituir": "substituicao",
  "cambio": "transmissao",
  "amortecedor dianteiro": "amortecedor diant",
  "kit embreagem": "embreagem",
  "mangueira superior radiador": "mangueira radiador superior"
};
```

### 3.3 Scoring Engine
A fórmula para cálculo será:
```javascript
final_score = 
  0.30 * exact_or_prefix_score +
  0.20 * token_overlap_score +
  0.25 * trigram_score +
  0.15 * short_string_similarity_score +
  0.05 * synonym_bonus +
  0.05 * important_token_bonus -
  generic_penalty;
```

**Métricas:**
- **exact_or_prefix**: 1.0 (idêntico), 0.95 (prefixo longo), 0.85 (contains).
- **token_overlap**: tokens em comum / tokens totais.
- **trigram_score**: Semelhança de trigramas (Sørensen–Dice coefficient de n-grams 3).
- **short_string**: Levenshtein ou Jaro-Winkler normalizado.
- **synonym_bonus**: Se a palavra trocada gerou match exato, +0.05.
- **important_token_bonus**: Bônus de 0.02 (máximo 0.05) por palavra crítica (`biela`, `radiador`, `embreagem`, `cabeçote`, `suspensão`, `cambio`, `motor`).
- **generic_penalty**: -0.05 a -0.15 se o catálogo contém `servicos diversos`, `reparo geral`, `remocao`, `instalacao` sem a peça específica.

## 4. Regras de Negócio e Casos Especiais

### Regra do Token Obrigatório
Se o usuário digitar `biela`, o vencedor absoluto NÃO pode ser um candidato que não possua o token `biela` ou sinônimos absolutos (`bronzina`?), independente do fuzzy score da string.

### Regra da Margem de Confiança
Para um match automático (`decision === "auto_match"`):
- `top1_score >= 0.93`
- `(top1_score - top2_score) >= 0.08`
Se o segundo colocado estiver na "cola", a engine cai para `confirm`.

## 5. Casos de Teste (Suite)
O `spec-plan` cobrirá TDD com:
1. Match Exato: "troca de biela"
2. Sinônimos: "trocar biela", "substituir biela"
3. Ordem Invertida: "biela troca"
4. Match Parcial: "mangueira radiador" -> "troca mangueira superior do radiador"
5. Abreviações: "amort diant"
6. Erros ortográficos: "cabecote", "suspensao"
7. Ambiguidades e False Positives: query "radiador" não casando com "reservatório de água" apenas por coocorrência.
