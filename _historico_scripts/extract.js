const fs = require('fs');

const filePath = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\chatwoot_june_dump_bruteforce.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const jorgeBeretta = data['JORGE BERETTA'] || [];
console.log(`Found ${jorgeBeretta.length} conversations for JORGE BERETTA.`);

jorgeBeretta.forEach(conv => {
    console.log(`\n--- ID: ${conv.id} ---`);
    console.log(conv.transcript || 'No transcript');
    console.log('-'.repeat(40));
});
