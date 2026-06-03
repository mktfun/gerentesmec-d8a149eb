import fs from 'fs';
import path from 'path';

// Padrões de "mojibake" comuns observados por double UTF-8 encoding
const BAD_PATTERNS = [
  'Ã¡', 'Ã©', 'Ã­', 'Ã³', 'Ãº', 'Ã¢', 'Ãª', 'Ã´', 'Ã£', 'Ãµ', 'Ã§', 'Ã ',
  'Ã\x81', 'Ã\x89', 'Ã\x8D', 'Ã\x93', 'Ã\x9A', 'Ã\x82', 'Ã\x8A', 'Ã\x94', 'Ã\x83', 'Ã\x95', 'Ã\x87',
  'Â·', 'â€', 'â€”', 'â€“', 'â”', 'â–'
];

const SEARCH_DIRS = ['src', 'supabase/functions', 'scripts'];

function checkDir(dir) {
  if (!fs.existsSync(dir)) return 0;
  
  let errors = 0;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    
    // Ignorar pastas ocultas ou de módulos
    if (file.startsWith('.') || file === 'node_modules') continue;
    
    // Se for diretório, buscar recursivamente
    if (fs.statSync(fullPath).isDirectory()) {
      errors += checkDir(fullPath);
    } 
    // Só verificar arquivos de código/texto
    else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.md')) {
      // Ignorar o próprio verificador e o fixer, pois eles contêm as strings-alvo no código fonte
      if (file === 'check-encoding.mjs' || file === 'encodingFixer.ts' || file === 'fix_mojibake.cjs') continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      
      const foundPatterns = BAD_PATTERNS.filter(pattern => content.includes(pattern));
      
      if (foundPatterns.length > 0) {
        console.error(`[Encoding Error] Mojibake encontrado no arquivo: ${fullPath}`);
        console.error(`   Padrões encontrados: ${foundPatterns.join(', ')}`);
        errors++;
      }
    }
  }
  return errors;
}

console.log('Iniciando verificação de caracteres corrompidos (Mojibake)...');
let totalErrors = 0;

SEARCH_DIRS.forEach(dir => {
  totalErrors += checkDir(dir);
});

if (totalErrors > 0) {
  console.error(`\n[FALHA] Build abortado! Foram encontrados caracteres corrompidos em ${totalErrors} arquivo(s).`);
  console.error('Por favor, corrija a acentuação antes de realizar o commit ou build da aplicação.');
  process.exit(1);
} else {
  console.log('Verificação concluída. Nenhum mojibake encontrado!');
  process.exit(0);
}
