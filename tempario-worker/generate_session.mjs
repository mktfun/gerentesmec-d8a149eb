import { chromium } from 'playwright';

(async () => {
  console.log('Abrindo o navegador para você fazer o login...');
  // Abre o navegador visualmente para você conseguir resolver o captcha
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navegando para o Tempario...');
  await page.goto('https://sistema.tempar.io/login');

  console.log('================================================================');
  console.log('POR FAVOR, FAÇA O LOGIN E RESOLVA O CAPTCHA NA JANELA QUE ABRIR!');
  console.log('O script vai aguardar até você chegar na tela inicial do sistema.');
  console.log('================================================================');

  // Aguarda até o redirecionamento para o dashboard após o login bem-sucedido
  await page.waitForURL('**/time-search**', { timeout: 0 }); // 0 = espera infinita

  console.log('✅ Login detectado com sucesso!');
  
  // Salva os cookies e a sessão
  await context.storageState({ path: 'storageState.json' });
  console.log('💾 Sessão salva em storageState.json!');

  await browser.close();
})();
