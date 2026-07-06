const fs = require('fs');

const data = JSON.parse(fs.readFileSync('chatwoot_june_dump_bruteforce.json', 'utf8'));
const maua = data['MAUÁ'];
let output = '';

if (!maua) {
  output += "No MAUÁ conversations found.\n";
} else {
  maua.slice(0, 10).forEach((conv, index) => {
    output += `\n--- Conversation ${index + 1} (ID: ${conv.id}) ---\n`;
    output += conv.transcript + '\n';
  });
}

fs.writeFileSync('maua_convos.txt', output);
