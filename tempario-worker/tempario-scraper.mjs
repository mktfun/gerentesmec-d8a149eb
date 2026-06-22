import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

export class TemparioScraper {
  constructor(options = {}) {
    this.storageStatePath = options.storageStatePath || 'storageState.json';
    this.errorDir = options.errorDir || path.join(process.cwd(), 'data', 'errors');
    this.timeout = options.timeout || 60000;
    this.headless = options.headless !== false;
    
    if (!fs.existsSync(this.errorDir)) {
      fs.mkdirSync(this.errorDir, { recursive: true });
    }
  }

  async validateSession() {
    if (!fs.existsSync(this.storageStatePath)) {
      return false;
    }
    return true;
  }

  async runQuery(requestId, queryParams) {
    if (!(await this.validateSession())) {
      return {
        request_id: requestId,
        status: "session_expired",
        error: { code: "SESSION_EXPIRED", message: "storageState.json não encontrado" }
      };
    }

    const startTime = Date.now();
    let browser;
    let page;
    
    try {
      browser = await chromium.launch({ headless: this.headless });
      const context = await browser.newContext({ storageState: this.storageStatePath });
      page = await context.newPage();
      
      // Navigate to time search
      await page.goto('https://sistema.tempar.io/time-search', { waitUntil: 'networkidle' });
      
      // Check if redirected to login
      if (page.url().includes('login')) {
        await browser.close();
        return {
          request_id: requestId,
          status: "session_expired",
          error: { code: "SESSION_EXPIRED", message: "Redirecionado para login" },
          meta: { duration_ms: Date.now() - startTime }
        };
      }

      // Step 1: Select Segment (Automóveis = 1, default)
      // Tempario uses Radix UI.
      const btnAutomoveis = page.locator('button[role="radio"][value="1"]');
      await btnAutomoveis.waitFor({ state: 'visible', timeout: 10000 });
      await btnAutomoveis.click();

      // Wait a bit for the plate input to become enabled
      const plateInput = page.locator('input[name="plate"]');
      await plateInput.waitFor({ state: 'visible', timeout: 5000 });
      
      // Step 2: Search by Plate
      if (queryParams.placa) {
        // Wait until it's not disabled
        await plateInput.waitFor({ state: 'attached' });
        // Fill the plate
        await plateInput.fill(queryParams.placa);
        
        // Click 'Buscar' next to it. In the HTML, it's a button with text "Buscar".
        const buscarBtn = page.locator('button:has-text("Buscar")');
        await buscarBtn.click();
        
        // Wait dynamically for results or errors to appear
        console.log('Aguardando resultados da busca...');
        await Promise.race([
          page.waitForSelector('span:has-text("Modelo:")', { state: 'visible', timeout: 10000 }).catch(() => null),
          page.waitForSelector('text="não encontrado"', { state: 'visible', timeout: 10000 }).catch(() => null),
          page.waitForSelector('text="Placa inválida"', { state: 'visible', timeout: 10000 }).catch(() => null),
          page.waitForSelector('[role="alertdialog"], [role="dialog"]', { state: 'visible', timeout: 10000 }).catch(() => null)
        ]);
        
        // Verifica se apareceu algum alerta/modal na tela (ex: "A placa pertence a uma moto" ou "Atualizar modelo")
        const dialog = page.locator('[role="alertdialog"], [role="dialog"]').first();
        if (await dialog.isVisible()) {
           const dialogText = await dialog.textContent();
           if (dialogText.includes("Atualizar o modelo")) {
               throw new Error(JSON.stringify({ code: "UPDATE_VEHICLE_REQUIRED", message: "O Tempario exigiu o preenchimento dos dados (Marca/Modelo) para esta placa." }));
           }
           throw new Error(JSON.stringify({ code: "WRONG_CATEGORY_OR_ALERT", message: dialogText.trim() }));
        }

        // Verifica se deu "não encontrado" ou "Placa inválida"
        const notFoundText = await page.locator('text="não encontrado"').isVisible();
        const invalidPlateText = await page.locator('text="Placa inválida"').isVisible();
        
        if (notFoundText || invalidPlateText) {
           throw new Error("NOT_FOUND_PLATE");
        }

        // Step 2b: After plate search, Tempario shows a list of vehicle cards.
        console.log('Procurando e selecionando o veículo nos resultados...');
        
        // Tentar extrair os dados do veículo renderizados na tela e CLICAR no card para habilitar a Tabela
        const modeloLocator = page.locator('span:has-text("Modelo:")');
        // Usar await page.waitForTimeout pequeno extra para garantir que todos os cards renderizaram (caso haja múltiplos)
        await page.waitForTimeout(1000);
        
        const count = await modeloLocator.count();
        if (count > 1) {
          console.log(`Múltiplos veículos encontrados (${count}). Lançando erro AMBIGUOUS_VEHICLE...`);
          const options = [];
          for (let i = 0; i < count; i++) {
            options.push((await modeloLocator.nth(i).textContent()).replace('Modelo: ', '').trim());
          }
          throw new Error(JSON.stringify({ code: "AMBIGUOUS_VEHICLE", options }));
        } else if (count === 1) {
          // Extrair modelo para devolver na API
          queryParams.marca = ""; 
          queryParams.modelo = (await modeloLocator.first().textContent()).replace('Modelo: ', '').trim();
          
          // O texto "Modelo:" está dentro do card do veículo. Vamos clicar no próprio span ou no pai dele
          console.log('Único veículo encontrado! Clicando no card...');
          await modeloLocator.first().click({ force: true });
          await page.waitForTimeout(2000);
        } else {
          console.log('Texto "Modelo:" não encontrado. Tentando clicar em qualquer botão de Selecionar...');
          const btnSelecionar = page.locator('text="Selecionar"').first();
          if (await btnSelecionar.isVisible().catch(() => false)) {
             await btnSelecionar.click({ force: true });
             await page.waitForTimeout(2000);
          }
        }

      } else {
         throw new Error("Busca por marca/modelo não implementada neste mock.");
      }

      // Passo 3: Tabela de Preços
      console.log('Selecionando Tabela de Preços...');
      const tabelaPrecosBlock = page.locator('h2:has-text("Tabela de preços")').locator('..');
      const tabelaBtn = tabelaPrecosBlock.locator('button[aria-haspopup="dialog"]').first();
      await tabelaBtn.waitFor({ state: 'visible' });
      await tabelaBtn.click();

      await page.waitForTimeout(1000); // Aguarda Radix UI Popover
      
      // O Radix renderiza o dialog no fim do body. Vamos procurar os itens dele.
      // Clica na primeira tabela disponível
      const primeiraTabela = page.locator('[role="dialog"] [role="option"], [data-radix-popper-content-wrapper] [role="option"]').first();
      await primeiraTabela.waitFor({ state: 'visible' });
      await primeiraTabela.click();
      await page.waitForTimeout(1000);

      // Passo 4: Serviços
      console.log(`Buscando serviço: ${queryParams.servico}`);
      const servicosBlock = page.locator('h2:has-text("Serviços")').locator('..');
      const servicoBtn = servicosBlock.locator('button[aria-haspopup="dialog"]').first();
      await servicoBtn.waitFor({ state: 'visible' });
      await servicoBtn.click();

      await page.waitForTimeout(1000);

      // Digita no campo de busca do dialog
      const servicoSearchInput = page.locator('[role="dialog"] input, [data-radix-popper-content-wrapper] input');
      await servicoSearchInput.waitFor({ state: 'visible' });
      await servicoSearchInput.fill(queryParams.servico);
      await page.waitForTimeout(2000); // Tempo para filtrar a lista da API

      const allOptions = page.locator('[role="dialog"] [role="option"], [data-radix-popper-content-wrapper] [role="option"]');
      const optionCount = await allOptions.count();
      
      if (optionCount === 0) {
         throw new Error(`SERVICE_NOT_FOUND`);
      }

      let servicoNome = null;
      let servicoParaClicar = null;
      let availableOptions = [];

      for (let i = 0; i < optionCount; i++) {
        const text = await allOptions.nth(i).textContent();
        if (text) {
          const cleanText = text.trim();
          availableOptions.push(cleanText);
          if (cleanText.toLowerCase() === queryParams.servico.toLowerCase().trim()) {
             servicoNome = cleanText;
             servicoParaClicar = allOptions.nth(i);
          }
        }
      }

      if (!servicoParaClicar) {
        if (optionCount === 1) {
           servicoParaClicar = allOptions.nth(0);
           servicoNome = availableOptions[0];
        } else {
           throw new Error(`AMBIGUOUS_SERVICE: ` + JSON.stringify({ options: availableOptions }));
        }
      }
      
      await servicoParaClicar.click();
      await page.waitForTimeout(1500); // Aguarda adicionar à tabela embaixo

      // Passo 5: Extrair dados da tabela
      console.log('Extraindo dados do serviço...');
      
      const resultRow = page.locator(`section:has(span:text-is("${servicoNome}"))`).first();
      await resultRow.waitFor({ state: 'visible' });
      const spans = resultRow.locator('span');
      
      const tempoRaw = await spans.nth(1).textContent();
      const valorRaw = await spans.nth(2).textContent();

      console.log(`Dados extraídos -> Tempo: ${tempoRaw}, Valor: ${valorRaw}`);

      // Salva screenshot para debug local do sucesso!
      await page.screenshot({ path: path.join(this.errorDir, `success_${requestId}.png`) });

      // Parse do Valor (R$ 150,00 -> 150.00)
      const cleanValor = valorRaw.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
      const valorServico = parseFloat(cleanValor) || 0;

      // Parse do Tempo (ex: "30min", "1h 30min", "2h")
      let tempoHoras = 0;
      const hMatch = tempoRaw.match(/(\d+)h/);
      const mMatch = tempoRaw.match(/(\d+)min/);
      if (hMatch) tempoHoras += parseInt(hMatch[1], 10);
      if (mMatch) tempoHoras += parseInt(mMatch[1], 10) / 60;

      const result = {
        request_id: requestId,
        status: "ok",
        vehicle: {
          placa: queryParams.placa,
          descricao: `${queryParams.marca || ''} ${queryParams.modelo || ''}`.trim()
        },
        service: {
          descricao: servicoNome,
          tempo_padrao_horas: Number(tempoHoras.toFixed(2)),
          valor_hora: 0, // Não exibido explicitamente nessa view
          valor_servico: valorServico,
          moeda: "BRL"
        },
        raw: { source: "tempario_ui", tempo_raw: tempoRaw, valor_raw: valorRaw },
        meta: { duration_ms: Date.now() - startTime }
      };

      await browser.close();
      return result;

    } catch (err) {
      // Capture screenshot and page text
      let screenshotPath = null;
      let pageText = null;
      if (page) {
        screenshotPath = path.join(this.errorDir, `${requestId}_error.png`);
        try { await page.screenshot({ path: screenshotPath }); } catch (e) {}
        try { 
            pageText = await page.evaluate(() => document.body.innerText.substring(0, 1000).replace(/\s+/g, ' ').trim()); 
        } catch (e) {}
      }
      
      if (browser) {
        try { await browser.close(); } catch (e) {}
      }

      const isNotFound = err.message.includes("NOT_FOUND_PLATE");
      let statusStr = isNotFound ? "not_found" : "ui_error";
      let errorObj = null;

      try {
        const parsed = JSON.parse(err.message);
        if (parsed.code) {
          errorObj = parsed;
          if (parsed.code === "AMBIGUOUS_VEHICLE" || parsed.code === "AMBIGUOUS_SERVICE") {
             statusStr = "ambiguous";
          }
        }
      } catch (e) {
        // Ignorar, não é JSON
      }

      // Se não for um erro estruturado nosso (JSON), limpar a mensagem do Playwright
      if (!errorObj) {
          let cleanMsg = err.message.replace(/\x1b\[[0-9;]*m/g, ''); // Remove cores ANSI
          cleanMsg = cleanMsg.split('\n')[0].trim(); // Pega só a primeira linha do erro
          errorObj = {
            code: isNotFound ? "NOT_FOUND" : "UI_INTERACTION_FAILED",
            message: `${cleanMsg} | Último texto na tela: ${pageText || 'vazio'}`
          };
      }

      return {
        request_id: requestId,
        status: statusStr,
        error: errorObj,
        meta: {
          duration_ms: Date.now() - startTime,
          screenshot_path: screenshotPath
        }
      };
    }
  }
}

export { TemparioScraper };
