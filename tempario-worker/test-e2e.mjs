import { TemparioScraper } from './tempario-scraper.mjs';

(async () => {
  const scraper = new TemparioScraper({ headless: true });
  console.log('Iniciando scraper...');
  
  const query = {
    placa: 'OTM2022',
    servico: 'Pastilha'
  };
  
  const result = await scraper.runQuery('test-request-id', query);
  
  console.log('Resultado do Worker:');
  console.log(JSON.stringify(result, null, 2));
})();
