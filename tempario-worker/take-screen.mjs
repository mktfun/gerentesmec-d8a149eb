import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

(async () => {
  const profilePath = path.resolve('data', 'browser_profile');
  const context = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    args: ['--disable-blink-features=AutomationControlled']
  });

  const page = await context.newPage();

  if (fs.existsSync('raw_cookies.json')) {
     const rawCookies = JSON.parse(fs.readFileSync('raw_cookies.json', 'utf8'));
     const sanitizedCookies = rawCookies.map(cookie => {
        if (cookie.sameSite === 'no_restriction' || cookie.sameSite === 'unspecified') cookie.sameSite = 'None';
        return cookie;
     });
     await context.addCookies(sanitizedCookies);
  }

  await page.goto("https://sistema.tempar.io/time-search", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'screen1.png' });

  // Try to find automobiles
  const btnAutomoveis = page.locator('button[role="radio"][value="1"]');
  if (await btnAutomoveis.isVisible()) {
      await btnAutomoveis.click();
  } else {
      console.log("Btn automoveis not found");
  }

  const plateInput = page.locator('input[name="plate"]');
  try {
      await plateInput.waitFor({ state: 'visible', timeout: 5000 });
      await plateInput.fill('EZR8759');
      
      const buscarBtn = page.locator('button:has-text("Buscar")');
      await buscarBtn.click();
  } catch(e) {
      console.log('Error with plate input: ', e.message);
  }
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'screen2.png' });

  await context.close();
})();
