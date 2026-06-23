import { chromium } from 'playwright';
import path from 'path';

(async () => {
  console.log('Iniciando teste de Dropdown...');
  const profilePath = path.resolve('data', 'browser_profile');
  
  const context = await chromium.launchPersistentContext(profilePath, {
    headless: false, // Visual para ver o que acontece
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();
  await page.goto("https://sistema.tempar.io/time-search", { waitUntil: "domcontentloaded" });
  
  console.log('Selecionando Automóveis...');
  await page.locator('button[role="radio"][value="1"]').click();

  // Tentando clicar na Marca
  console.log('Clicando na Marca...');
  // O botão de marca é o que tem a label "Marca"
  const marcaLabel = page.locator('label:has-text("Marca")');
  const marcaBtn = marcaLabel.locator('button[aria-haspopup="dialog"]');
  await marcaBtn.click();
  await page.waitForTimeout(1000);
  
  // Quando clica, abre um Popover [role="dialog"]. Dentro dele tem um input para buscar e uma lista
  console.log('Procurando Popover da Marca...');
  const popover = page.locator('[role="dialog"]').last();
  await popover.waitFor({ state: 'visible' });
  
  // Digitando a marca "Audi"
  console.log('Digitando AUDI...');
  const inputBusca = popover.locator('input[placeholder="Buscar..."]'); // Chute do placeholder
  if (await inputBusca.isVisible()) {
      await inputBusca.fill('Audi');
      await page.waitForTimeout(500);
  }
  
  // Selecionando a opção
  console.log('Selecionando a opção...');
  const option = popover.locator('[role="option"]:has-text("Audi")');
  await option.first().click();
  await page.waitForTimeout(1000);

  console.log('Fim do teste. Verifique a tela.');
  await page.waitForTimeout(5000);
  await context.close();
})();
