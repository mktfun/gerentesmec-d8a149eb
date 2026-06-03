/**
 * encodingFixer.ts
 * 
 * Utilitário para limpar textos corrompidos (mojibake) que possam 
 * ter vindo do banco de dados ou retornos de webhooks.
 * 
 * Só use em textos de interface. Não aplique em IDs, URLs ou propriedades de JSON.
 */

export function sanitizeMojibake(text: string): string {
  if (!text) return text;
  
  return text
    // Acentuação minúscula
    .replace(/Ã¡/g, 'á')
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
    // Acentuação maiúscula
    .replace(/Ã /g, 'À')
    .replace(/Ã/g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã/g, 'Í')
    .replace(/Ã“/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã‚/g, 'Â')
    .replace(/ÃŠ/g, 'Ê')
    .replace(/Ã”/g, 'Ô')
    .replace(/Ãƒ/g, 'Ã')
    .replace(/Ã•/g, 'Õ')
    .replace(/Ã‡/g, 'Ç')
    // Outros casos comuns identificados no sistema
    .replace(/SÃ¡b/g, 'Sáb')
    .replace(/MÃ©dia/g, 'Média')
    .replace(/Ãšltimos/g, 'Últimos')
    .replace(/AÃ§Ã£o/g, 'Ação')
    .replace(/Ãºnico/g, 'único')
    .replace(/Ãndice/g, 'Índice')
    .replace(/Ã§Ãµes/g, 'ções')
    .replace(/Ãªncia/g, 'ência')
    .replace(/Ã§Ã£o/g, 'ção')
    // Símbolos de formatação
    .replace(/â€”/g, '—')
    .replace(/Â·/g, '·')
    .replace(/â–²/g, '▲')
    .replace(/â–¼/g, '▼')
    .replace(/â”€/g, '─');
}
