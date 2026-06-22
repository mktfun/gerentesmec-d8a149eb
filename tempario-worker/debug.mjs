import { TemparioScraper } from './tempario-scraper.mjs';

(async () => {
  const scraper = new TemparioScraper();
  try {
    const result = await scraper.runQuery('test_debug', { placa: 'hig1972', servico: 'remoção de cambio' });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Scraper Error:', err);
  }
})();
