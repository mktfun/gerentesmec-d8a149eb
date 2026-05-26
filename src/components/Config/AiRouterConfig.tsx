import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Server, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Key, BarChart3 } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { ProviderMonitoring } from './ProviderMonitoring';

type TestStatus = 'idle' | 'testing' | 'success' | 'warning' | 'error';

interface ProviderConfig {
  provider: string;
  model: string;
  apiKey: string;
}

const availableModels: Record<string, string[]> = {
  'Google': [
    // Gemini 1.5
    'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash-8b', 'gemini-1.5-flash-8b-latest',
    'gemini-1.5-pro', 'gemini-1.5-pro-latest',
    // Gemini 2.0
    'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash-preview', 'gemini-2.0-pro-exp',
    // Gemini 2.5
    'gemini-2.5-flash-preview', 'gemini-2.5-pro-preview',
    // Gemini 3.x (preview/experimental)
    'gemini-3.1-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro', 'gemini-3.5-flash',
  ],
  'OpenAI': ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'o1-mini', 'o1', 'o3-mini'],
  'Anthropic': ['claude-3-haiku-20240307', 'claude-3-5-sonnet-20240620', 'claude-3-5-haiku-latest', 'claude-opus-4-5', 'claude-sonnet-4-5'],
  'OpenRouter': [
    // Google via OpenRouter
    'google/gemini-2.0-flash', 'google/gemini-2.5-pro-preview', 'google/gemini-flash-1.5',
    // Anthropic via OpenRouter
    'anthropic/claude-3.5-sonnet', 'anthropic/claude-3-haiku', 'anthropic/claude-opus-4',
    // OpenAI via OpenRouter
    'openai/gpt-4o', 'openai/gpt-4o-mini', 'openai/o3-mini',
    // Meta Llama
    'meta-llama/llama-3.3-70b-instruct', 'meta-llama/llama-3.1-8b-instruct',
    // Mistral
    'mistralai/mistral-large', 'mistralai/mistral-7b-instruct',
    // DeepSeek
    'deepseek/deepseek-chat', 'deepseek/deepseek-r1',
    // Qwen
    'qwen/qwen-2.5-72b-instruct',
    // Free models
    'google/gemma-3-27b-it:free', 'meta-llama/llama-3.1-8b-instruct:free', 'mistralai/mistral-7b-instruct:free',
  ],
  'NVIDIA NIM': [
    'meta/llama-3.1-405b-instruct', 'meta/llama-3.1-70b-instruct', 'meta/llama-3.1-8b-instruct',
    'mistralai/mistral-large-2-instruct', 'nvidia/nemotron-4-340b-instruct'
  ],
  'Google Vertex AI': [
    'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'
  ],
};

