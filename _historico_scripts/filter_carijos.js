const fs = require('fs');
const data = JSON.parse(fs.readFileSync('chatwoot_june_dump_bruteforce.json'));
// Filter by some logic, maybe there is a 'CARIJOS' unit in the data
let carijos = data.filter(c => {
    // Check if the conversation belongs to CARIJOS.
    // Let's check custom_attributes, inbox, tags, etc.
    const str = JSON.stringify(c).toUpperCase();
    return str.includes('CARIJO');
});

// Since the prompt says: "Avalie as 10 conversas da unidade CARIJOS", maybe they are exactly 10.
// Let's just output the messages of these 10 conversations to a text file for the LLM to read.
let output = '';
for (const conv of carijos) {
    output += `\n\n=== CONVERSATION ID: ${conv.id || conv.conversation_id} ===\n`;
    if (conv.messages) {
        for (const msg of conv.messages) {
            output += `[${msg.sender_type || (msg.sender && msg.sender.type)}] ${msg.content || msg.body}\n`;
        }
    } else {
        output += JSON.stringify(conv, null, 2);
    }
}
fs.writeFileSync('carijos_convos.txt', output);
console.log('Found:', carijos.length);
