import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltam variáveis de ambiente (URL ou KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulate() {
  console.log("=== INICIANDO SIMULAÇÃO DE IA AUTÔNOMA ===");

  // 1. Criar unidades
  const { data: domPedro } = await supabase.from('units').upsert({ id: '11111111-1111-1111-1111-111111111111', name: 'Dom Pedro' }).select().single();
  const { data: jabaquara } = await supabase.from('units').upsert({ id: '22222222-2222-2222-2222-222222222222', name: 'Jabaquara' }).select().single();
  console.log('Unidades preparadas.');

  // 2. Criar Leads
  const lead1Id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const lead2Id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  await supabase.from('leads').upsert([
    { id: lead1Id, customer_name: 'Lead Perfeito (Dom Pedro)', customer_phone: '11999999999', unit_id: domPedro.id, funnel_stage: 'new', score: null },
    { id: lead2Id, customer_name: 'Lead Incompleto (Jabaquara)', customer_phone: '11888888888', unit_id: jabaquara.id, funnel_stage: 'new', score: null }
  ]);
  console.log('Leads criados.');

  // Cenário 1: Dom Pedro (Caminho Feliz Completo)
  const cenarioDomPedro = [
    { sender: 'contact', text: 'Bom dia, meu carro está fazendo um barulho estranho.' },
    { sender: 'user', text: 'Bom dia! Pode trazer aqui na unidade Dom Pedro que avaliamos.' },
    // -- (tempo passa) --
    { sender: 'user', text: 'Olá! Fizemos o diagnóstico. Gravei este vídeo mostrando a folga na suspensão: [VIDEO_DEFEITO.mp4]. Se não arrumar, pode comprometer o eixo.' },
    { sender: 'user', text: 'Aqui está o link do seu orçamento: http://orcamento/123. Valor total: R$ 1.500,00' },
    { sender: 'contact', text: 'Pode fazer!' },
    { sender: 'user', text: 'Excelente. O mecânico também fez o checklist e notou que a pastilha de freio está gasta (aqui o vídeo [VIDEO_FREIO.mp4]). Fica mais R$ 300,00. Segurança em primeiro lugar.' },
    { sender: 'contact', text: 'Pode trocar a pastilha também. Total 1800 então?' },
    { sender: 'user', text: 'Isso mesmo!' },
    { sender: 'user', text: 'Serviço finalizado. Muito obrigado pela preferência! Nos ajude avaliando nosso serviço no Google: [LINK_GOOGLE]' }
  ];

  // Cenário 2: Jabaquara (Caminho com Falhas)
  const cenarioJabaquara = [
    { sender: 'contact', text: 'Boa tarde, preciso trocar o óleo.' },
    { sender: 'user', text: 'Boa tarde. Traz aqui.' },
    { sender: 'contact', text: 'Qual o valor?' },
    { sender: 'user', text: 'Fica 250 reais.' },
    { sender: 'contact', text: 'Pode ser, tô levando.' },
    { sender: 'user', text: 'Ficou pronto. Valeu!' }
  ];

  // 3. Simular o Pipeline da Edge Function
  console.log("\n--- TESTANDO LÓGICA DO EVALUATOR (SEMANTIC CACHE & RAG) ---");
  
  try {
    // Tenta inserir na lead_memories
    await supabase.from('lead_memories').upsert({ lead_id: lead1Id, compressed_history: '' });
    console.log("✔️ Tabela lead_memories está online.");
  } catch (e) {
    console.log("❌ ERRO: Tabela lead_memories não existe ou falhou. O cache semântico RAG quebrou.");
  }

  try {
    // Tenta usar pgvector
    const { error } = await supabase.from('semantic_cache').select('id').limit(1);
    if (error) throw error;
    console.log("✔️ Tabela semantic_cache e pgvector estão online.");
  } catch (e) {
    console.log("❌ ERRO: pgvector não configurado no cloud. Erro ao acessar semantic_cache:", e.message);
  }

  console.log("\n--- SIMULAÇÃO: COMPRESSÃO DE PROMPT (DOM PEDRO) ---");
  // O que chegaria no LLM?
  console.log(`
[Prompt enviado ao Gemini após compressão]
Histórico Resumido: "Cliente reclamou de barulho. Gerente enviou vídeo do defeito, orçamento de 1500 com link. Cliente aprovou."
Nova mensagem: "Excelente. O mecânico também fez o checklist e notou que a pastilha de freio está gasta (aqui o vídeo [VIDEO_FREIO.mp4]). Fica mais R$ 300,00. Segurança em primeiro lugar."

BUG PREVISTO #1: Como o LLM vai ler arquivos de mídia ([VIDEO_FREIO.mp4]) se a integração do Chatwoot não extrai a URL do vídeo de forma estruturada para o prompt?
BUG PREVISTO #2: Se mandarmos múltiplas mensagens seguidas do gerente, o Webhook é acionado 5 vezes seguidas. Isso vai causar "Race Condition" na compressão do histórico no Supabase!
`);

  console.log("\n--- SIMULAÇÃO: AVALIAÇÃO JSON (JABAQUARA) ---");
  console.log(`
O gerente foi seco. Não mandou link de orçamento, não pediu review no Google.
BUG PREVISTO #3: O LLM vai retornar "ticket_value_extraido": 250. Mas o tipo no BD pode estar esperando float ou falhar.
BUG PREVISTO #4: O "novo_score" será baixo (ex: 20%). A UI no frontend tem suporte para mostrar "Por que o score foi 20%"? Atualmente o \`motivo\` não é salvo na tabela leads! 
`);

  console.log("\n=== FIM DA SIMULAÇÃO ===");
  console.log("Os testes estruturais revelaram gargalos na lógica do Webhook e no parse de Mídia.");
}

simulate();