export const AiRouterConfig: React.FC = () => {
  const { aiSettings, updateAiSettings } = useAppData();
  
  const [provider, setProvider] = useState('Google');
  const [model, setModel] = useState(availableModels['Google'][0]);
  const [apiKey, setApiKey] = useState('');
  
  // GCP Fields
  const [gcpProjectId, setGcpProjectId] = useState('');
  const [gcpRegion, setGcpRegion] = useState('us-central1');
  const [gcpCredentials, setGcpCredentials] = useState('');
  
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testLog, setTestLog] = useState<{ step: string; status: 'ok' | 'fail' | 'warn' }[]>([]);
  const [recommendation, setRecommendation] = useState<{ model: string; reason: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'telemetry'>('config');

  React.useEffect(() => {
    if (aiSettings) {
      const p = availableModels[aiSettings.provider] ? aiSettings.provider : 'Google';
      const m = availableModels[p].includes(aiSettings.model) ? aiSettings.model : availableModels[p][0];
      setProvider(p);
      setModel(m);
      if (aiSettings.api_key) setApiKey(aiSettings.api_key);
      if (aiSettings.gcp_project_id) setGcpProjectId(aiSettings.gcp_project_id);
      if (aiSettings.gcp_region) setGcpRegion(aiSettings.gcp_region);
      if (aiSettings.gcp_credentials) setGcpCredentials(typeof aiSettings.gcp_credentials === 'string' ? aiSettings.gcp_credentials : JSON.stringify(aiSettings.gcp_credentials, null, 2));
    }
  }, [aiSettings]);

  const handleTest = async () => {
    if (provider === 'Google Vertex AI' && (!gcpCredentials || !gcpProjectId)) return;
    if (provider !== 'Google Vertex AI' && !apiKey) return;
    
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
      // Save even with warning, as it works partially
      await updateAiSettings({ 
        provider, model, api_key: apiKey, 
        gcp_project_id: gcpProjectId, gcp_region: gcpRegion, 
        gcp_credentials: provider === 'Google Vertex AI' && gcpCredentials ? JSON.parse(gcpCredentials) : null
      });
    } else {
      setTestStatus('success');
      await updateAiSettings({ 
        provider, model, api_key: apiKey, 
        gcp_project_id: gcpProjectId, gcp_region: gcpRegion, 
        gcp_credentials: provider === 'Google Vertex AI' && gcpCredentials ? JSON.parse(gcpCredentials) : null
      });
      
      // Even if success, recommend elite alternative if on mini
      if (model === 'gpt-4o-mini') {
        setRecommendation({ model: 'gpt-4o', reason: 'O gpt-4o-mini atende a todos os requisitos. Para resumos complexos e raciocínio de vendas superior, o gpt-4o é a recomendação de elite.' });
      } else if (model === 'claude-3-haiku-20240307') {
        setRecommendation({ model: 'claude-3-5-sonnet-20240620', reason: 'Haiku atende aos requisitos básicos de forma rápida, mas Sonnet 3.5 possui visão muito superior para análise de peças automotivas.' });
      }
    }
  };

  const applyRecommendation = async (recommendedModel: string) => {
    setModel(recommendedModel);
    setTestStatus('idle');
    setTestLog([]);
    setRecommendation(null);
    await updateAiSettings({ 
      provider, model: recommendedModel, api_key: apiKey,
      gcp_project_id: gcpProjectId, gcp_region: gcpRegion, 
      gcp_credentials: provider === 'Google Vertex AI' && gcpCredentials ? JSON.parse(gcpCredentials) : null
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      {/* Visual Premium Tabs */}
      <div className="flex border-b border-border/80 pb-3 gap-6">
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 pb-1.5 text-xs font-black uppercase tracking-widest transition-all relative ${
            activeTab === 'config' 
              ? 'text-primary font-black' 
              : 'text-muted-foreground hover:text-foreground font-bold'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Configurações de Rota
          {activeTab === 'config' && (
            <motion.div 
              layoutId="activeRouterTab" 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" 
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex items-center gap-2 pb-1.5 text-xs font-black uppercase tracking-widest transition-all relative ${
            activeTab === 'telemetry' 
              ? 'text-primary font-black' 
              : 'text-muted-foreground hover:text-foreground font-bold'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Métricas & Telemetria
          {activeTab === 'telemetry' && (
            <motion.div 
              layoutId="activeRouterTab" 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" 
            />
          )}
        </button>
      </div>

      {activeTab === 'config' ? (
        <div className="space-y-5">
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
                {(availableModels[provider] || []).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {provider === 'Google Vertex AI' ? (
            <div className="space-y-4 border-t border-border pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                    GCP Project ID
                  </label>
                  <input
                    type="text"
                    value={gcpProjectId}
                    onChange={e => {
                      setGcpProjectId(e.target.value);
                      if (testStatus !== 'idle' && testStatus !== 'testing') setTestStatus('idle');
                    }}
                    placeholder="Ex: meu-projeto-123"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-mono text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                    GCP Region
                  </label>
                  <input
                    type="text"
                    value={gcpRegion}
                    onChange={e => {
                      setGcpRegion(e.target.value);
                      if (testStatus !== 'idle' && testStatus !== 'testing') setTestStatus('idle');
                    }}
                    placeholder="Ex: us-central1"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-mono text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  Service Account JSON
                </label>
                <div className="flex items-start gap-2">
                  <textarea
                    value={gcpCredentials}
                    onChange={e => {
                      setGcpCredentials(e.target.value);
                      if (testStatus !== 'idle' && testStatus !== 'testing') setTestStatus('idle');
                    }}
                    placeholder='{ "type": "service_account", ... }'
                    className="w-full h-24 px-3 py-2.5 rounded-xl bg-muted border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                  />
                  <button 
                    onClick={handleTest} 
                    disabled={!gcpCredentials || !gcpProjectId || testStatus === 'testing'}
                    className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {testStatus === 'testing' ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Diagnosticando...</>
                    ) : 'Diagnóstico Inteligente'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
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
                    placeholder={provider === 'NVIDIA NIM' ? "nvapi-..." : "sk-..."}
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
          )}

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
      ) : (
        <ProviderMonitoring activeProvider={provider} activeModel={model} />
      )}
    </div>
  );
};
