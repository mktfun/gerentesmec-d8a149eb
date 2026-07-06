import fs from 'fs';
import path from 'path';

const rawData = fs.readFileSync('chatwoot_june_v5_full.json');
const data = JSON.parse(rawData)['JORGE BERETTA'];

// Blacklists refinadas
const blacklistNomes = ['Daniel', 'Rh', 'Financeiro', 'Central Vendas Do', 'Mec Kennedy'];
const blacklistTermos = ['PEÇAS', 'COMÉRCIO', 'DEVOLUÇÃO', 'FORNECEDOR', 'MECÂNICO', 'MECÂNICA', 'CARDAN', 'GRUPO', 'GROUP'];

const isFornecedor = (c) => {
    if (blacklistNomes.includes(c.senderName)) return true;
    const nomeUpper = c.senderName.toUpperCase();
    if (blacklistTermos.some(t => nomeUpper.includes(t))) return true;
    // Pega o Gerson (vocês trabalham com cardan da captiva)
    if (c.transcript.substring(0, 500).toLowerCase().includes('vocês trabalham com')) return true;
    return false;
};

const validos = data.filter(c => !isFornecedor(c));

// Formatar data: DD-MM-YYYY
const today = new Date();
const dateStr = [
  today.getDate().toString().padStart(2, '0'),
  (today.getMonth() + 1).toString().padStart(2, '0'),
  today.getFullYear()
].join('-');

const dirName = `conversas_jorge_beretta_${dateStr}`;

if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName);
}

let count = 0;
validos.forEach(c => {
    // Sanitizar o nome pra não quebrar arquivo no Windows
    const cleanName = c.senderName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = path.join(dirName, `Conv_${c.id}_${cleanName}.txt`);
    
    let header = `==============================================\n`;
    header += `Cliente: ${c.senderName}\n`;
    header += `ID Conversa: ${c.id}\n`;
    header += `Total de Mensagens: ${c.length}\n`;
    header += `==============================================\n\n`;
    
    fs.writeFileSync(fileName, header + c.transcript);
    count++;
});

console.log(`Total de clientes puros extraídos: ${count}`);
console.log(`Salvos na pasta: ${dirName}`);
