import { ServiceMatcher } from './ServiceMatcher.mjs';

const catalogItems = [
    { service_id: "1", service_name: "Remoção e instalação de bandeja" },
    { service_id: "2", service_name: "Reparo geral da suspensão" },
    { service_id: "3", service_name: "Desmontagem completa do eixo traseiro" },
    { service_id: "4", service_name: "Troca do pivô" }
];

const matcher = new ServiceMatcher(catalogItems);
console.log("=== TESTE DE CONFLITO DE ESCOPO ===");
const query = "troca de bandeja";
const result = matcher.match(query);

console.log(`Query: "${query}"`);
console.log(`Decisão: ${result.decision}`);
if (result.top_match) {
    console.log(`Top Match: ${result.top_match.service_name} (Score: ${result.top_match.score})`);
    console.log(`Reasons: ${result.top_match.reasons.join(', ')}`);
}
console.log("\nAlternativas (filtradas por score e penalidade de escopo):");
result.alternatives.forEach(alt => {
    console.log(`- ${alt.service_name} (Score: ${alt.score})`);
});
