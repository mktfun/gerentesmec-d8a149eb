import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: 'storageState.json' });
  const page = await context.newPage();
  
  await page.goto('https://sistema.tempar.io/time-search', { waitUntil: 'networkidle' });
  
  // Aguarda uns 2 segundos pra ter certeza que carregou
  await page.waitForTimeout(2000);
  
  const html = await page.content();
  fs.writeFileSync('dump.html', html);
  
  console.log('HTML salvo em dump.html');
  await browser.close();
})();
