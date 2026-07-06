const fs = require('fs');

const data = {
  "JABAQUARA": [
    { "id": 2576, "score": 0, "falhas": ["Faltou 1a: Cordial/respeitoso (-8)", "Faltou 1b: Registrou resumo do acordado (-10)", "Faltou 2a: Enviou link orçamento (-8)", "Faltou 2b: Enviou vídeo defeito (-10)", "Faltou 2c: Explicou consequências (-9)", "Faltou 2d: Enviou link checklist (-8)", "Faltou 2e: Obteve aprovação explícita (sim/ok) (-10)", "Faltou 3a: Checklist complementar (-8)", "Faltou 3b: Vídeo do extra (-8)", "Faltou 3c: Explicou serviços extras (-8)", "Faltou 4a: Agradecimento padrão (-5)", "Faltou 4b: Pediu avaliação no Google (-8)"] },
    { "id": 2597, "score": 0, "falhas": ["Faltou 1a: Cordial/respeitoso (-8)", "Faltou 1b: Registrou resumo do acordado (-10)", "Faltou 2a: Enviou link orçamento (-8)", "Faltou 2b: Enviou vídeo defeito (-10)", "Faltou 2c: Explicou consequências (-9)", "Faltou 2d: Enviou link checklist (-8)", "Faltou 2e: Obteve aprovação explícita (sim/ok) (-10)", "Faltou 3a: Checklist complementar (-8)", "Faltou 3b: Vídeo do extra (-8)", "Faltou 3c: Explicou serviços extras (-8)", "Faltou 4a: Agradecimento padrão (-5)", "Faltou 4b: Pediu avaliação no Google (-8)"] },
    { "id": 2615, "score": 0, "falhas": ["Faltou 1a: Cordial/respeitoso (-8)", "Faltou 1b: Registrou resumo do acordado (-10)", "Faltou 2a: Enviou link orçamento (-8)", "Faltou 2b: Enviou vídeo defeito (-10)", "Faltou 2c: Explicou consequências (-9)", "Faltou 2d: Enviou link checklist (-8)", "Faltou 2e: Obteve aprovação explícita (sim/ok) (-10)", "Faltou 3a: Checklist complementar (-8)", "Faltou 3b: Vídeo do extra (-8)", "Faltou 3c: Explicou serviços extras (-8)", "Faltou 4a: Agradecimento padrão (-5)", "Faltou 4b: Pediu avaliação no Google (-8)"] }
  ],
  "PLANALTO": [
    { "id": 2595, "score": 0, "falhas": ["Faltou 1a: Cordial/respeitoso (-8)", "Faltou 1b: Registrou resumo do acordado (-10)", "Faltou 2d: Enviou link checklist (-8)", "Faltou 2b: Enviou vídeo defeito (-10)", "Faltou 2a: Enviou link orçamento (-8)", "Faltou 2c: Explicou consequências (-9)", "Faltou 2e: Obteve aprovação explícita (sim/ok) (-10)", "Faltou 3a: Checklist complementar (-8)", "Faltou 3b: Vídeo do extra (-8)", "Faltou 3c: Explicou serviços extras (-8)", "Faltou 4a: Agradecimento padrão (-5)", "Faltou 4b: Pediu avaliação no Google (-8)"] },
    { "id": 2616, "score": 0, "falhas": ["Faltou 1a: Cordial/respeitoso (-8)", "Faltou 1b: Registrou resumo do acordado (-10)", "Faltou 2d: Enviou link checklist (-8)", "Faltou 2b: Enviou vídeo defeito (-10)", "Faltou 2a: Enviou link orçamento (-8)", "Faltou 2c: Explicou consequências (-9)", "Faltou 2e: Obteve aprovação explícita (sim/ok) (-10)", "Faltou 3a: Checklist complementar (-8)", "Faltou 3b: Vídeo do extra (-8)", "Faltou 3c: Explicou serviços extras (-8)", "Faltou 4a: Agradecimento padrão (-5)", "Faltou 4b: Pediu avaliação no Google (-8)"] },
    { "id": 2633, "score": 0, "falhas": ["Faltou 1a: Cordial/respeitoso (-8)", "Faltou 1b: Registrou resumo do acordado (-10)", "Faltou 2d: Enviou link checklist (-8)", "Faltou 2b: Enviou vídeo defeito (-10)", "Faltou 2a: Enviou link orçamento (-8)", "Faltou 2c: Explicou consequências (-9)", "Faltou 2e: Obteve aprovação explícita (sim/ok) (-10)", "Faltou 3a: Checklist complementar (-8)", "Faltou 3b: Vídeo do extra (-8)", "Faltou 3c: Explicou serviços extras (-8)", "Faltou 4a: Agradecimento padrão (-5)", "Faltou 4b: Pediu avaliação no Google (-8)"] }
  ],
  "RUDGE": [
    { "id": 343, "score": 0, "falhas": ["Faltou ser cordial/respeitoso (-8)", "Faltou registrar resumo do acordado (-10)", "Faltou enviar link do checklist (-8)", "Faltou enviar vídeo do defeito (-10)", "Faltou enviar link do orçamento (-8)", "Faltou explicar consequências (-9)", "Faltou obter aprovação explícita (-10)", "Faltou enviar checklist complementar (-8)", "Faltou enviar vídeo do extra (-8)", "Faltou explicar serviços extras (-8)", "Faltou agradecimento padrão (-5)", "Faltou pedir avaliação no Google (-8)"] },
    { "id": 1453, "score": 0, "falhas": ["Faltou ser cordial/respeitoso (-8)", "Faltou registrar resumo do acordado (-10)", "Faltou enviar link do checklist (-8)", "Faltou enviar vídeo do defeito (-10)", "Faltou enviar link do orçamento (-8)", "Faltou explicar consequências (-9)", "Faltou obter aprovação explícita (-10)", "Faltou enviar checklist complementar (-8)", "Faltou enviar vídeo do extra (-8)", "Faltou explicar serviços extras (-8)", "Faltou agradecimento padrão (-5)", "Faltou pedir avaliação no Google (-8)"] },
    { "id": 2598, "score": 0, "falhas": ["Faltou ser cordial/respeitoso (-8)", "Faltou registrar resumo do acordado (-10)", "Faltou enviar link do checklist (-8)", "Faltou enviar vídeo do defeito (-10)", "Faltou enviar link do orçamento (-8)", "Faltou explicar consequências (-9)", "Faltou obter aprovação explícita (-10)", "Faltou enviar checklist complementar (-8)", "Faltou enviar vídeo do extra (-8)", "Faltou explicar serviços extras (-8)", "Faltou agradecimento padrão (-5)", "Faltou pedir avaliação no Google (-8)"] }
  ],
  "CARIJOS": [
    { "id": 3329, "score": 0, "falhas": ["Faltou ser cordial/respeitoso (-8)", "Faltou registrar resumo do acordado (-10)", "Faltou enviar link checklist (-8)", "Faltou enviar vídeo defeito (-10)", "Faltou enviar link orçamento (-8)", "Faltou explicar consequências (-9)", "Faltou obter aprovação explícita (-10)", "Faltou checklist complementar (-8)", "Faltou vídeo do extra (-8)", "Faltou explicar serviços extras (-8)", "Faltou agradecimento padrão (-5)", "Faltou pedir avaliação no Google (-8)"] },
    { "id": 2927, "score": 8, "falhas": ["Faltou registrar resumo do acordado (-10)", "Faltou enviar link checklist (-8)", "Faltou enviar vídeo defeito (-10)", "Faltou enviar link orçamento (-8)", "Faltou explicar consequências (-9)", "Faltou obter aprovação explícita (-10)", "Faltou checklist complementar (-8)", "Faltou vídeo do extra (-8)", "Faltou explicar serviços extras (-8)", "Faltou agradecimento padrão (-5)", "Faltou pedir avaliação no Google (-8)"] },
    { "id": 3447, "score": 8, "falhas": ["Faltou registrar resumo do acordado (-10)", "Faltou enviar link checklist (-8)", "Faltou enviar vídeo defeito (-10)", "Faltou enviar link orçamento (-8)", "Faltou explicar consequências (-9)", "Faltou obter aprovação explícita (-10)", "Faltou checklist complementar (-8)", "Faltou vídeo do extra (-8)", "Faltou explicar serviços extras (-8)", "Faltou agradecimento padrão (-5)", "Faltou pedir avaliação no Google (-8)"] }
  ],
  "DOM PEDRO": [
    { "id": 2513, "score": 0, "falhas": ["1a: Cordial/respeitoso (-8)", "1b: Registrou resumo do acordado (-10)", "2d: Enviou link checklist (-8)", "2b: Enviou vídeo defeito (-10)", "2a: Enviou link orçamento (-8)", "2c: Explicou consequências (-9)", "2e: Obteve aprovação explícita (sim/ok) (-10)", "3a: Checklist complementar (-8)", "3b: Vídeo do extra (-8)", "3c: Explicou serviços extras (-8)", "4a: Agradecimento padrão (-5)", "4b: Pediu avaliação no Google (-8)"] },
    { "id": 2656, "score": 0, "falhas": ["1a: Cordial/respeitoso (-8)", "1b: Registrou resumo do acordado (-10)", "2d: Enviou link checklist (-8)", "2b: Enviou vídeo defeito (-10)", "2a: Enviou link orçamento (-8)", "2c: Explicou consequências (-9)", "2e: Obteve aprovação explícita (sim/ok) (-10)", "3a: Checklist complementar (-8)", "3b: Vídeo do extra (-8)", "3c: Explicou serviços extras (-8)", "4a: Agradecimento padrão (-5)", "4b: Pediu avaliação no Google (-8)"] },
    { "id": 2515, "score": 8, "falhas": ["1b: Registrou resumo do acordado (-10)", "2d: Enviou link checklist (-8)", "2b: Enviou vídeo defeito (-10)", "2a: Enviou link orçamento (-8)", "2c: Explicou consequências (-9)", "2e: Obteve aprovação explícita (sim/ok) (-10)", "3a: Checklist complementar (-8)", "3b: Vídeo do extra (-8)", "3c: Explicou serviços extras (-8)", "4a: Agradecimento padrão (-5)", "4b: Pediu avaliação no Google (-8)"] }
  ],
  "MAUÁ": [
    { "id": 3167, "score": 0, "falhas": ["Faltou 1a: Cordial/respeitoso (-8)", "Faltou 1b: Registrou resumo do acordado (-10)", "Faltou 2d: Enviou link checklist (-8)", "Faltou 2b: Enviou vídeo defeito (-10)", "Faltou 2a: Enviou link orçamento (-8)", "Faltou 2c: Explicou consequências (-9)", "Faltou 2e: Obteve aprovação explícita (sim/ok) (-10)", "Faltou 3a: Checklist complementar (-8)", "Faltou 3b: Vídeo do extra (-8)", "Faltou 3c: Explicou serviços extras (-8)", "Faltou 4a: Agradecimento padrão (-5)", "Faltou 4b: Pediu avaliação no Google (-8)"] },
    { "id": 3323, "score": 0, "falhas": ["Faltou 1a: Cordial/respeitoso (-8)", "Faltou 1b: Registrou resumo do acordado (-10)", "Faltou 2d: Enviou link checklist (-8)", "Faltou 2b: Enviou vídeo defeito (-10)", "Faltou 2a: Enviou link orçamento (-8)", "Faltou 2c: Explicou consequências (-9)", "Faltou 2e: Obteve aprovação explícita (sim/ok) (-10)", "Faltou 3a: Checklist complementar (-8)", "Faltou 3b: Vídeo do extra (-8)", "Faltou 3c: Explicou serviços extras (-8)", "Faltou 4a: Agradecimento padrão (-5)", "Faltou 4b: Pediu avaliação no Google (-8)"] },
    { "id": 3184, "score": 8, "falhas": ["Faltou 1b: Registrou resumo do acordado (-10)", "Faltou 2d: Enviou link checklist (-8)", "Faltou 2b: Enviou vídeo defeito (-10)", "Faltou 2a: Enviou link orçamento (-8)", "Faltou 2c: Explicou consequências (-9)", "Faltou 2e: Obteve aprovação explícita (sim/ok) (-10)", "Faltou 3a: Checklist complementar (-8)", "Faltou 3b: Vídeo do extra (-8)", "Faltou 3c: Explicou serviços extras (-8)", "Faltou 4a: Agradecimento padrão (-5)", "Faltou 4b: Pediu avaliação no Google (-8)"] }
  ],
  "KENNEDY": [
    { "id": 228, "score": 0, "falhas": ["Faltou ser cordial/respeitoso (-8)", "Faltou registrar resumo do acordado (-10)", "Faltou enviar link checklist (-8)", "Faltou enviar vídeo defeito (-10)", "Faltou enviar link orçamento (-8)", "Faltou explicar consequências (-9)", "Faltou obter aprovação explícita (sim/ok) (-10)", "Faltou checklist complementar (-8)", "Faltou vídeo do extra (-8)", "Faltou explicar serviços extras (-8)", "Faltou agradecimento padrão (-5)", "Faltou pedir avaliação no Google (-8)"] },
    { "id": 244, "score": 0, "falhas": ["Faltou ser cordial/respeitoso (-8)", "Faltou registrar resumo do acordado (-10)", "Faltou enviar link checklist (-8)", "Faltou enviar vídeo defeito (-10)", "Faltou enviar link orçamento (-8)", "Faltou explicar consequências (-9)", "Faltou obter aprovação explícita (sim/ok) (-10)", "Faltou checklist complementar (-8)", "Faltou vídeo do extra (-8)", "Faltou explicar serviços extras (-8)", "Faltou agradecimento padrão (-5)", "Faltou pedir avaliação no Google (-8)"] },
    { "id": 273, "score": 0, "falhas": ["Faltou ser cordial/respeitoso (-8)", "Faltou registrar resumo do acordado (-10)", "Faltou enviar link checklist (-8)", "Faltou enviar vídeo defeito (-10)", "Faltou enviar link orçamento (-8)", "Faltou explicar consequências (-9)", "Faltou obter aprovação explícita (sim/ok) (-10)", "Faltou checklist complementar (-8)", "Faltou vídeo do extra (-8)", "Faltou explicar serviços extras (-8)", "Faltou agradecimento padrão (-5)", "Faltou pedir avaliação no Google (-8)"] }
  ],
  "JORGE BERETTA": [
    { "id": 3098, "score": 0, "falhas": ["Faltou cordial/respeitoso (-8)", "Faltou registrar resumo do acordado (-10)", "Faltou enviar link checklist (-8)", "Faltou enviar vídeo defeito (-10)", "Faltou enviar link orçamento (-8)", "Faltou explicar consequências (-9)", "Faltou obter aprovação explícita (-10)", "Faltou checklist complementar (-8)", "Faltou vídeo do extra (-8)", "Faltou explicar serviços extras (-8)", "Faltou agradecimento padrão (-5)", "Faltou pedir avaliação no Google (-8)"] },
    { "id": 3947, "score": 0, "falhas": ["Faltou cordial/respeitoso (-8)", "Faltou registrar resumo do acordado (-10)", "Faltou enviar link checklist (-8)", "Faltou enviar vídeo defeito (-10)", "Faltou enviar link orçamento (-8)", "Faltou explicar consequências (-9)", "Faltou obter aprovação explícita (-10)", "Faltou checklist complementar (-8)", "Faltou vídeo do extra (-8)", "Faltou explicar serviços extras (-8)", "Faltou agradecimento padrão (-5)", "Faltou pedir avaliação no Google (-8)"] },
    { "id": 3258, "score": 8, "falhas": ["Faltou registrar resumo do acordado (-10)", "Faltou enviar link checklist (-8)", "Faltou enviar vídeo defeito (-10)", "Faltou enviar link orçamento (-8)", "Faltou explicar consequências (-9)", "Faltou obter aprovação explícita (-10)", "Faltou checklist complementar (-8)", "Faltou vídeo do extra (-8)", "Faltou explicar serviços extras (-8)", "Faltou agradecimento padrão (-5)", "Faltou pedir avaliação no Google (-8)"] }
  ]
};

