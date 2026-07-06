const fs = require('fs');
const data = JSON.parse(fs.readFileSync('chatwoot_june_gold_strict.json', 'utf8'));

const carijosConvos = data.filter(c => {
    const text = JSON.stringify(c);
    return text.includes('CARIJOS') || text.includes('carijos') || text.includes('Carijos');
});

console.log(`Found ${carijosConvos.length} conversations`);
console.log(JSON.stringify(carijosConvos.map(c => ({ id: c.id, messages: c.messages || c.messages_list || c.conversation || c.history || c.messages || c })), null, 2).substring(0, 1500));
