import { chromium } from 'playwright';

async function dumpModal() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://app.tempario.com.br');
  await page.waitForTimeout(2000);
  
  // Login
  await page.locator('input[name="username"], input[type="email"], input[type="text"]').fill('gerentesmec');
  await page.locator('input[name="password"], input[type="password"]').fill('davi1234');
  await page.locator('button[type="submit"], button:has-text("Entrar")').click();
  
  await page.waitForTimeout(4000);
  
  // Pesquisar placa
  await page.locator('input[placeholder*="Placa"], input[name="placa"], input[name="plate"]').fill('EZR8759');
  await page.keyboard.press('Enter');
  
  await page.waitForTimeout(3000);
  
  const dialog = page.locator('[role="alertdialog"], [role="dialog"]').first();
  if (await dialog.isVisible()) {
    console.log("Modal encontrado!");
    const html = await dialog.evaluate(el => el.outerHTML);
    console.log("HTML do modal:\n", html.substring(0, 3000));
  } else {
    console.log("Nenhum modal...");
  }
  
  await browser.close();
}

dumpModal();
