const fs = require('fs');
const data = JSON.parse(fs.readFileSync('chatwoot_june_dump.json', 'utf8'));
const kennedy = data['KENNEDY'];
for (const conv of kennedy) {
    console.log(`\n\n=== CONVERSATION ID: ${conv.id} ===`);
    console.log(conv.transcript);
}
