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
        
        // Wait for results to load or error messages to appear
        await page.waitForTimeout(2000);
        
        // Verifica se deu "não encontrado" ou "Placa inválida"
        const notFoundText = await page.locator('text="não encontrado"').isVisible();
        const invalidPlateText = await page.locator('text="Placa inválida"').isVisible();
        
        if (notFoundText || invalidPlateText) {
           throw new Error("NOT_FOUND_PLATE");
        }

        // Step 2b: After plate search, Tempario shows a list of vehicle cards.
        // We need to click the first vehicle card to select it and enable the Tabela de Preços button.
        console.log('Procurando e selecionando o veículo nos resultados...');
        
        // Try different selectors for the vehicle result card
        const vehicleCardSelectors = [
          'button:has-text("Selecionar")',
          '[data-testid="vehicle-card"]',
          'button.vehicle-card',
          // Generic: any clickable card that appears after search results load
          'section button:not([disabled]):not(:has-text("Buscar"))',
        ];

        let vehicleSelected = false;
        for (const selector of vehicleCardSelectors) {
          const card = page.locator(selector).first();
          const isVisible = await card.isVisible().catch(() => false);
          if (isVisible) {
            console.log(`Clicando no veículo via seletor: ${selector}`);
            await card.click();
            await page.waitForTimeout(2000);
            vehicleSelected = true;
            break;
          }
        }

        if (!vehicleSelected) {
          console.log('Nenhum card de veículo clicável encontrado. Continuando sem clicar...');
        }

        // Tentar extrair os dados do veículo renderizados na tela
        const modeloLocator = page.locator('span:has-text("Modelo:")');
        if (await modeloLocator.isVisible()) {
          queryParams.marca = ""; 
          queryParams.modelo = (await modeloLocator.textContent()).replace('Modelo: ', '').trim();
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
      // Capture screenshot
      let screenshotPath = null;
      if (page) {
        screenshotPath = path.join(this.errorDir, `${requestId}_error.png`);
        try { await page.screenshot({ path: screenshotPath }); } catch (e) {}
      }
      
      if (browser) {
        try { await browser.close(); } catch (e) {}
      }

      const isNotFound = err.message.includes("NOT_FOUND_PLATE");

      return {
        request_id: requestId,
        status: isNotFound ? "not_found" : "ui_error",
        error: {
          code: isNotFound ? "NOT_FOUND" : "UI_INTERACTION_FAILED",
          message: err.message
        },
        meta: {
          duration_ms: Date.now() - startTime,
          screenshot_path: screenshotPath
        }
      };
    }
  }
}
