const payload = {
  request_id: "test-service-6215",
  query: {
    placa: "EZR8759",
    servico: "carga de bateria"
  }
};

async function test() {
  console.log("==> Testando Ambiguidade de Serviço <==");
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
    console.error("Erro na requisição HTTP:", err);
  }
}

test();
