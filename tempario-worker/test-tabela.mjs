import { chromium } from 'playwright';
import path from 'path';

(async () => {
  console.log('Iniciando teste de Tabela Pós-Marca/Modelo...');
  const profilePath = path.resolve('data', 'browser_profile');
  
  const context = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();
  await page.goto("https://sistema.tempar.io/time-search", { waitUntil: "domcontentloaded" });
  
  console.log('Selecionando Automóveis...');
  await page.locator('button[role="radio"][value="1"]').click();

  // 1. Marca
  console.log('Clicando na Marca...');
  const marcaBtn = page.locator('label:has-text("Marca")').locator('button[aria-haspopup="dialog"]');
  await marcaBtn.click();
  await page.waitForTimeout(500);
  let popover = page.locator('[role="dialog"]').last();
  await popover.locator('input').fill('Audi');
  await page.waitForTimeout(500);
  await popover.locator('[role="option"]:has-text("Audi")').first().click();
  await page.waitForTimeout(1000);

  // 2. Modelo
  console.log('Clicando no Modelo...');
  const modeloBtn = page.locator('label:has-text("Modelo")').locator('button[aria-haspopup="dialog"]');
  await modeloBtn.click();
  await page.waitForTimeout(500);
  popover = page.locator('[role="dialog"]').last();
  await popover.locator('input').fill('A3');
  await page.waitForTimeout(500);
  
  // Pegar as opções
  const options = await popover.locator('[role="option"]').allTextContents();
  console.log('Opções de modelo encontradas:', options);

  // Clicar na primeira
  await popover.locator('[role="option"]').first().click();
  await page.waitForTimeout(2000);

  // 3. Tabela de Preços
  console.log('Verificando se a Tabela de Preços ativou...');
  const tabelaBtn = page.locator('h2:has-text("Tabela de preços")').locator('..').locator('button');
  const isDisabled = await tabelaBtn.isDisabled();
  console.log('Tabela de Preços está desativada?', isDisabled);

  await page.waitForTimeout(3000);
  await context.close();
})();
