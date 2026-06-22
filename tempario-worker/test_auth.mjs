import { chromium } from 'playwright';

(async () => {
  console.log('Iniciando validação de sessão do Tempario...');
  const browser = await chromium.launch({ headless: true });
  
  // Instanciar context com storageState salvo
  console.log('Carregando storageState.json...');
  const context = await browser.newContext({
    storageState: 'storageState.json'
  });
  
  const page = await context.newPage();
  
  console.log('Navegando para sistema.tempar.io...');
  await page.goto('https://sistema.tempar.io', { waitUntil: 'networkidle' });
  
  const title = await page.title();
  console.log('Título da página:', title);
  
  // Verificar se fomos redirecionados para o login
  const url = page.url();
  console.log('URL atual:', url);
  
  if (url.includes('login')) {
    console.error('❌ Sessão expirada ou inválida. Redirecionado para a tela de login.');
  } else {
    console.log('✅ Sessão válida! Estamos dentro do sistema.');
    
    // Tira um screenshot pra confirmar
    await page.screenshot({ path: 'auth_success.png' });
    console.log('Screenshot salvo em auth_success.png');
  }
  
  await browser.close();
})();
