

(async () => {
  const query1 = { placa: "OTM2022", servico: "Pastilha" }; // Ambiguous
  const query2 = { placa: "OTM2022", servico: "Adaptaçao Castelo" }; // OK

  console.log("Disparando Request 1 (Pastilha)...");
  const p1 = fetch("http://localhost:3000/api/query", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ request_id: "t1", query: query1 })
  }).then(r => r.json());

  console.log("Disparando Request 2 (Adaptaçao)...");
  const p2 = fetch("http://localhost:3000/api/query", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ request_id: "t2", query: query2 })
  }).then(r => r.json());

  const results = await Promise.all([p1, p2]);
  console.log("=== Resultados ===");
  console.log(JSON.stringify(results, null, 2));
})();
