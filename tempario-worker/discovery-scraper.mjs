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
    // Sanitizar entradas "VAZIO" do n8n
    const sanitize = (val) => (!val || val === 'VAZIO' || val === 'null' || val === '{placa}' || val === '{marca}' || val === '{modelo_pesquisa}' || val === '{modelo_exato}') ? '' : val;
    queryParams.placa = sanitize(queryParams.placa);
    queryParams.marca = sanitize(queryParams.marca);
    queryParams.modelo_pesquisa = sanitize(queryParams.modelo_pesquisa);
    queryParams.modelo_exato = sanitize(queryParams.modelo_exato);
    queryParams.servico = sanitize(queryParams.servico);

    console.log(`[Worker] Query: Placa='${queryParams.placa}', Marca='${queryParams.marca}', Modelo='${queryParams.modelo_pesquisa}', Exato='${queryParams.modelo_exato}'`);

    if (!(await this.validateSession())) {
      return {
        request_id: requestId,
        status: "session_expired",
        error: { code: "SESSION_EXPIRED", message: "storageState.json não encontrado" }
      };
    }

    const startTime = Date.now();
    let context;
    let page;
    
    try {
      console.log('Iniciando o navegador Chromium (Persistent Context)...');
      const profilePath = path.resolve('data', 'browser_profile');
      
      // Usa o diretório persistente
      context = await chromium.launchPersistentContext(profilePath, {
        headless: this.headless,
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        permissions: [],
        viewport: { width: 1280, height: 720 },
        args: ['--disable-blink-features=AutomationControlled']
      });

      page = await context.newPage();
      
      // --- NETWORK ANALYZER INJECTION ---
      const trafficLog = [];
      page.on('response', async (response) => {
          try {
              const request = response.request();
              const url = request.url();
              const resourceType = request.resourceType();
              if (resourceType === 'xhr' || resourceType === 'fetch' || resourceType === 'document') {
                  const reqHeaders = await request.allHeaders();
                  const resHeaders = await response.allHeaders();
                  const postData = request.postData();
                  let responseBody = null;
                  if (response.ok() && resHeaders['content-type']?.includes('application/json')) {
                      try { responseBody = await response.json(); } catch(e) {}
                  }
                  trafficLog.push({
                      url, method: request.method(),
                      request: { headers: reqHeaders, payload: postData ? (reqHeaders['content-type']?.includes('application/json') ? JSON.parse(postData) : postData) : null },
                      response: { status: response.status(), headers: resHeaders, body: responseBody }
                  });
              }
          } catch(e) {}
      });
      page.saveTraffic = () => {
          const fs = require('fs');
          const path = require('path');
          const discoveryDir = path.join(__dirname, 'data', 'discovery');
          if (!fs.existsSync(discoveryDir)) fs.mkdirSync(discoveryDir, { recursive: true });
          fs.writeFileSync(path.join(discoveryDir, 'traffic.json'), JSON.stringify(trafficLog, null, 2));
      };
      // -----------------------------------

      // Pre-flight check: Verificar saúde da sessão ANTES de rodar
      console.log('Realizando Pre-flight Check na sessão...');
      await page.goto("https://sistema.tempar.io/time-search", { waitUntil: "domcontentloaded", timeout: 30000 });
      
      const currentUrl = page.url();
      if (currentUrl.includes('login') || currentUrl.includes('sign')) {
          console.error('❌ Sessão expirada ou Cloudflare bloqueando no Pre-flight.');
          await context.close();
          throw new Error(JSON.stringify({ code: "SESSION_EXPIRED", message: "A sessão expirou e o robô foi redirecionado para a tela de login." }));
      }
      console.log('✅ Pre-flight Ok! Sessão viva.');

      if (queryParams.action === 'renew') {
          console.log('🔄 Ação RENEW: Heartbeat concluído com sucesso.');
          await context.close();
          return {
            request_id: requestId,
            status: "ok",
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
      
      let useMarcaModeloFallback = false;
      let vehicleSelected = false;
      let vehicleAssumedInfo = null;
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
               if (queryParams.marca && queryParams.modelo_pesquisa) {
                   console.log("[Worker] Tempario bloqueou a placa. Tentando extrair as versões da placa diretamente do modal...");
                   
                   try {
                       // O modal deve ter um botão para selecionar o modelo
                       const selectBtn = dialog.locator('button[aria-haspopup="dialog"], button[role="combobox"]').last();
                       if (await selectBtn.isVisible({ timeout: 2000 })) {
                           await selectBtn.click();
                           await page.waitForTimeout(1000);
                           
                           const popover = page.locator('[role="dialog"]').last();
                           const optionLocator = popover.locator('[role="option"]');
                           await optionLocator.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
                           
                           const optionsCount = await optionLocator.count();
                           if (optionsCount > 0) {
                               // Auto-fallback: seleciona a primeira opção
                               const firstOptionText = (await optionLocator.nth(0).textContent()).trim();
                               console.log(`[Worker] Modal retornou ${optionsCount} opções. Auto-fallback ativado. Assumindo: ${firstOptionText}`);
                               
                               await optionLocator.nth(0).click();
                               await page.waitForTimeout(500);
                               
                               const btnAtualizar = dialog.locator('button:has-text("Atualizar")');
                               if (await btnAtualizar.isVisible()) {
                                   await btnAtualizar.click();
                               }
                               
                               vehicleAssumedInfo = {
                                   descricao: firstOptionText,
                                   candidates_count: optionsCount
                               };
                               vehicleSelected = true;
                               useMarcaModeloFallback = false;
                               
                               await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
                               await page.waitForTimeout(1000);
                           }
                       }
                   } catch (err) {
                       if (err.message.includes("disambiguation")) throw err;
                       console.log("[Worker] Falha ao extrair do modal. Usando fallback genérico de Marca/Modelo...");
                   }
                   
                   // Clicar no X do modal se falhou
                   const closeBtn = dialog.locator('button[aria-label="Close"], button:has-text("✕"), .close-button').first();
                   if (await closeBtn.isVisible().catch(()=>false)) {
                       await closeBtn.click({ force: true });
                   } else {
                       await page.keyboard.press('Escape');
                   }
                   
                   await dialog.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
                   await page.waitForTimeout(500);
                   useMarcaModeloFallback = true;
               } else {
                   throw new Error(JSON.stringify({ code: "UPDATE_VEHICLE_REQUIRED", message: "O Tempario exigiu o preenchimento dos dados (Marca/Modelo) para esta placa." }));
               }
           } else {
               throw new Error(JSON.stringify({ code: "WRONG_CATEGORY_OR_ALERT", message: dialogText.trim() }));
           }
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
          if (queryParams.modelo_exato) {
            console.log(`Buscando modelo exato: ${queryParams.modelo_exato}`);
            let clicked = false;
            for (let i = 0; i < count; i++) {
              const text = await modeloLocator.nth(i).textContent();
              if (text.toLowerCase().includes(queryParams.modelo_exato.toLowerCase())) {
                await modeloLocator.nth(i).click({ force: true });
                clicked = true;
                vehicleSelected = true;
                break;
              }
            }
            if (!clicked) {
              throw new Error(JSON.stringify({ code: "EXACT_MODEL_NOT_FOUND", message: `O modelo exato '${queryParams.modelo_exato}' não foi encontrado entre as opções da placa.` }));
            }
            await page.waitForTimeout(2000);
          } else {
            console.log(`Múltiplos veículos encontrados (${count}). Lançando erro AMBIGUOUS_VEHICLE...`);
            const options = [];
            for (let i = 0; i < count; i++) {
              options.push((await modeloLocator.nth(i).textContent()).replace('Modelo: ', '').trim());
            }
            throw new Error(JSON.stringify({
              type: "disambiguation",
              status: "needs_vehicle_selection",
              selection_stage: "modelo",
              message_for_user: "Encontrei mais de um veículo para esta placa. Qual é o correto?",
              options
            }));
          }
        } else if (count === 1) {
          // Extrair modelo para devolver na API
          queryParams.marca = ""; 
          queryParams.modelo = (await modeloLocator.first().textContent()).replace('Modelo: ', '').trim();
          
          // O texto "Modelo:" está dentro do card do veículo. Vamos clicar no próprio span ou no pai dele
          console.log('Único veículo encontrado! Clicando no card...');
          await modeloLocator.first().click({ force: true });
          await page.waitForTimeout(2000);
          vehicleSelected = true;
        } else {
          console.log('Texto "Modelo:" não encontrado. Tentando clicar em qualquer botão de Selecionar...');
          const btnSelecionar = page.locator('text="Selecionar"').first();
          if (await btnSelecionar.isVisible().catch(() => false)) {
             await btnSelecionar.click({ force: true });
             await page.waitForTimeout(2000);
             vehicleSelected = true;
          }
        }

      } 
      
      if (!vehicleSelected && (!queryParams.placa || useMarcaModeloFallback) && queryParams.marca && queryParams.modelo_pesquisa) {
         console.log(`Buscando por Marca (${queryParams.marca}) e Modelo (${queryParams.modelo_pesquisa})...`);
         
         // 1. Clicar em Marca
         const marcaBtn = page.locator('label:has-text("Marca")').locator('button[aria-haspopup="dialog"]');
         await marcaBtn.waitFor({ state: 'visible' });
         await marcaBtn.click();
         await page.waitForTimeout(500);

         let popover = page.locator('[role="dialog"]').last();
         await popover.waitFor({ state: 'visible' });
         await popover.locator('input').fill(queryParams.marca);
         await page.waitForTimeout(1000);
         const marcaOption = popover.locator('[role="option"]').filter({ hasText: new RegExp(queryParams.marca, "i") }).first();
         await marcaOption.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
         if (await marcaOption.isVisible()) {
            await marcaOption.click();
            await page.waitForTimeout(1000);
         } else {
            throw new Error(JSON.stringify({ code: "BRAND_NOT_FOUND", message: `A marca '${queryParams.marca}' não foi encontrada.` }));
         }

         // 2. Clicar em Modelo
         const modeloBtn = page.locator('label:has-text("Modelo")').locator('button[aria-haspopup="dialog"]');
         // Verifica se o botão do modelo ativou (deixa de ser disabled quando a marca é selecionada)
         await modeloBtn.waitFor({ state: 'visible' });
         if (await modeloBtn.isDisabled()) {
            throw new Error(JSON.stringify({ code: "MODEL_DISABLED", message: "O campo de modelo não foi habilitado após selecionar a marca." }));
         }
         await modeloBtn.click();
         await page.waitForTimeout(500);

         popover = page.locator('[role="dialog"]').last();
         await popover.waitFor({ state: 'visible' });
         await popover.locator('input').fill(queryParams.modelo_pesquisa);
         await page.waitForTimeout(1000);

         // Pode ter múltiplos modelos com esse texto (ex: "A3" -> "A3 1.8", "A3 2.0")
         const optionLocator = popover.locator('[role="option"]');
         await optionLocator.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
         const optionsCount = await optionLocator.count();

         if (optionsCount === 0) {
            throw new Error(JSON.stringify({ code: "MODEL_NOT_FOUND", message: `Nenhum modelo encontrado para '${queryParams.modelo_pesquisa}'.` }));
         }

         if (optionsCount > 1) {
            if (queryParams.modelo_exato) {
               console.log(`Buscando modelo exato na lista: ${queryParams.modelo_exato}`);
               let clicked = false;
               for (let i = 0; i < optionsCount; i++) {
                 const text = await optionLocator.nth(i).textContent();
                 if (text.toLowerCase().trim() === queryParams.modelo_exato.toLowerCase().trim()) {
                   await optionLocator.nth(i).click();
                   clicked = true;
                   break;
                 }
               }
               if (!clicked) {
                 throw new Error(JSON.stringify({ code: "EXACT_MODEL_NOT_FOUND", message: `Modelo exato '${queryParams.modelo_exato}' não encontrado na lista.` }));
               }
            } else {
               console.log(`Múltiplos modelos encontrados (${optionsCount}). Lançando AMBIGUOUS_VEHICLE...`);
               const options = [];
               for (let i = 0; i < optionsCount; i++) {
                 options.push((await optionLocator.nth(i).textContent()).trim());
               }
               throw new Error(JSON.stringify({
                type: "disambiguation",
                status: "needs_vehicle_selection",
                selection_stage: "modelo",
                message_for_user: "Encontrei mais de um modelo possível para esta marca. Qual é o correto?",
                options
              }));
            }
         } else {
            console.log('Único modelo encontrado, clicando...');
            await optionLocator.first().click();
            vehicleSelected = true;
         }
         
         await page.waitForTimeout(2000); // Aguarda o sistema habilitar a Tabela de Preços

      }
      
      if (!vehicleSelected) {
         throw new Error("Parâmetros insuficientes. Forneça 'placa' ou ('marca' e 'modelo_pesquisa').");
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

      // ---- ALGORITMO DE RANKING ----
      const sanitize = (str) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, ' ');
      const qTokens = sanitize(queryParams.servico).split(/\s+/).filter(t => t.length > 2);
      const vehicleDesc = `${queryParams.marca || ''} ${queryParams.modelo || ''} ${queryParams.modelo_exato || ''}`;
      const vTokens = sanitize(vehicleDesc).split(/\s+/).filter(t => t.length > 2);
      const isAuto = vTokens.some(t => ['aut', 'automatico', 'automatizado', 'powershift'].includes(t));

      let rankedOptions = [];
      for (let i = 0; i < optionCount; i++) {
        const text = await allOptions.nth(i).textContent();
        if (!text) continue;
        const cleanText = text.trim();
        const oTokens = sanitize(cleanText).split(/\s+/).filter(t => t.length > 2);

        let score = 0;
        qTokens.forEach(qt => { if (oTokens.includes(qt)) score += 10; });
        
        if (isAuto && oTokens.some(t => ['automatico', 'automatizado', 'powershift'].includes(t))) {
          score += 15;
        }

        const diff = oTokens.length - qTokens.length;
        if (diff > 2) score -= (diff * 1); // penaliza opções enormes cheias de "/", "bancada", "funilaria", etc.

        rankedOptions.push({ text: cleanText, index: i, score });
      }

      rankedOptions.sort((a, b) => b.score - a.score);
      console.log("[Worker] Service Ranking: ", rankedOptions.map(r => `${r.score}: ${r.text}`));

      let servicoNome = null;
      let servicoParaClicar = null;

      if (rankedOptions.length > 0) {
         // Se só tem 1 opção aceitável ou o primeiro ganha disparado do segundo (> 15 pontos) ou tem score muito alto e o resto é lixo.
         const first = rankedOptions[0];
         const second = rankedOptions.length > 1 ? rankedOptions[1] : null;
         
         const isUnambiguous = !second || (first.score - second.score >= 10);
         
         // Se bateu exato com ignorar case, sobescreve e confia cegamente
         const exactMatch = rankedOptions.find(r => r.text.toLowerCase() === queryParams.servico.toLowerCase().trim());

         if (exactMatch) {
             servicoNome = exactMatch.text;
             servicoParaClicar = allOptions.nth(exactMatch.index);
         } else if (isUnambiguous && first.score > 0) {
             servicoNome = first.text;
             servicoParaClicar = allOptions.nth(first.index);
         } else {
             // Ambiguidade detectada
             const maxOptions = 3;
             const optionsToReturn = rankedOptions.slice(0, maxOptions).map(r => r.text);
             if (rankedOptions.length > maxOptions) {
                 optionsToReturn.push(`... e mais ${rankedOptions.length - maxOptions} opções disponíveis.`);
             }

             throw new Error(JSON.stringify({
               type: "disambiguation",
               status: "needs_service_selection",
               selection_stage: "servico",
               message_for_user: `Encontrei mais de um serviço parecido para "${queryParams.servico}". Qual deles você quer consultar?`,
               options: optionsToReturn
             }));
         }
      }

      if (!servicoParaClicar) {
         throw new Error(`SERVICE_NOT_FOUND`);
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
          descricao: vehicleAssumedInfo ? vehicleAssumedInfo.descricao : `${queryParams.marca || ''} ${queryParams.modelo || ''}`.trim()
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

      if (vehicleAssumedInfo) {
          result.vehicle.assumed = true;
          result.vehicle.candidates_count = vehicleAssumedInfo.candidates_count;
          result.message_for_user = `Assumi o veículo ${vehicleAssumedInfo.descricao} encontrado pela sua placa. Se não for esse modelo exato, me avise que eu refaço o orçamento.`;
      }

      if(page && page.saveTraffic) page.saveTraffic();
      await context.close();
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
      
      if (context) {
        if(page && page.saveTraffic) page.saveTraffic();
      try { await context.close(); } catch (e) {}
      }

      const isNotFound = err.message.includes("NOT_FOUND_PLATE");
      let statusStr = isNotFound ? "not_found" : "ui_error";
      let errorObj = null;

      try {
        const parsed = JSON.parse(err.message);
        if (parsed.code || parsed.type === "disambiguation") {
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

