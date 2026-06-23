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
    modelo: z.string().optional(), // mantido por compatibilidade
    modelo_pesquisa: z.string().optional(),
    modelo_exato: z.string().optional(),
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
      
      // Se o scraper retornou um erro estruturado de desambiguação
      if (result.error && result.error.type === "disambiguation") {
         return res.json({
             request_id: request_id,
             status: result.error.status,
             selection_stage: result.error.selection_stage,
             resolved_from: {
               placa: query.placa || "",
               marca_inferida: query.marca || "",
               servico_inferido: query.servico || ""
             },
             options: result.error.options,
             message_for_user: result.error.message_for_user
         });
      }
      
      return res.json(result);
    } catch (error) {
      console.error(`[Error] Request ${request_id} failed:`, error.message);
      
      // Catch structured errors from scraper
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError && parsedError.type === "disambiguation") {
           return res.status(200).json({
             request_id: request_id,
             status: parsedError.status,
             selection_stage: parsedError.selection_stage,
             resolved_from: {
               placa: query.placa || "",
               marca_inferida: query.marca || "",
               servico_inferido: query.servico || ""
             },
             options: parsedError.options,
             message_for_user: parsedError.message_for_user
           });
        }
        
        // Check for other explicit codes (like UPDATE_VEHICLE_REQUIRED)
        if (parsedError && parsedError.code) {
           return res.status(200).json({
             request_id: request_id,
             status: "ui_error",
             error: parsedError
           });
        }
      } catch(e) {}

      // Fallback para erros antigos baseados em texto
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Tempario Worker rodando na porta ${PORT}`);
  console.log(`Endpoint: POST http://localhost:${PORT}/api/query`);
  
  // Heartbeat nativo (Keep-alive)
  // Como o Persistent Context só pode ser aberto por uma aba de cada vez, 
  // nós enfileiramos a requisição de renovação para que o worker não trombe!
  const UMA_HORA_MS = 60 * 60 * 1000;
  setInterval(() => {
     console.log('[Heartbeat] Agendando renovação de sessão na fila...');
     const renewId = `renew_${Date.now()}`;
     requestQueue = requestQueue.then(async () => {
       await scraper.runQuery(renewId, { action: 'renew', servico: '' });
     });
  }, UMA_HORA_MS);
  console.log(`[Heartbeat] Agendador ativado (rodará a cada 1 hora).`);
});
