import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  console.log('Iniciando teste real com a Placa OTM2022...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: 'storageState.json' });
  const page = await context.newPage();
  
  await page.goto('https://sistema.tempar.io/time-search', { waitUntil: 'networkidle' });
  
  // 1. Seleciona "Automóveis"
  console.log('Selecionando Automóveis...');
  const btnAutomoveis = page.locator('button[role="radio"][value="1"]');
  await btnAutomoveis.waitFor({ state: 'visible' });
  await btnAutomoveis.click();
  
  // 2. Preenche a placa e busca
  console.log('Preenchendo placa e buscando...');
  const plateInput = page.locator('input[name="plate"]');
  await plateInput.waitFor({ state: 'attached' });
  await plateInput.fill('OTM2022');
  
  const buscarBtn = page.locator('button:has-text("Buscar")');
  await buscarBtn.click();
  
  // Espera a interface reagir (ex: carregar os dados do carro)
  console.log('Aguardando resultado da busca...');
  await page.waitForTimeout(5000); // 5s pra dar tempo de carregar a API deles
  
  await page.screenshot({ path: 'resultado_placa.png' });
  console.log('Screenshot salvo em resultado_placa.png');
  
  // Salva o HTML para entendermos a tabela de serviços
  const html = await page.content();
  fs.writeFileSync('resultado_placa.html', html);
  console.log('HTML salvo em resultado_placa.html');
  
  await browser.close();
})();
