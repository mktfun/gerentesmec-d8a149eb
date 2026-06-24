import * as fuzz from 'fuzzball';

const SYNONYM_DICT = {
    // Verbos de atividade
    "troca": "substituicao",
    "trocar": "substituicao",
    "substituir": "substituicao",
    "tirar": "remocao",
    "sacar": "remocao",
    "baixar": "remocao",
    "abrir": "desmontagem",
    "desmontar": "desmontagem",
    "montar": "montagem",
    "recolocar": "reinstalacao",
    "instalar": "reinstalacao",
    "consertar": "reparo",
    "regular": "ajuste",
    // Componentes / sinônimos informais
    "cambio": "transmissao",
    "amort diant": "amortecedor dianteiro",
    "amort tras": "amortecedor traseiro",
    "amort": "amortecedor",
    "kit embreagem": "embreagem",
    "mangueira superior radiador": "mangueira radiador superior",
    "bomba dagua": "bomba agua",
    "junta cabeçote": "junta cabecote",
    "cabo freio": "cabo freio mao",
    "pastilha": "pastilha freio",
    "lona": "lona freio",
    "vela": "vela ignicao",
    "filtro oleo": "filtro oleo motor",
    "bengala": "amortecedor"
};

const STOPWORDS = ['de', 'do', 'da', 'para', 'com', 'no', 'na', 'o', 'a', 'os', 'as', 'em', 'e'];

const CRITICAL_TOKENS = [
    'biela', 'radiador', 'embreagem', 'cabecote', 'suspensao', 'cambio',
    'motor', 'oleo', 'bomba', 'alternador', 'virabrequim', 'pistao',
    'bronzina', 'coletor', 'diferencial', 'homocinética', 'homocinetica',
    'pastilha', 'disco', 'lona', 'tambor', 'mola', 'bandeja'
];

// Atividades canônicas — usadas para detectar MISMATCH de intenção
const ACTIVITY_SUBSTITUICAO = ['substituicao', 'troca', 'novo'];
const ACTIVITY_RETIIFICA   = ['retiifica', 'retifica', 'usinagem', 'plaina', 'bancada'];
const ACTIVITY_REMOCAO     = ['remocao', 'retirada', 'desmonte'];
const ACTIVITY_COMPLETO    = ['completo', 'completa', 'geral'];

// Termos de contexto que devem ser penalizados quando NÃO estão na query
// Ex: query: "motor" → penalizar candidatos que contenham "esguicho", "limpador", "para-brisa"
const CONTEXT_EXCLUSION_MAP = [
    { queryMustHave: [],                  candidateHas: ['esguicho', 'limpador', 'parabrisa', 'para-brisa'],  penalty: 0.25 },
    { queryMustHave: ['freio'],           candidateHas: ['motor', 'embreagem', 'suspensao'],                   penalty: 0.15 },
    { queryMustHave: ['oleo', 'lubrif'],  candidateHas: ['freio', 'suspensao'],                               penalty: 0.15 },
];

const GENERIC_PENALTY_TERMS = ['servicos diversos', 'reparo geral'];

export class ServiceMatcher {
    constructor(catalog) {
        this.catalog = catalog || [];
        // Pre-normalize catalog
        this.normalizedCatalog = this.catalog.map(item => ({
            ...item,
            normalized: this.normalizeText(item.service_name)
        }));
    }

    normalizeText(text) {
        if (!text) return "";
        let n = text.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/[^\w\s]/gi, ' ') // remove punctuation
            .replace(/\s+/g, ' ') // collapse spaces
            .trim();
        
        let tokens = n.split(' ').filter(t => !STOPWORDS.includes(t));
        
        // Apply synonyms
        let joined = tokens.join(' ');
        for (const [key, val] of Object.entries(SYNONYM_DICT)) {
            // Replace whole words only
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            joined = joined.replace(regex, val);
        }
        
