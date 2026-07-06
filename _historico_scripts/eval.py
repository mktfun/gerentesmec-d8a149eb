import json
import re

file_path = "C:/Users/admin/.gemini/antigravity/scratch/gerentesmec/chatwoot_june_gold_strict.json"

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

kennedy_conversations = data.get("KENNEDY", [])
if not kennedy_conversations:
    for key in data:
        if "KENNEDY" in key.upper():
            kennedy_conversations = data[key]
            break

results = []

for conv in kennedy_conversations:
    conv_id = conv.get("id")
    transcript = conv.get("transcript", "")
    
    score = 0
    falhas = []
    
    # 2e: "ok" or "pode fazer"
    if re.search(r'\b(ok|pode fazer)\b', transcript, re.IGNORECASE):
        score += 100
    else:
        score -= 10
        falhas.append("2e")
        
    # 2b: "(Arquivo/Mídia anexado)"
    if "(Arquivo/Mídia anexado)" in transcript:
        score += 100
    else:
        score -= 10
        falhas.append("2b")
        
    results.append({
        "id": conv_id,
        "score": score,
        "falhas": falhas
    })

print("```json")
print(json.dumps(results, indent=2))
print("```")
