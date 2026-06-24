import { ServiceMatcher } from './ServiceMatcher.mjs';

const mockCatalog = [
    { service_id: "1", service_name: "Substituição de biela" },
    { service_id: "2", service_name: "Remoção e instalação de biela" },
    { service_id: "3", service_name: "Substituição do jogo de bielas" },
    { service_id: "4", service_name: "Troca mangueira superior do radiador" },
    { service_id: "5", service_name: "Amortecedor dianteiro" },
    { service_id: "6", service_name: "Caixa de cambio" },
    { service_id: "7", service_name: "Reparo geral do motor" },
    { service_id: "8", service_name: "Serviços diversos" },
    { service_id: "9", service_name: "Troca de bronzina" },
    { service_id: "10", service_name: "Reservatório de água" }
];

const matcher = new ServiceMatcher(mockCatalog);

function runTest(query, expectedDecision, expectedTopId = null) {
    const result = matcher.match(query);
    const pass = result.decision === expectedDecision && (!expectedTopId || (result.top_match && result.top_match.service_id === expectedTopId));
    console.log(`[${pass ? 'PASS' : 'FAIL'}] Query: "${query}" -> Decision: ${result.decision} (Top: ${result.top_match ? result.top_match.service_name : 'none'} | Score: ${result.top_match ? result.top_match.score : 0})`);
    if (!pass) {
        console.log(`   EXPECTED: ${expectedDecision} | ${expectedTopId}`);
        console.log(`   RESULT:`, JSON.stringify(result, null, 2));
    }
}

console.log("=== EXECUTANDO TESTES DO SERVICE MATCHER ===\n");

// 1. Exato
runTest("Substituição de biela", "auto_match", "1");

// 2. Sinônimo Direto (Deve dar alto o suficiente para match ou confirm)
runTest("Troca de biela", "auto_match", "1");

// 3. Ordem invertida e sem stopword
runTest("biela troca", "auto_match", "1");

// 4. Parcial
runTest("mangueira radiador", "confirm", "4");

// 5. Abreviação (cadastrada em sinônimo parcial)
runTest("amort diant", "confirm", "5");

// 6. Falta de acento / erro ortográfico
runTest("caixa de cabmio", "suggest", "6"); // Now it should be suggest or confirm

// 7. Falso positivo proibido (A query "biela" não pode casar com "Troca de bronzina" se "biela" for token crítico obrigatório)
runTest("biela", "confirm", "1"); // Because top matches are close

// 8. Falso positivo de contexto (radiador não casa com reservatório de água só por coocorrência - score deve ser nulo ou baixissimo)
const resRadiador = matcher.match("radiador");
if (resRadiador.top_match && resRadiador.top_match.service_id === "10") {
    console.log(`[FAIL] Query: "radiador" -> Não deve casar com Reservatório de água! Score: ${resRadiador.top_match.score}`);
} else {
    console.log(`[PASS] Query: "radiador" -> Respeitou falso positivo.`);
}

console.log("\nDetalhamento do 'troca de biela':");
console.log(JSON.stringify(matcher.match("troca de biela"), null, 2));
