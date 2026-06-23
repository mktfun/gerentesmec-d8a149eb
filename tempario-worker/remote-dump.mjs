
import { chromium } from 'playwright';
async function dump() {
  const b = await chromium.launchPersistentContext('/home/servidor/tempario-worker/browser_profile', { headless: true });
  const p = b.pages().length > 0 ? b.pages()[0] : await b.newPage();
  await p.goto('https://sistema.tempar.io/time-search');
  await p.waitForTimeout(4000);
  await p.locator('input[placeholder*="Placa"]').fill('EZR8759');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(3000);
  const d = p.locator('[role="dialog"], [role="alertdialog"]').first();
  if(await d.isVisible()) {
    console.log(await d.evaluate(el => el.outerHTML).catch(e=>e.message));
  } else {
    console.log('No dialog');
  }
  await b.close();
}
dump();
