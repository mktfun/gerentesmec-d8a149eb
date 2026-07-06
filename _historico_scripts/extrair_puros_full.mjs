import fs from 'fs';
import path from 'path';

// Lê o banco FULL gerado da Jorge Beretta (248 brutas -> 44 Densas)
const rawData = fs.readFileSync('chatwoot_full_history.json');
const data = JSON.parse(rawData)['JORGE BERETTA'];

// Blacklists Severas 
const blacklistNomes = ['Daniel', 'Rh', 'Financeiro', 'Central Vendas Do', 'Mec Kennedy'];
const blacklistTermos = ['PEÇAS', 'COMÉRCIO', 'DEVOLUÇÃO', 'FORNECEDOR', 'MECÂNICO', 'MECÂNICA', 'CARDAN', 'GRUPO', 'GROUP', 'LOGGI', 'CAMBIO', 'TORK'];

const isFornecedor = (c) => {
    if (!c.senderName) return true;
    if (blacklistNomes.includes(c.senderName)) return true;
    
    const nomeUpper = c.senderName.toUpperCase();
    if (blacklistTermos.some(t => nomeUpper.includes(t))) return true;
    
    // Heurística de Direção (Se a oficina pedir orçamento, descarta)
    const inicio = c.transcript.substring(0, 500).toLowerCase();
    if (inicio.includes('vocês trabalham com')) return true;
    if (inicio.includes('precisava do valor')) return true;
    
    return false;
};

const validos = data.filter(c => !isFornecedor(c));

const dirName = `conversas_jorge_beretta_FULL_PERIOD`;

if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName);
}

let count = 0;
validos.forEach(c => {
    const cleanName = c.senderName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = path.join(dirName, `Conv_${c.id}_${cleanName}.txt`);
    
    let header = `==============================================\n`;
    header += `Cliente: ${c.senderName}\n`;
    header += `ID Conversa: ${c.id}\n`;
    header += `Total de Mensagens: ${c.length}\n`;
    header += `Status de Triagem: APROVADO PELO ALGORITMO\n`;
    header += `==============================================\n\n`;
    
    fs.writeFileSync(fileName, header + c.transcript);
    count++;
});

console.log(`\n================================`);
console.log(`Filtro Blacklist & Fornecedores:`);
console.log(`Base de Entrada: ${data.length} conversas.`);
console.log(`Expurgadas (Lixo/Interno/B2B): ${data.length - count} conversas.`);
console.log(`Salvos na pasta final: ${count} CLIENTES PUROS!`);
console.log(`Diretório: ${dirName}`);
console.log(`================================`);
