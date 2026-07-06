const fs = require('fs');

const filePath = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\chatwoot_june_dump_bruteforce.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const jorgeBeretta = data['JORGE BERETTA'] || [];

let out = `Found ${jorgeBeretta.length} conversations for JORGE BERETTA.\n`;

jorgeBeretta.forEach(conv => {
    out += `\n--- ID: ${conv.id} ---\n`;
    out += (conv.transcript || 'No transcript') + '\n';
    out += '-'.repeat(40) + '\n';
});

fs.writeFileSync('C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\output.txt', out);
