import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import fs from 'fs';

chromium.use(stealth());

// Credenciais de login do Tempario
const TEMPARIO_EMAIL    = process.env.TEMPARIO_EMAIL    || 'lovablegit02@gmail.com';
const TEMPARIO_PASSWORD = process.env.TEMPARIO_PASSWORD || 'David9560_';

(async () => {
  const profilePath = path.resolve('data', 'browser_profile');

  console.log('Abrindo Persistent Context em:', profilePath);
  const context = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    permissions: [],
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // ─── 1. Verificar se já está logado ───────────────────────────────────────
  console.log('Verificando sessão existente...');
  await page.goto('https://sistema.tempar.io/time-search', { waitUntil: 'domcontentloaded', timeout: 20000 });
  
  if (!page.url().includes('login') && !page.url().includes('planos') && !page.url().includes('sign-in')) {
    console.log('✅ Sessão válida encontrada no perfil! URL:', page.url());
    await context.close();
    return;
  }

  // ─── 2. Injetar raw_cookies.json ──────────────────────────────────────────
  try {
    if (fs.existsSync('raw_cookies.json')) {
      console.log('Injetando raw_cookies.json...');
      const rawCookies = JSON.parse(fs.readFileSync('raw_cookies.json', 'utf8'));
      const sanitizedCookies = rawCookies.map(cookie => {
        if (cookie.sameSite === 'no_restriction' || cookie.sameSite === 'unspecified') {
          cookie.sameSite = 'None';
        }
        return cookie;
      });
      await context.addCookies(sanitizedCookies);
      console.log('Cookies injetados com sucesso.');
      await page.goto('https://sistema.tempar.io/time-search', { waitUntil: 'domcontentloaded', timeout: 20000 });
      if (!page.url().includes('login') && !page.url().includes('planos') && !page.url().includes('sign-in')) {
        console.log('✅ Sessão válida encontrada no perfil! URL:', page.url());
        await context.close();
        return;
      }
    }
  } catch (e) {
    console.error('Erro ao injetar cookies:', e);
  }

  console.log('Tentando login real...');
  
  await page.goto('https://sistema.tempar.io/login', { waitUntil: 'domcontentloaded' });
  
  // Aguarda Cloudflare resolver (pode demorar até 15-20s se for Turnstile invisible)
  console.log('Aguardando Cloudflare (se houver)...');
  await page.waitForTimeout(15000); // 15 segundos para dar tempo do Cloudflare carregar e resolver

  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.isVisible()) {
    console.log('Formulário de login visível. Inserindo credenciais...');
    await emailInput.fill(TEMPARIO_EMAIL);
    await page.locator('input[type="password"]').fill(TEMPARIO_PASSWORD);
    
    // O botão Entrar
    await page.locator('button:has-text("Entrar")').click();
    
    // Aguardar redirecionamento para o dashboard
    console.log('Aguardando redirecionamento após login...');
    await page.waitForTimeout(10000); // 10s para processar
    
    const finalUrl = page.url();
    if (finalUrl.includes('login') || finalUrl.includes('planos') || finalUrl.includes('sign-in')) {
      console.log('❌ Login falhou! Verifique as credenciais ou Cloudflare.');
      await page.screenshot({ path: 'login_error.png' });
    } else {
      console.log('✅ Login real feito com sucesso! URL:', finalUrl);
    }
  } else {
    console.log('❌ Input de email não apareceu. Preso no Cloudflare? Tirando print...');
    await page.screenshot({ path: 'login_error.png' });
  }

  await context.close();
  process.exit(1);
})().catch(err => {
  console.error('Erro no init_profile:', err.message);
  process.exit(1);
});
