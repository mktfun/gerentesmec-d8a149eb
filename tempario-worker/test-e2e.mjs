// Bateria de testes end-to-end contra o Worker real na VPS
const BASE_URL = "http://100.114.251.99:3033/api/query";

const tests = [
  {
    name: "Carga de Bateria (fallback token + auto_match)",
    payload: { request_id: "e2e-001", query: { placa: "EZR8759", servico: "carga de bateria" } }
  },
  {
    name: "Troca de Pastilha Dianteira (componente especifico)",
    payload: { request_id: "e2e-002", query: { placa: "EZR8759", servico: "troca pastilha dianteira" } }
  },
  {
    name: "Troca de biela (nao deve retornar remocao completa do motor)",
    payload: { request_id: "e2e-003", query: { placa: "EZR8759", servico: "troca de biela" } }
  }
];

async function runTest(test) {
  const start = Date.now();
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(test.payload)
  });
  const json = await res.json();
  const dur = Date.now() - start;

  console.log(`\n[TESTE] ${test.name}`);
  console.log(`Status HTTP: ${res.status} | Duracao: ${dur}ms`);
  
  if (json.status === "ok") {
    console.log(`[OK] Veiculo: ${json.vehicle?.descricao}`);
    console.log(`[OK] Servico: ${json.service?.descricao}`);
    console.log(`[OK] Tempo: ${json.service?.tempo_padrao_horas}h | Valor: R$${json.service?.valor_servico}`);
  } else if (json.status?.includes("needs_")) {
    console.log(`[DISAMBIG] Desambiguacao necessaria:`);
    console.log(`   Opcoes: ${(json.options || []).slice(0, 3).join(' | ')}`);
    console.log(`   Mensagem: ${json.message_for_user}`);
  } else {
    console.log(`[ERRO] Resultado:`, JSON.stringify(json, null, 2));
  }
}

async function main() {
  console.log("=== BATERIA DE TESTES E2E ===\n");
  for (const test of tests) {
    try {
      await runTest(test);
    } catch (err) {
      console.log(`[FALHA NA REQUISICAO] ${err.message}`);
    }
  }
  console.log("\n=== FIM DOS TESTES ===");
}

main();
