const payload = {
  request_id: "test-auto-fallback",
  query: {
    placa: "EZR8759", // Retorna vários Fiestas
    servico: "bateria" // Serviço fácil e inequívoco
  }
};

async function test() {
  console.log("==> Testando Auto-Fallback de Veículo <==");
  try {
    const res = await fetch("http://100.114.251.99:3033/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log("Status HTTP:", res.status);
    console.log("Response JSON:\n", text);
  } catch (err) {
    console.error("Erro:", err);
  }
}

test();
