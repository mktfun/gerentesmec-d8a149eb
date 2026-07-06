import json

data = {
  "JABAQUARA": [
    { "id": 2576, "score": 0, "falhas": ["Faltou ser cordial/respeitoso (-8)", "Faltou registrar resumo do acordado (-10)", "Faltou enviar link do checklist (-8)", "Faltou enviar vídeo do defeito (-10)", "Faltou enviar link do orçamento (-8)", "Faltou explicar consequências (-9)", "Faltou obter aprovação explícita (-10)", "Faltou checklist complementar (-8)", "Faltou vídeo do extra (-8)", "Faltou explicar serviços extras (-8)", "Faltou agradecimento padrão (-5)", "Faltou pedir avaliação no Google (-8)"] },
    { "id": 3581, "score": 0, "falhas": ["Faltou tudo..."] },
    { "id": 2632, "score": 8, "falhas": ["Faltou quase tudo..."] }
  ],
  "PLANALTO": [
    { "id": 2665, "score": 0, "falhas": ["Falha total no atendimento (-100)"] },
    { "id": 2608, "score": 8, "falhas": ["Atendimento cordial (+8), mas sem envio de checklist/orçamento"] },
    { "id": 2883, "score": 13, "falhas": ["Atendimento básico, sem checklist, orçamento ou aceite formal"] }
  ],
  "RUDGE": [
    { "id": 3517, "score": 0, "falhas": ["Falhou em 100% da rubrica técnica"] },
    { "id": 2821, "score": 9, "falhas": ["Apenas explicou consequências básicas, não enviou vídeos/checklists"] },
    { "id": 2627, "score": 18, "falhas": ["Faltou envio de vídeos de prova e orçamento"] }
  ],
  "CARIJOS": [
    { "id": 2927, "score": 8, "falhas": ["Atendimento cordial, mas sem registros do acordo ou checklist"] },
    { "id": 3757, "score": 18, "falhas": ["Não obteve aprovação explícita e não mandou vídeo do extra"] },
    { "id": 3636, "score": 27, "falhas": ["Fluxo incompleto de aprovação do diagnóstico"] }
  ],
  "DOM PEDRO": [
    { "id": 3947, "score": 0, "falhas": ["Atendimento completamente fora do padrão (-100)"] },
    { "id": 3953, "score": 0, "falhas": ["Nenhum anexo, vídeo ou checklist enviado (-100)"] },
    { "id": 3948, "score": 8, "falhas": ["Apenas enviou link de orçamento, mas não obteve aceite e não mandou vídeos"] }
  ],
  "MAUÁ": [
    { "id": 3184, "score": 8, "falhas": ["Apenas atendimento cordial, zero execução técnica de checklist"] },
    { "id": 3845, "score": 8, "falhas": ["Apenas atendimento cordial, zero envio de comprovação"] },
    { "id": 3898, "score": 21, "falhas": ["Orçamento enviado, mas faltou checklist e vídeo (-79)"] }
  ],
  "DIADEMA": [
    { "id": 245, "score": 0, "falhas": ["Desrespeito à rubrica inteira (-100)"] },
    { "id": 1453, "score": 8, "falhas": ["Atendimento inicial cordial, resto do processo não documentado"] },
    { "id": 343, "score": 8, "falhas": ["Processo não documentado no Chatwoot"] }
  ],
  "KENNEDY": [
    { "id": 228, "score": 0, "falhas": ["Zero compliance com a rubrica (-100)"] },
    { "id": 273, "score": 0, "falhas": ["Zero compliance com a rubrica (-100)"] },
    { "id": 3964, "score": 26, "falhas": ["Faltou checklist complementar e vídeo de defeito principal"] }
  ],
  "JORGE BERETTA": [
    { "id": 2515, "score": 8, "falhas": ["Apenas atendimento cordial inicial"] },
    { "id": 3089, "score": 18, "falhas": ["Orçamento enviado sem checklist/vídeo"] },
    { "id": 2656, "score": 27, "falhas": ["Processo incompleto de upsell e encerramento (-73)"] }
  ]
}

html = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auditoria de Qualidade Real - Junho 2026</title>
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
        .score.green { background-color: #4caf50; }
        ul { margin: 0; padding-left: 20px; color: #ffab91; }
        li { margin-bottom: 5px; }
        .btn { display: inline-block; background-color: #03a9f4; color: white; text-decoration: none; padding: 8px 15px; border-radius: 4px; margin-top: 10px; font-weight: bold; }
        .btn:hover { background-color: #0288d1; }
    </style>
</head>
<body>
    <h1>Mural de Auditoria (Filtro Estrito: Apenas Conversas Reais)</h1>
    <h3>Top 3 Piores Atendimentos por Unidade - Junho 2026</h3>
"""

for unit, convs in data.items():
    html += f'\n    <div class="unit-container">\n        <div class="unit-title">🏢 Unidade: {unit}</div>'
    for conv in convs:
        score_class = ""
        if conv["score"] > 20: score_class = "green"
        elif conv["score"] > 0: score_class = "orange"
        
        falhas_html = "".join([f"<li>{f}</li>" for f in conv["falhas"]])
        
        html += f"""
        <div class="conv-card">
            <div class="conv-header">
                <strong>💬 Conversa ID: #{conv["id"]}</strong>
                <span class="score {score_class}">Score: {conv["score"]}/100</span>
            </div>
            <strong>❌ Falhas Identificadas pela IA:</strong>
            <ul>
                {falhas_html}
            </ul>
            <a class="btn" href="https://chat.tork.services/app/accounts/5/conversations/{conv["id"]}" target="_blank">🔍 Abrir no Chatwoot</a>
        </div>"""
    html += '\n    </div>'

html += """
</body>
</html>
"""

with open('Auditoria_Final_Reais.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Gerado")
