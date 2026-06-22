import express from 'express';
import { z } from 'zod';
import { TemparioScraper } from './tempario-scraper.mjs';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Schema de validação usando Zod
const QuerySchema = z.object({
  request_id: z.string().uuid().or(z.string()),
  unit_id: z.string().optional(),
  user_id: z.string().optional(),
  query: z.object({
    placa: z.string().optional(),
    marca: z.string().optional(),
    modelo: z.string().optional(),
    ano: z.number().optional(),
    motor: z.string().optional(),
    servico: z.string()
  }),
  options: z.object({
    headless: z.boolean().optional(),
    capture_screenshot_on_error: z.boolean().optional(),
    timeout_ms: z.number().optional()
  }).optional()
});

// Inicializa a classe scraper
const scraper = new TemparioScraper();

// Fila muito simples para evitar concorrência no Playwright
let requestQueue = Promise.resolve();

app.post('/api/query', async (req, res) => {
  let parsed;
  try {
    parsed = QuerySchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({
      status: "validation_error",
      error: err.errors
    });
  }

  const { request_id, query, options } = parsed;

  console.log(`[Queue] Requisicao ${request_id} aguardando na fila...`);

  const job = async () => {
    console.log(`[Queue] Iniciando processamento da requisicao ${request_id}...`);
    try {
      if (options) {
        scraper.headless = options.headless !== false;
        scraper.timeout = options.timeout_ms || 60000;
      }
      const result = await scraper.runQuery(request_id, query);
      return res.json(result);
    } catch (error) {
      console.error(`[Error] Request ${request_id} failed:`, error.message);
      
      // Lidar com erros de negócio do Tempario
      if (error.message.includes("NOT_FOUND_PLATE")) {
        return res.status(200).json({
          request_id: request_id,
          status: "NOT_FOUND_PLATE",
          error: { message: "Veículo não encontrado com essa placa." }
        });
      }

      if (error.message.includes("SERVICE_NOT_FOUND")) {
        return res.status(200).json({
          request_id: request_id,
          status: "SERVICE_NOT_FOUND",
          error: { message: "Serviço não consta no catálogo do veículo." }
        });
      }

      if (error.message.includes("AMBIGUOUS_SERVICE")) {
        let optionsList = [];
        try {
          const jsonMatch = error.message.match(/(\{.*\})/);
          if (jsonMatch) {
            const parsedError = JSON.parse(jsonMatch[1]);
            optionsList = parsedError.options || [];
          }
        } catch(e) {}
        
        return res.status(200).json({
          request_id: request_id,
          status: "AMBIGUOUS_SERVICE",
          error: { message: "Várias opções de serviço encontradas.", options: optionsList }
        });
      }

      // Falha genérica de UI/Timeout
      return res.status(200).json({
        request_id: request_id,
        status: "ui_error",
        error: {
          code: "UI_INTERACTION_FAILED",
          message: error.message
        }
      });
    }
  };

  // Enfileira
  requestQueue = requestQueue.then(job).catch(err => {
     console.error("[Queue Critical]", err);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Tempario Worker rodando na porta ${PORT}`);
  console.log(`Endpoint: POST http://localhost:${PORT}/api/query`);
});
