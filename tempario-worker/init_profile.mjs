import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  const profilePath = path.resolve('data', 'browser_profile');
  
  console.log('Criando/Abrindo Persistent Context em:', profilePath);
  const context = await chromium.launchPersistentContext(profilePath, {
    headless: true,
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    permissions: [],
    viewport: { width: 1280, height: 720 },
  });

  const rawCookies = JSON.parse(fs.readFileSync('raw_cookies.json', 'utf8'));
  
  // O formato bruto do Chrome exportado pode ter campos "id" ou "session" incompatíveis com o Playwright
  const cleanCookies = rawCookies.map(c => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    expires: c.expirationDate,
    httpOnly: c.httpOnly,
    secure: c.secure,
    sameSite: c.sameSite === 'no_restriction' ? 'None' : c.sameSite || 'Lax'
  }));

  console.log('Injetando cookies no Persistent Context...');
  await context.addCookies(cleanCookies);
  
  console.log('Cookies injetados com sucesso!');
  
  // Vamos navegar até a home só pra gerar os dados de cache no perfil e validar
  const page = await context.newPage();
  console.log('Acessando o Tempario para consolidar a sessão...');
  await page.goto('https://sistema.tempar.io/time-search', { waitUntil: 'domcontentloaded' });
  
  const currentUrl = page.url();
  console.log('URL Final:', currentUrl);
  if (currentUrl.includes('login')) {
      console.log('❌ O cookie falhou ou o Cloudflare barrou!');
      await page.screenshot({ path: 'init_error.png' });
  } else {
      console.log('✅ Sessão consolidada perfeitamente na pasta de perfil!');
      await page.screenshot({ path: 'init_success.png' });
  }

  await context.close();
})();
