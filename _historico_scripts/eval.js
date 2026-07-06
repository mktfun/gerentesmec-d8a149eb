const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:/Users/admin/.gemini/antigravity/scratch/gerentesmec/chatwoot_june_gold_strict.json', 'utf8'));

let kennedy = data['KENNEDY'];
if (!kennedy) {
    for (const key in data) {
        if (key.toUpperCase().includes('KENNEDY')) {
            kennedy = data[key];
            break;
        }
    }
}

const results = [];

for (const conv of kennedy) {
    const transcript = conv.transcript || "";
    let score = 0;
    const falhas = [];

    if (/\b(ok|pode fazer)\b/i.test(transcript)) {
        score += 100;
    } else {
        score -= 10;
        falhas.push("2e");
    }

    if (transcript.includes("(Arquivo/Mídia anexado)")) {
        score += 100;
    } else {
        score -= 10;
        falhas.push("2b");
    }

    results.push({
        id: conv.id,
        score: score,
        falhas: falhas
    });
}

console.log("```json");
console.log(JSON.stringify(results, null, 2));
console.log("```");
