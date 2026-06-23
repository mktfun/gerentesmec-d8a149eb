import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = path.join(__dirname, "data");
const DISCOVERY_DIR = path.join(DATA_DIR, "discovery");
const PROFILE_PATH = path.join(DATA_DIR, "browser_profile");

if (!fs.existsSync(DISCOVERY_DIR)) {
  fs.mkdirSync(DISCOVERY_DIR, { recursive: true });
}

// Global traffic logger
const trafficLog = [];

async function recordTraffic() {
  console.log("=> Iniciando Network Recorder...");
  
  const context = await chromium.launchPersistentContext(PROFILE_PATH, {
    headless: true, // Ou false se precisar debugar localmente
    viewport: { width: 1280, height: 720 },
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  // Network Listener
  page.on('response', async (response) => {
    try {
      const request = response.request();
      const url = request.url();
      const method = request.method();
      const resourceType = request.resourceType(); // fetch, xhr, document, script

      // Filtrar apenas XHR ou FETCH para reduzir tamanho do JSON (nós não ligamos para JS/CSS/Imagens)
      if (resourceType === 'xhr' || resourceType === 'fetch' || resourceType === 'document') {
        const reqHeaders = await request.allHeaders();
        const resHeaders = await response.allHeaders();
        const postData = request.postData();
        
        let responseBody = null;
        if (response.ok() && (resHeaders['content-type']?.includes('application/json') || url.includes('/api/'))) {
            try {
                responseBody = await response.json();
            } catch(e) {
                // Ignore se não for JSON parseable
            }
        }

        trafficLog.push({
          timestamp: new Date().toISOString(),
          method,
          url,
          resourceType,
          request: {
            headers: reqHeaders,
            postData: postData ? (reqHeaders['content-type']?.includes('application/json') ? JSON.parse(postData) : postData) : null
          },
          response: {
            status: response.status(),
            headers: resHeaders,
            body: responseBody
          }
        });
      }
    } catch (err) {
      // Catch falhas ao ler response body (quando a promise resolve mas o corpo fechou)
    }
  });

  try {
    console.log("-> Navegando para o sistema...");
    await page.goto("https://sistema.tempar.io/time-search", { waitUntil: "networkidle" });
    
    // Verificar login
    if (page.url().includes("login") || page.url().includes("Acesse")) {
        console.error("Sessão expirada. O Recorder precisa de cookies válidos.");
        await context.close();
        return;
    }

    console.log("-> Realizando Busca de Placa: EZR8759");
    const placaInput = page.getByPlaceholder('AAA-0000');
    await placaInput.waitFor({ state: "visible", timeout: 20000 });
    await placaInput.fill("EZR8759");
    
    // Disparar busca de placa
    const buttonGroup = placaInput.locator('xpath=..').locator('button');
    const plateSearchBtn = buttonGroup.nth(0);
    await plateSearchBtn.click();
    
    console.log("-> Aguardando estabilização de rede pós busca de placa...");
    await page.waitForTimeout(3000);
    
    // Se apareceu o modal de múltiplos modelos, clicar em Atualizar
    const modalConfirmar = page.locator('text="Atualizar"');
    if (await modalConfirmar.isVisible()) {
        console.log("-> Modal de seleção de modelo apareceu (Fallback). Clicando em Atualizar.");
        await modalConfirmar.click();
        await page.waitForTimeout(2000);
    }
    
    console.log("-> Buscando Serviço: carga bateria");
    const searchInput = page.locator('input[placeholder="Buscar por descrição de serviço..."]');
    await searchInput.waitFor({ state: "visible", timeout: 10000 });
    await searchInput.fill("carga bateria");
    await page.waitForTimeout(3000);
    
    console.log("-> Clicando na opção...");
    // A lista aparece e seleciona o primeiro
    const firstOption = page.locator('.ng-dropdown-panel .ng-option').first();
    await firstOption.waitFor({ state: "visible", timeout: 5000 });
    await firstOption.click();
    await page.waitForTimeout(3000); // Aguardar request do serviço

    // Escrever log
    fs.writeFileSync(path.join(DISCOVERY_DIR, "traffic.json"), JSON.stringify(trafficLog, null, 2));
    console.log(`=> Fluxo completo. Gravados ${trafficLog.length} requests em traffic.json`);

  } catch (err) {
    console.error("Erro durante a gravação:", err);
    await page.screenshot({ path: path.join(DISCOVERY_DIR, "error.png") });
    // Gravar log mesmo em erro
    fs.writeFileSync(path.join(DISCOVERY_DIR, "traffic.json"), JSON.stringify(trafficLog, null, 2));
  } finally {
    await context.close();
  }
}

recordTraffic();
