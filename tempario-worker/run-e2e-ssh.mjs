import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

// 5 cenarios x 2 contextos de veiculo = 10 testes
// Contexto A: Ford Fiesta (placa EZR8759)
// Contexto B: por Marca/Modelo: Chevrolet Onix
const tests = [
  // --- CENARIO 1: Componente simples (Pastilha) ---
  { id: 'c1a', label: 'Cenario 1A | Pastilha dianteira | Placa EZR8759 (Fiesta)',
    query: { placa: 'EZR8759', servico: 'troca pastilha dianteira' } },
  { id: 'c1b', label: 'Cenario 1B | Pastilha dianteira | Marca Chevrolet / Onix',
    query: { marca: 'Chevrolet', modelo_pesquisa: 'Onix', servico: 'troca pastilha dianteira' } },

  // --- CENARIO 2: Fallback de token (termo composto sem match exato no Tempario) ---
  { id: 'c2a', label: 'Cenario 2A | Carga de Bateria (fallback token) | Placa EZR8759',
    query: { placa: 'EZR8759', servico: 'carga de bateria' } },
  { id: 'c2b', label: 'Cenario 2B | Carga de Bateria (fallback token) | Marca Volkswagen / Gol',
    query: { marca: 'Volkswagen', modelo_pesquisa: 'Gol', servico: 'carga de bateria' } },

  // --- CENARIO 3: COMPONENTE vs COMPLETO (A penalidade de escopo nao pode trazer motor completo) ---
  { id: 'c3a', label: 'Cenario 3A | Troca de biela (componente) | Placa EZR8759 — NAO pode retornar motor completo',
    query: { placa: 'EZR8759', servico: 'troca de biela' } },
  { id: 'c3b', label: 'Cenario 3B | Troca de biela (componente) | Marca Ford / Ka — NAO pode retornar motor completo',
    query: { marca: 'Ford', modelo_pesquisa: 'Ka', servico: 'troca de biela' } },

  // --- CENARIO 4: Escopo COMPLETO explicito (deve retornar processo correto) ---
  { id: 'c4a', label: 'Cenario 4A | Desmontagem/remocao de motor (COMPLETO) | Placa EZR8759',
    query: { placa: 'EZR8759', servico: 'remocao do motor' } },
  { id: 'c4b', label: 'Cenario 4B | Desmontagem/remocao de motor (COMPLETO) | Marca Fiat / Uno',
    query: { marca: 'Fiat', modelo_pesquisa: 'Uno', servico: 'remocao do motor' } },

  // --- CENARIO 5: Sinonimo / escrita informal ---
  { id: 'c5a', label: 'Cenario 5A | "amort diant" (sinonimo informal) | Placa EZR8759',
    query: { placa: 'EZR8759', servico: 'amort diant' } },
  { id: 'c5b', label: 'Cenario 5B | "amort diant" (sinonimo informal) | Marca Toyota / Corolla',
    query: { marca: 'Toyota', modelo_pesquisa: 'Corolla', servico: 'amort diant' } },
];

async function main() {
  await ssh.connect({ host: '100.114.251.99', username: 'servidor', password: '5010' });
  console.log('=== BATERIA E2E COMPLETA — 5 CENARIOS x 2 CONTEXTOS ===\n');

  let passed = 0, failed = 0, disambig = 0;

  for (const t of tests) {
    const bodyJson = JSON.stringify({ request_id: t.id, query: t.query });
    const escaped = bodyJson.replace(/'/g, "'\\''");
    await ssh.execCommand(`echo '${escaped}' > /tmp/payload_${t.id}.json`);
    const r = await ssh.execCommand(
      `curl -s -X POST http://localhost:3000/query -H "Content-Type: application/json" -d @/tmp/payload_${t.id}.json`
    );

    console.log(`[${t.id.toUpperCase()}] ${t.label}`);
    try {
      const j = JSON.parse(r.stdout);
      if (j.status === 'ok') {
        passed++;
        console.log(`  ✅ OK  | Servico: "${j.service?.descricao}" | Tempo: ${j.service?.tempo_padrao_horas}h | R$${j.service?.valor_servico}`);
      } else if (j.status?.includes('needs_')) {
        disambig++;
        console.log(`  ⚠️  DISAMBIG | ${j.message_for_user}`);
        console.log(`     Opcoes: ${(j.options || []).slice(0, 3).join(' | ')}`);
      } else {
        failed++;
        const msg = String(j.error?.message || j.status || '').substring(0, 100);
        console.log(`  ❌ ERRO | ${j.error?.code || j.status}`);
        console.log(`     ${msg}`);
      }
    } catch (e) {
      failed++;
      console.log(`  ❌ PARSE ERROR | ${r.stdout?.substring(0, 150)}`);
    }
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`RESULTADO FINAL: ${passed} OK | ${disambig} Disambiguação | ${failed} Erro`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  ssh.dispose();
}

main().catch(err => { console.error(err); process.exit(1); });
