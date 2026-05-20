import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Eye, EyeOff, Plus, Clock, Info } from 'lucide-react';
import { mockUnits, mockManagers } from '@/data/mockData';
import UnitMappingCard from '@/components/Config/UnitMappingCard';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 280, damping: 26, delay },
});

const Config = () => {
  const [apiUrl, setApiUrl] = useState('https://app.chatwoot.com');
  const [apiToken, setApiToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);
  const [slaByUnit, setSlaByUnit] = useState<Record<string, number>>(
    Object.fromEntries(mockUnits.map(u => [u.id, 20]))
  );

  const testConnection = async () => {
    setTesting(true);
    await new Promise(r => setTimeout(r, 1200)); // mock delay
    setConnected(apiToken.length > 8); // mock: any token > 8 chars = connected
    setTesting(false);
  };

  return (
    <div className="p-8 max-w-3xl">

      {/* Page header */}
      <motion.div {...fadeUp(0)} className="mb-8">
        <p className="label-caps text-primary/70 mb-1">Sistema</p>
        <h1 className="text-2xl font-black text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure a integração com o canal de mensagens e defina as regras por unidade.
        </p>
      </motion.div>

      <div className="space-y-6">

        {/* ── Integração de Canal ───────────────────────────── */}
        <motion.section {...fadeUp(0.05)}>
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Integração de Canal</h2>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">

            {/* Connection status */}
            {connected !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold
                  ${connected
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}
              >
                {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {connected ? 'Canal conectado com sucesso' : 'Falha na conexão — verifique a URL e o token'}
              </motion.div>
            )}

            {/* URL */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                URL do Servidor
              </label>
              <input
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                placeholder="https://app.chatwoot.com"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border
                  text-sm font-medium text-foreground placeholder:text-muted-foreground/50
                  focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Token */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                Token de Acesso da API
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    value={apiToken}
                    onChange={e => setApiToken(e.target.value)}
                    type={showToken ? 'text' : 'password'}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl bg-muted border border-border
                      text-sm font-mono text-foreground placeholder:text-muted-foreground/30
                      focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <button onClick={() => setShowToken(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50
                      hover:text-muted-foreground transition-colors">
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button onClick={testConnection} disabled={testing}
                  className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold
                    bg-primary text-white hover:bg-primary/90 transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-[0_0_20px_hsl(239_84%_67%_/_0.25)] hover:shadow-[0_0_28px_hsl(239_84%_67%_/_0.35)]">
                  {testing ? 'Testando…' : 'Testar'}
                </button>
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border">
              <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                O token é usado internamente para leitura de conversas. Ele nunca aparece na interface 
                e a integração funciona de forma discreta em background.
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── Unidades e Mapeamento de Canais ──────────────── */}
        <motion.section {...fadeUp(0.1)}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Unidades e Canais</h2>
            </div>
            <span className="text-xs text-muted-foreground">{mockUnits.length} unidades configuradas</span>
          </div>

          {/* How it works banner */}
          <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/15">
            <p className="text-xs font-bold text-primary mb-1">Como funciona o mapeamento</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O sistema identifica cada unidade pelo <strong className="text-foreground">nome exato do inbox no canal de mensagens</strong>. 
              A comparação é case-insensitive (ex: "dom pedro" = "Dom Pedro"). 
              Cada unidade tem exatamente <strong className="text-foreground">1 gerente responsável</strong>.
            </p>
          </div>

          <div className="space-y-3">
            {mockUnits.map((unit, i) => {
              const manager = mockManagers.find(m => m.id === unit.manager_id);
              return (
                <motion.div key={unit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 280, damping: 26 }}
                >
                  <UnitMappingCard
                    unit={unit}
                    manager={manager}
                    slaMinutes={slaByUnit[unit.id] ?? 20}
                    onSlaChange={mins => setSlaByUnit(prev => ({ ...prev, [unit.id]: mins }))}
                  />
                </motion.div>
              );
            })}
          </div>

          <button className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl
            border-2 border-dashed border-border hover:border-primary/30 hover:bg-primary/5
            text-sm font-semibold text-muted-foreground hover:text-primary transition-all">
            <Plus className="w-4 h-4" />
            Adicionar unidade
          </button>
        </motion.section>
      </div>
    </div>
  );
};

export default Config;