const CHATWOOT_URL = "https://chat.tork.services/app/accounts/5/conversations";

let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auditoria de Qualidade - Junho 2026</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #121212; color: #e0e0e0; padding: 20px; line-height: 1.6; }
        h1 { text-align: center; color: #ff5252; margin-bottom: 5px; }
        h3 { text-align: center; color: #b0bec5; font-weight: 300; margin-top: 0; }
        .unit-container { background-color: #1e1e1e; border-radius: 8px; padding: 20px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        .unit-title { font-size: 1.5em; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; color: #4fc3f7; }
        .conv-card { background-color: #2c2c2c; border-left: 5px solid #ef5350; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
        .conv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .score { font-size: 1.2em; font-weight: bold; background-color: #ef5350; color: white; padding: 5px 10px; border-radius: 4px; }
        .score.orange { background-color: #ff9800; }
        ul { margin: 0; padding-left: 20px; color: #ffab91; }
        li { margin-bottom: 5px; }
        .btn { display: inline-block; background-color: #03a9f4; color: white; text-decoration: none; padding: 8px 15px; border-radius: 4px; margin-top: 10px; font-weight: bold; }
        .btn:hover { background-color: #0288d1; }
    </style>
</head>
<body>
    <h1>Mural de Auditoria Crítica</h1>
    <h3>Top 3 Piores Atendimentos por Unidade - Junho 2026</h3>
`;

for (const [unit, convs] of Object.entries(data)) {
    html += \`\n    <div class="unit-container">\n        <div class="unit-title">\uD83C\uDFE2 Unidade: \${unit}</div>\`;
    for (const conv of convs) {
        const scoreClass = conv.score === 0 ? "" : "orange";
        html += \`
        <div class="conv-card">
            <div class="conv-header">
                <strong>\uD83D\uDCAC Conversa ID: #\${conv.id}</strong>
                <span class="score \${scoreClass}">Score: \${conv.score}/100</span>
            </div>
            <strong>\u274C Falhas Identificadas (IA):</strong>
            <ul>
                \${conv.falhas.map(f => \`<li>\${f}</li>\`).join('')}
            </ul>
            <a class="btn" href="\${CHATWOOT_URL}/\${conv.id}" target="_blank">\uD83D\uDD0D Abrir no Chatwoot</a>
        </div>\`;
    }
    html += \`\n    </div>\`;
}

html += \`
</body>
</html>
\`;

fs.writeFileSync('Relatorio_Auditoria_Junho_Final.html', html);
console.log('HTML generated!');
