const fs = require('fs');

const files = [
  'src/pages/Index.tsx',
  'src/components/Dashboard/TvDashboard.tsx',
  'src/components/Crm/AuditPanel.tsx',
  'src/utils/scoreUtils.ts',
  'supabase/functions/ai-autonomous-evaluator/index.ts'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/Ã¡/g, 'á')
                     .replace(/Ã©/g, 'é')
                     .replace(/Ã­/g, 'í')
                     .replace(/Ã³/g, 'ó')
                     .replace(/Ãº/g, 'ú')
                     .replace(/Ã¢/g, 'â')
                     .replace(/Ãª/g, 'ê')
                     .replace(/Ã´/g, 'ô')
                     .replace(/Ã£/g, 'ã')
                     .replace(/Ãµ/g, 'õ')
                     .replace(/Ã§/g, 'ç')
                     .replace(/SÃ¡b/g, 'Sáb')
                     .replace(/MÃ©dia/g, 'Média')
                     .replace(/Ãšltimos/g, 'Últimos')
                     .replace(/AÃ§Ã£o/g, 'Ação')
                     .replace(/Ãºnico/g, 'único')
                     .replace(/Ãndice/g, 'Índice')
                     .replace(/Ã /g, 'à')
                     .replace(/Ã§Ãµes/g, 'ções')
                     .replace(/Ãªncia/g, 'ência')
                     .replace(/Ã§Ã£o/g, 'ção')
                     .replace(/â€”/g, '—')
                     .replace(/Â·/g, '·')
                     .replace(/â–²/g, '▲')
                     .replace(/â–¼/g, '▼')
                     .replace(/â”€/g, '─')
                     .replace(/SaÃºde/g, 'Saúde')
                     .replace(/GrÃ¡fico/g, 'Gráfico')
                     .replace(/EvoluÃ§Ã£o/g, 'Evolução')
                     .replace(/Ãºltimos/g, 'últimos');
    fs.writeFileSync(file, content, 'utf8');
  }
}
console.log('Fixed literals in files');
