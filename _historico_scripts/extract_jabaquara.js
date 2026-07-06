const fs = require('fs');

const data = JSON.parse(fs.readFileSync('chatwoot_june_dump_bruteforce.json', 'utf8'));
const jabaquara = data['JABAQUARA'];

let md = '# JABAQUARA CONVERSATIONS\n\n';

jabaquara.forEach((conv, index) => {
    md += `## Conversation ${index + 1} (ID: ${conv.id})\n`;
    md += `${conv.transcript}\n\n`;
    md += `--------------------------------------------------\n\n`;
});

fs.writeFileSync('jabaquara_transcripts.md', md, 'utf8');
console.log('Saved to jabaquara_transcripts.md');