        return joined.trim();
    }

    match(query) {
        const queryNorm = this.normalizeText(query);
        const queryTokens = queryNorm.split(' ').filter(Boolean);

        let candidates = this.normalizedCatalog.map(item => {
            const scoreData = this.scoreCandidate(query, queryNorm, queryTokens, item);
            return {
                service_id: item.service_id,
                service_name: item.service_name,
                score: scoreData.score,
                reasons: scoreData.reasons
            };
        });

        // Filter candidates that completely miss critical tokens if the query has them
        const queryCritical = queryTokens.filter(t => CRITICAL_TOKENS.includes(t));
        if (queryCritical.length > 0) {
            candidates = candidates.filter(c => {
                const cNorm = this.normalizeText(c.service_name);
                const cTokens = cNorm.split(' ');
                // Se a query tem um token critico, o candidato DEVE ter pelo menos um desses tokens criticos ou sinônimos
                return queryCritical.some(qt => cTokens.includes(qt));
            });
        }

        candidates.sort((a, b) => b.score - a.score);

        const top1 = candidates[0];
        const top2 = candidates[1];

        let decision = "not_found";

        if (top1 && top1.score >= 0.93) {
            if (!top2 || (top1.score - top2.score) >= 0.08) {
                decision = "auto_match";
            } else {
                decision = "confirm";
            }
        } else if (top1 && top1.score >= 0.85) {
            decision = "confirm";
        } else if (top1 && top1.score >= 0.70) {
            decision = "suggest";
        }

        return {
            query_original: query,
            query_normalized: queryNorm,
            decision,
            top_match: top1 || null,
            alternatives: candidates.slice(1, 6).map(c => ({
                service_id: c.service_id,
                service_name: c.service_name,
                score: c.score
            }))
        };
    }

    scoreCandidate(query, queryNorm, queryTokens, item) {
        const cNorm = item.normalized;
        const cTokens = cNorm.split(' ').filter(Boolean);
        let reasons = [];
        
        // 1. Exact or Prefix Score (30%)
        let exactOrPrefix = 0;
        if (cNorm === queryNorm) {
            exactOrPrefix = 1.0;
            reasons.push("exact_match");
        } else if (cNorm.startsWith(queryNorm) && queryNorm.length > 3) {
            exactOrPrefix = 0.90;
            reasons.push("prefix_match");
        } else if (cNorm.includes(queryNorm)) {
            exactOrPrefix = 0.80;
            reasons.push("contains_match");
        }

        // 2. Token Overlap (20%)
        let overlapCount = 0;
        queryTokens.forEach(qt => {
            if (cTokens.some(ct => ct === qt || ct.startsWith(qt) || qt.startsWith(ct) || fuzz.ratio(ct, qt) >= 75)) {
                overlapCount++;
            }
        });
        const tokenOverlap = queryTokens.length > 0 ? (overlapCount / queryTokens.length) : 0;
        if (tokenOverlap > 0) reasons.push(`token_overlap_${overlapCount}_of_${queryTokens.length}`);

        if (tokenOverlap === 1.0 && exactOrPrefix < 0.80) {
            exactOrPrefix = 0.80; // All tokens present (even out of order) acts like 'contains'
            reasons.push("all_tokens_match");
        }

        // 3. Trigram/Token Set Ratio (30%)
        const tokenSetRatio = fuzz.token_set_ratio(queryNorm, cNorm) / 100.0;
        
        // 4. Short String Similarity (Levenshtein/Jaro-Winkler) (15%)
        const jwScore = fuzz.token_sort_ratio(queryNorm, cNorm) / 100.0;

        // 5. Synonym Bonus (5% max)
        let synonymBonus = 0;
        const originalQueryTokens = query.toLowerCase().split(/\s+/);
        const hasSynonym = Object.keys(SYNONYM_DICT).some(key => query.toLowerCase().includes(key));
        if (hasSynonym && tokenOverlap > 0.5) {
            synonymBonus = 0.05;
            reasons.push("synonym_bonus");
        }

        // 6. Important Token Bonus (5% max)
        let importantTokenBonus = 0;
        CRITICAL_TOKENS.forEach(ct => {
            if (queryTokens.some(qt => qt.includes(ct)) && cTokens.some(ctc => ctc.includes(ct))) {
                importantTokenBonus = Math.min(0.05, importantTokenBonus + 0.02);
            }
        });
        if (importantTokenBonus > 0) reasons.push("important_token_bonus");

        // 7. Generic Penalty
        let genericPenalty = 0;
        const originalLower = item.service_name.toLowerCase();
        GENERIC_PENALTY_TERMS.forEach(gpt => {
            if (originalLower.includes(gpt) && !query.toLowerCase().includes(gpt)) {
                genericPenalty = 0.10;
            }
        });
        if (genericPenalty > 0) reasons.push("generic_penalty");

        // 8. Scope Conflict Penalty (Componente vs Completo)
        let scopePenalty = 0;
        const SCOPE_COMPLETE = ['motor completo', 'cambio completo', 'desmontagem completa', 'montagem completa', 'completo', 'completa', 'reparo geral'];
        const queryHasComplete = SCOPE_COMPLETE.some(sc => query.toLowerCase().includes(sc));
        const candidateHasComplete = SCOPE_COMPLETE.some(sc => originalLower.includes(sc));
        if (!queryHasComplete && candidateHasComplete) {
            scopePenalty = 0.20;
            reasons.push("scope_conflict_penalty");
        }

        // 9. Activity Mismatch Penalty (Retífica ≠ Troca)
        let activityMismatch = 0;
        const queryNormLower = queryNorm.toLowerCase();
        const queryWantsSubstituicao = ACTIVITY_SUBSTITUICAO.some(a => queryNormLower.includes(a));
        const candidateIsRetifica    = ACTIVITY_RETIIFICA.some(a => originalLower.includes(a));
        if (queryWantsSubstituicao && candidateIsRetifica) {
            activityMismatch = 0.25;
            reasons.push("activity_mismatch_retifica_vs_troca");
        }

        // 10. Context Exclusion Penalty (ex: 'motor' não deve casar com 'esguicho limpador')
        let contextExclusionPenalty = 0;
        const queryLower = query.toLowerCase();
        for (const rule of CONTEXT_EXCLUSION_MAP) {
            const candidateHasBadTerm = rule.candidateHas.some(t => originalLower.includes(t));
            const queryHasBadTerm     = rule.candidateHas.some(t => queryLower.includes(t));
            if (candidateHasBadTerm && !queryHasBadTerm) {
                contextExclusionPenalty = Math.max(contextExclusionPenalty, rule.penalty);
                reasons.push(`context_exclusion(${rule.candidateHas[0]})`);
            }
        }

        const finalScore = 
            (0.35 * exactOrPrefix) +
            (0.20 * tokenOverlap) +
            (0.30 * tokenSetRatio) +
            (0.15 * jwScore) +
            synonymBonus +
            importantTokenBonus -
            genericPenalty -
            scopePenalty -
            activityMismatch -
            contextExclusionPenalty;

        return { score: parseFloat(finalScore.toFixed(3)), reasons };
    }
}
