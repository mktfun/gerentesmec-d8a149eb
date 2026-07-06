const fs = require('fs');

const data = JSON.parse(fs.readFileSync('chatwoot_june_dump_bruteforce.json', 'utf8'));
const maua = data['MAUÁ'];

if (!maua) {
  console.log("No MAUÁ conversations found.");
} else {
  maua.slice(0, 10).forEach((conv, index) => {
    console.log(`\n--- Conversation ${index + 1} (ID: ${conv.id}) ---`);
    console.log(conv.transcript);
  });
}
