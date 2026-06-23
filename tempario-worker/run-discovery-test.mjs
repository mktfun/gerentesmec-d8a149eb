import { TemparioScraper } from './discovery-scraper.mjs';

(async () => {
    try {
        console.log("==> Testando Discovery Recorder <==");
        const scraper = new TemparioScraper();
        const result = await scraper.runQuery("test-discovery", {
            placa: "EZR8759",
            servico: "carga bateria"
        });
        
        console.log("Status HTTP:", result.status === 'ok' || result.status === 'needs_service_selection' ? 200 : 400);
        console.log("Response JSON:\n", JSON.stringify(result));
    } catch (err) {
        console.error("Erro fatal:", err);
    }
})();
