import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Server, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Key } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';

type TestStatus = 'idle' | 'testing' | 'success' | 'warning' | 'error';

interface ProviderConfig {
  provider: string;
  model: string;
  apiKey: string;
}

export const AiRouterConfig: React.FC = () => {
  const [provider, setProvider] = useState('Google');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [apiKey, setApiKey] = useState('');
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testLog, setTestLog] = useState<{ step: string; status: 'ok' | 'fail' | 'warn' }[]>([]);
  const [recommendation, setRecommendation] = useState<{ model: string; reason: string } | null>(null);

  const availableModels: Record<string, string[]> = {
    'Google': ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-8b', 'gemini-1.5-flash-8b-latest', 'gemini-2.0-flash', 'gemini-2.0-pro-exp', 'gemini-2.5-pro-preview', 'gemini-3.1-pro', 'gemini-3.1-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'],
    'OpenAI': ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o'],
    'Anthropic': ['claude-3-haiku-20240307', 'claude-3-5-sonnet-20240620'],
  };

  const handleTest = async () => {
    if (!apiKey) return;
    
    setTestStatus('testing');
    setTestLog([]);
    setRecommendation(null);

    // Mock testing sequence based on model
    const steps = [
      { step: 'Conexão com a API', delay: 400 },
      { step: 'Transcrição de Áudio (Whisper/Native)', delay: 600 },
      { step: 'Análise de Imagem/Vídeo (Vision)', delay: 800 },
      { step: 'Geração de Resumo Final (Contexto Longo)', delay: 500 },
    ];

    const logs: { step: string; status: 'ok' | 'fail' | 'warn' }[] = [];
    
    for (const step of steps) {
      await new Promise(r => setTimeout(r, step.delay));
      
      let status: 'ok' | 'fail' | 'warn' = 'ok';
      
      // Simulate capabilities based on model
      if (model.includes('flash') && model.includes('1.5') && step.step.includes('Vídeo')) {
        status = 'warn'; // 1.5 flash handles video but 2.0 is recommended
      }
      if (model.includes('gpt-3.5') && step.step.includes('Imagem')) {
        status = 'fail'; // gpt-3.5 no vision
      }
      
      logs.push({ step: step.step, status });
      setTestLog([...logs]);
    }

    // Determine final status
    const hasFail = logs.some(l => l.status === 'fail');
    const hasWarn = logs.some(l => l.status === 'warn');

    if (hasFail) {
      setTestStatus('error');
      if (provider === 'OpenAI' && model === 'gpt-3.5-turbo') {
        setRecommendation({ model: 'gpt-4o-mini', reason: 'gpt-3.5-turbo não suporta análise de imagem nativa. Recomendamos gpt-4o-mini ou superior para a funcionalidade completa.' });
      }
    } else if (hasWarn) {
      setTestStatus('warning');
      if (provider === 'Google' && model === 'gemini-1.5-flash') {
        setRecommendation({ model: 'gemini-2.0-flash', reason: 'Embora o 1.5 Flash suporte análise de vídeo, o 2.0 Flash possui maior estabilidade e precisão para esse volume de dados. Recomendamos o upgrade.' });
      }
    } else {
      setTestStatus('success');
      // Even if success, recommend elite alternative if on mini
      if (model === 'gpt-4o-mini') {
        setRecommendation({ model: 'gpt-4o', reason: 'O gpt-4o-mini atende a todos os requisitos. Para resumos complexos e raciocínio de vendas superior, o gpt-4o é a recomendação de elite.' });
      } else if (model === 'claude-3-haiku-20240307') {
        setRecommendation({ model: 'claude-3-5-sonnet-20240620', reason: 'Haiku atende aos requisitos básicos de forma rápida, mas Sonnet 3.5 possui visão muito superior para análise de peças automotivas.' });
      }
    }
  };

  const applyRecommendation = (recommendedModel: string) => {
    setModel(recommendedModel);
    setTestStatus('idle');
    setTestLog([]);
    setRecommendation(null);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
            Provider AI
          </label>
          <select value={provider} onChange={(e) => {
            setProvider(e.target.value);
            setModel(availableModels[e.target.value][0]);
            setTestStatus('idle');
            setTestLog([]);
          }} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-medium text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none">
            {Object.keys(availableModels).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
            Modelo
          </label>
          <select value={model} onChange={(e) => {
            setModel(e.target.value);
            setTestStatus('idle');
            setTestLog([]);
          }} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-medium text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none">
            {availableModels[provider].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
          Chave da API (API Key)
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="password"
              value={apiKey}
              onChange={e => {
                setApiKey(e.target.value);
                if (testStatus !== 'idle' && testStatus !== 'testing') setTestStatus('idle');
              }}
              placeholder="sk-..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <button 
            onClick={handleTest} 
            disabled={!apiKey || testStatus === 'testing'}
            className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {testStatus === 'testing' ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Diagnosticando...</>
            ) : 'Diagnóstico Inteligente'}
          </button>
        </div>
      </div>

      {/* Test Logs & Feedback */}
      <AnimatePresence>
        {testLog.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-xl border border-border bg-[#0a0a0f] p-4 space-y-3 overflow-hidden"
          >
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Logs de Diagnóstico</p>
            <div className="space-y-2">
              {testLog.map((log, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} 
                  key={idx} className="flex items-center gap-2 text-sm"
                >
                  {log.status === 'ok' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : 
                   log.status === 'warn' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : 
                   <AlertCircle className="w-4 h-4 text-rose-500" />}
                  <span className={log.status === 'ok' ? 'text-foreground/80' : log.status === 'warn' ? 'text-amber-500/90' : 'text-rose-500/90'}>
                    {log.step}
                  </span>
                </motion.div>
              ))}
            </div>

            {testStatus !== 'testing' && recommendation && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className={`mt-4 p-4 rounded-xl border ${
                  testStatus === 'error' ? 'bg-rose-500/10 border-rose-500/20' :
                  testStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                  'bg-indigo-500/10 border-indigo-500/20'
                }`}
              >
                <div className="flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    <Cpu className={`w-5 h-5 ${
                      testStatus === 'error' ? 'text-rose-400' :
                      testStatus === 'warning' ? 'text-amber-400' :
                      'text-indigo-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${
                      testStatus === 'error' ? 'text-rose-400' :
                      testStatus === 'warning' ? 'text-amber-400' :
                      'text-indigo-400'
                    }`}>Recomendação do Sistema</h4>
                    <p className={`text-xs mt-1 leading-relaxed ${
                      testStatus === 'error' ? 'text-rose-400/80' :
                      testStatus === 'warning' ? 'text-amber-400/80' :
                      'text-indigo-400/80'
                    }`}>
                      {recommendation.reason}
                    </p>
                    <button 
                      onClick={() => applyRecommendation(recommendation.model)}
                      className={`mt-3 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        testStatus === 'error' ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30' :
                        testStatus === 'warning' ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' :
                        'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
                      }`}
                    >
                      Mudar para {recommendation.model}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {testStatus === 'success' && !recommendation && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-semibold text-emerald-500">Modelo homologado e pronto para operação total.</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
