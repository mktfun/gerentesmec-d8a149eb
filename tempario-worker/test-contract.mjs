
async function testApi() {
  const url = 'http://100.114.251.99:3033/api/query';
  console.log("==> Testando API com placa falsa + marca + modelo (Fallback) <==");
  
  const payload = {
    request_id: "test-6214",
    query: {
      placa: "EZR8759",
      marca: "Ford",
      modelo_pesquisa: "Fiesta",
      servico: "troca mangueira superior radiador"
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Status HTTP:", res.status);
    console.log("Response JSON:\n", JSON.stringify(data, null, 2));

    if (data.status === "needs_vehicle_selection" && data.options && data.options.length > 0) {
      console.log("✅ SUCESSO! O novo contrato funcionou!");
    } else {
      console.error("❌ FALHA! O contrato não veio como esperado.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

testApi();
