/**
 * auto-renew.mjs
 * 
 * Keep-alive de sessão do Tempario.
 * Roda via PM2 cron todo dia às 7h.
 * 
 * Estratégia: acessa uma página INTERNA (já autenticada) para renovar
 * os cookies sem passar pelo login/Cloudflare. Se a sessão expirou,
 * loga o alerta e sai sem travar o Worker principal.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_STATE_PATH = path.join(__dirname, 'storageState.json');
const LOG_DIR = path.join(__dirname, 'data', 'logs');
const SCREENSHOT_DIR = path.join(__dirname, 'data', 'errors');

// Garante que os diretórios existem
for (const dir of [LOG_DIR, SCREENSHOT_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function log(level, msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${msg}`;
  console.log(line);
  fs.appendFileSync(path.join(LOG_DIR, 'auto-renew.log'), line + '\n');
}

async function renewSession() {
  log('INFO', '🔄 Iniciando keep-alive de sessão do Tempario...');

  // Verifica se o storageState existe
  if (!fs.existsSync(STORAGE_STATE_PATH)) {
    log('ERROR', '❌ storageState.json não encontrado. Faça o login manual primeiro.');
    process.exit(1);
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      storageState: STORAGE_STATE_PATH,
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    log('INFO', '🌐 Navegando para página interna do Tempario...');
    await page.goto('https://sistema.tempar.io/time-search', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    const currentUrl = page.url();
    log('INFO', `📍 URL atual: ${currentUrl}`);

    // Verifica se foi redirecionado para o login
    if (currentUrl.includes('login') || currentUrl.includes('sign')) {
      const screenshotPath = path.join(SCREENSHOT_DIR, `renew_expired_${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath });
      log('ERROR', `❌ SESSÃO EXPIRADA! Foi redirecionado para: ${currentUrl}`);
      log('ERROR', `   Screenshot: ${screenshotPath}`);
      log('ERROR', '   ⚠️  AÇÃO NECESSÁRIA: Faça o login manual no Tempario e gere um novo storageState.json');
      await browser.close();
      process.exit(1);
    }

    // Sessão válida! Aguarda um pouco para os cookies de sessão serem renovados pelo servidor
    log('INFO', '✅ Sessão válida! Aguardando renovação dos cookies...');
    await page.waitForTimeout(3000);

    // Salva o storageState atualizado com os cookies renovados
    await context.storageState({ path: STORAGE_STATE_PATH });
    log('INFO', `💾 storageState.json atualizado com cookies frescos em: ${STORAGE_STATE_PATH}`);

    // Tira screenshot de confirmação
    const successScreenshot = path.join(SCREENSHOT_DIR, `renew_success_${Date.now()}.png`);
    await page.screenshot({ path: successScreenshot });
    log('INFO', `📸 Screenshot de confirmação: ${successScreenshot}`);

    await browser.close();
    log('INFO', '🎉 Keep-alive concluído com sucesso! Sessão renovada para o próximo ciclo.');
    process.exit(0);

  } catch (err) {
    log('ERROR', `💥 Erro inesperado durante o keep-alive: ${err.message}`);
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    process.exit(1);
  }
}

renewSession();
