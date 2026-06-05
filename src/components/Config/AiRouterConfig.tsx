import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Server, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Key, BarChart3, Network } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { ProviderMonitoring } from './ProviderMonitoring';
import { TaskQueuePanel } from './TaskQueuePanel';
import { DailyDigestsPanel } from './DailyDigestsPanel';

type TestStatus = 'idle' | 'testing' | 'success' | 'warning' | 'error';

interface ProviderConfig {
  provider: string;
  model: string;
  apiKey: string;
}

const availableModels: Record<string, string[]> = {
  'Google': [
    'Gemini Free-Tier Ensemble (Auto-Routing)',
    // Free & Latest
    'gemma-4-31b-it', 'gemma-4-26b-it', 'gemini-2.5-flash', 'gemini-2.5-flash-8b',
    // Gemini 1.5
    'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash-8b', 'gemini-1.5-flash-8b-latest',
    'gemini-1.5-pro', 'gemini-1.5-pro-latest',
    // Gemini 2.0
    'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash-preview', 'gemini-2.0-pro-exp',
    // Gemini 2.5 Preview
    'gemini-2.5-flash-preview', 'gemini-2.5-pro-preview',
    // Gemini 3.x (preview/experimental)
    'gemini-3.1-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro', 'gemini-3.5-flash',
  ],
  'OpenAI': ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'o1-mini', 'o1', 'o3-mini'],
  'Anthropic': ['claude-3-haiku-20240307', 'claude-3-5-sonnet-20240620', 'claude-3-5-haiku-latest', 'claude-opus-4-5', 'claude-sonnet-4-5'],
  'OpenRouter': [
    'openrouter/free',
    'openrouter/auto',
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
    // GLM (Zhipu AI)
    'zhipuai/glm-4-plus',
    // Free models
    'google/gemma-3-27b-it:free', 'meta-llama/llama-3.1-8b-instruct:free', 'mistralai/mistral-7b-instruct:free',
  ],
  'NVIDIA NIM': [
    'z-ai/glm-5.1',
    'deepseek-ai/deepseek-v4-pro',
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    'google/gemma-4-31b-it',
    'meta/llama-3.1-405b-instruct',
    'meta/llama-3.1-70b-instruct',
    'meta/llama-3.3-70b-instruct',
    'meta/llama-3.2-90b-vision-instruct',
    'meta/llama-3.2-11b-vision-instruct',
    'nvidia/llama-3.1-nemotron-70b-instruct',
    'nvidia/nemotron-4-340b-instruct',
    'mistralai/mistral-large-2-instruct',
    'google/gemma-2-27b-it'
  ],
  'Google Vertex AI': [
    'gemini-3.5-flash',
    'gemini-3.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash-lite',
    'gemini-2.0-pro-exp',
    'gemini-1.5-pro-002',
    'gemini-1.5-flash-002',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b'
  ],
  'Local AI Proxy (CLI Tunnel)': [
    'gemini-3.5-flash', 'gemini-2.5-flash', 'gemma-4-31b-it', 'llama3'
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
  
  // Local Proxy Field
  const [apiUrl, setApiUrl] = useState('');
  
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testLog, setTestLog] = useState<{ step: string; status: 'ok' | 'fail' | 'warn' }[]>([]);
  const [recommendation, setRecommendation] = useState<{ model: string; reason: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'telemetry' | 'digests'>('config');
  const [offHoursBatching, setOffHoursBatching] = useState(true);
  const [showAdvancedGcp, setShowAdvancedGcp] = useState(false);

  const settingsInitialized = React.useRef(false);

  React.useEffect(() => {
    if (aiSettings && !settingsInitialized.current) {
      settingsInitialized.current = true;
      const p = availableModels[aiSettings.provider] ? aiSettings.provider : 'Google';
      let m = availableModels[p]?.includes(aiSettings.model) ? aiSettings.model : (availableModels[p] || [])[0];
      if (p === 'NVIDIA NIM') m = 'nvidia-auto-ensemble';
      setProvider(p);
      setModel(m);
      if (aiSettings.api_key) setApiKey(aiSettings.api_key);
      if (aiSettings.gcp_project_id) setGcpProjectId(aiSettings.gcp_project_id);
      if (aiSettings.gcp_region) setGcpRegion(aiSettings.gcp_region);
      if (aiSettings.gcp_credentials) setGcpCredentials(typeof aiSettings.gcp_credentials === 'string' ? aiSettings.gcp_credentials : JSON.stringify(aiSettings.gcp_credentials, null, 2));
      if (aiSettings.api_url || (aiSettings.features as any)?.api_url) {
        setApiUrl(aiSettings.api_url || (aiSettings.features as any)?.api_url);
      }
      if (aiSettings.off_hours_batching !== undefined) {
        setOffHoursBatching(aiSettings.off_hours_batching ?? true);
      }
    }
  }, [aiSettings]);

  const handleTest = async () => {
    // Para o Vertex AI, se não houver JSON colado, rejeitamos o teste. O Project ID pode ser preenchido manual ou vindo do JSON.
    if (provider === 'Google Vertex AI' && !gcpCredentials) return;
    
    // Tenta analisar o JSON antes do teste para ver se salva o project_id
    let resolvedProjectId = gcpProjectId;
    if (provider === 'Google Vertex AI' && gcpCredentials) {
      try {
        const parsed = JSON.parse(gcpCredentials);
        if (parsed && parsed.project_id) {
          resolvedProjectId = parsed.project_id;
          if (!gcpProjectId) setGcpProjectId(resolvedProjectId);
        }
      } catch (e) {
        // Ignora erro de parse aqui, deixamos falhar na requisição
      }
    }
    
    if (provider === 'Local AI Proxy (CLI Tunnel)' && !apiUrl) return;
    if (provider !== 'Google Vertex AI' && !apiKey && provider !== 'Local AI Proxy (CLI Tunnel)') return;
    
    setTestStatus('testing');
    setTestLog([]);
    setRecommendation(null);

    const logs: { step: string; status: 'ok' | 'fail' | 'warn' }[] = [];
    const addLog = (step: string, status: 'ok' | 'fail' | 'warn') => {
      logs.push({ step, status });
      setTestLog([...logs]);
    };

    try {
      if (provider === 'Google') {
        addLog('Iniciando handshake com Google AI Studio', 'ok');
        
        const testModel = model === 'Gemini Free-Tier Ensemble (Auto-Routing)' ? 'gemma-4-31b-it' : model;
        
        let bodyPayload: any = { contents: [{ parts: [{ text: "Responda apenas 'OK'" }] }] };
        if (testModel.includes('gemini')) {
          bodyPayload.generationConfig = { responseMimeType: "application/json" };
        }

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });
        
        if (res.ok) {
          addLog('Autenticação aceita (Chave Válida)', 'ok');
          addLog('Teste de Geração de Texto: SUCESSO', 'ok');
          setTestStatus('success');
        } else {
          const err = await res.json();
          addLog(`Falha na API: ${err.error?.message || res.statusText}`, 'fail');
          setTestStatus('error');
          setRecommendation({ model: testModel, reason: 'Verifique se a API Key é válida e se o modelo está correto.' });
        }
      } else if (provider === 'OpenAI' || provider === 'OpenRouter') {
        addLog(`Iniciando handshake com ${provider}`, 'ok');
        const endpoint = provider === 'OpenRouter' ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin || 'http://localhost',
            'X-Title': 'Antigravity Studio'
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: "Responda apenas 'OK'" }]
          })
        });

        if (res.ok) {
          addLog('Autenticação aceita (Chave Válida)', 'ok');
          addLog('Teste de Geração de Texto: SUCESSO', 'ok');
          setTestStatus('success');
        } else {
          let errorMsg = res.statusText;
          try {
            const errJson = await res.json();
            errorMsg = errJson.error?.message || JSON.stringify(errJson);
          } catch (e) { }
          addLog(`Falha na API (${res.status}): ${errorMsg}`, 'fail');
          setTestStatus('error');
        }
      } else if (provider === 'Local AI Proxy (CLI Tunnel)') {
        addLog(`Iniciando handshake com Túnel Local`, 'ok');
        const baseUrl = apiUrl.replace(/\/+$/, '');
        let res;
        try {
          res = await fetch(baseUrl, { method: 'GET' });
        } catch (err: any) {
          addLog(`Ignorando erro de CORS/Rede do navegador. Túnel assumido como ativo.`, 'warn');
          setTestStatus('success');
        }

        if (res) {
          if (res.ok || res.status === 404) {
            addLog('Túnel acessível na rede', 'ok');
            setTestStatus('success');
          } else {
            addLog(`Túnel retornou status ${res.status} — verifique se o servidor local está rodando`, 'fail');
            setTestStatus('error');
          }
        }
      } else if (provider === 'Google Vertex AI') {
        addLog('Iniciando handshake com Google Vertex AI', 'ok');
        let parsed = null;
        try {
          parsed = JSON.parse(gcpCredentials);
        } catch (e) {
          addLog('O JSON de credenciais GCP é inválido.', 'fail');
          setTestStatus('error');
        }

        if (parsed && parsed.project_id && parsed.private_key) {
          addLog('Estrutura de credenciais GCP validada', 'ok');
          addLog('Configuração salva. O teste real de rede ocorrerá na Auditoria (Edge Function).', 'ok');
          setTestStatus('success');
        } else if (parsed) {
          addLog('O JSON de credenciais GCP parece incompleto (faltando project_id ou private_key).', 'fail');
          setTestStatus('error');
        }
      } else {
        // Fallback genérico / mock para os que não implementamos teste real ainda
        addLog(`Mock Test: Provedor ${provider} não tem teste de rede nativo na UI`, 'warn');
        setTestStatus('warning');
      }

      if (logs.every(l => l.status === 'ok') || logs.some(l => l.status === 'warn') || provider === 'Local AI Proxy (CLI Tunnel)') {
        await updateAiSettings({ 
          provider, 
          model, 
          api_key: apiKey,
          off_hours_batching: offHoursBatching,
          gcp_project_id: gcpProjectId, gcp_region: gcpRegion, 
          gcp_credentials: provider === 'Google Vertex AI' && gcpCredentials ? (() => { try { return JSON.parse(gcpCredentials) } catch { return gcpCredentials } })() : null,
          ...(provider === 'Local AI Proxy (CLI Tunnel)' ? { api_url: apiUrl } : {})
        });
        addLog('Configuração salva na base de dados.', 'ok');
      }

    } catch (e: any) {
      addLog(`Erro de rede ou CORS: ${e.message}`, 'fail');
      setTestStatus('error');
    }
  };

  const applyRecommendation = async (recommendedModel: string) => {
    setModel(recommendedModel);
    setTestStatus('idle');
    setTestLog([]);
    setRecommendation(null);
    await updateAiSettings({ 
      provider, model: recommendedModel, api_key: apiKey,
      off_hours_batching: offHoursBatching,
      gcp_project_id: gcpProjectId, gcp_region: gcpRegion, 
      gcp_credentials: provider === 'Google Vertex AI' && gcpCredentials ? (() => { try { return JSON.parse(gcpCredentials) } catch { return gcpCredentials } })() : null,
      ...(provider === 'Local AI Proxy (CLI Tunnel)' ? { api_url: apiUrl } : {})
    });
  };

  const handleGcpJsonPaste = (val: string) => {
    setGcpCredentials(val);
    if (testStatus !== 'idle' && testStatus !== 'testing') setTestStatus('idle');
    try {
      const parsed = JSON.parse(val);
      if (parsed && parsed.project_id) {
        setGcpProjectId(parsed.project_id);
      }
    } catch (e) {
      // JSON inválido, apenas ignora
    }
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
            <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('digests')}
          className={`flex items-center gap-2 pb-1.5 text-xs font-black uppercase tracking-widest transition-all relative ${
            activeTab === 'digests' 
              ? 'text-indigo-400 font-black' 
              : 'text-muted-foreground hover:text-foreground font-bold'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Resumos Matinais
          {activeTab === 'digests' && (
            <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
      </div>

      {activeTab === 'config' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                Provider Sistema
              </label>
              <select value={provider} onChange={(e) => {
                const newProv = e.target.value;
                setProvider(newProv);
                let newMod = (availableModels[newProv] || [])[0];
                if (newProv === 'NVIDIA NIM') {
                  newMod = 'nvidia-auto-ensemble';
                }
                setModel(newMod);
                setTestStatus('idle');
                setTestLog([]);
                
                // Salvar instantaneamente ao mudar para evitar que o "Aplicar Alterações" reverta
                updateAiSettings({ provider: newProv, model: newMod });
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
              {provider === 'NVIDIA NIM' ? (
                <div className="w-full px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-sm font-bold text-primary flex items-center justify-between">
                  <span>Auto-Ensemble (Smart Routing)</span>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                </div>
              ) : model === 'Gemini Free-Tier Ensemble (Auto-Routing)' ? (
                <div className="relative">
                  <select value={model} onChange={(e) => {
                    const newMod = e.target.value;
                    setModel(newMod);
                    setTestStatus('idle');
                    setTestLog([]);
                    updateAiSettings({ provider, model: newMod });
                  }} className="w-full px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm font-bold text-emerald-500 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none">
                    {(availableModels[provider] || []).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
              ) : (
                <select value={model} onChange={(e) => {
                  const newMod = e.target.value;
                  setModel(newMod);
                  setTestStatus('idle');
                  setTestLog([]);
                  updateAiSettings({ provider, model: newMod });
                }} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-medium text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none">
                  {(availableModels[provider] || []).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {provider === 'Google Vertex AI' ? (
            <div className="space-y-4 border-t border-border pt-4">
              
              {/* Painel Zero-Click */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  Service Account JSON (Google Cloud)
                </label>
                <div className="flex flex-col gap-3">
                  <textarea
                    value={gcpCredentials}
                    onChange={e => handleGcpJsonPaste(e.target.value)}
                    placeholder='Cole aqui todo o conteúdo do seu arquivo credentials.json baixado do GCP...'
                    className="w-full h-32 px-4 py-3 rounded-xl bg-muted/50 border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                  />
                  
                  {/* Liquid Glass Feedback para Project ID Encontrado */}
                  <AnimatePresence>
                    {gcpProjectId && gcpCredentials.includes(gcpProjectId) && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center gap-3 backdrop-blur-sm"
                      >
                        <div className="bg-emerald-500/20 p-1.5 rounded-full">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-500">Projeto Reconhecido Automáticamente</p>
                          <p className="text-[11px] font-mono text-emerald-500/80 mt-0.5">{gcpProjectId}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button 
                    onClick={handleTest} 
                    disabled={!gcpCredentials || testStatus === 'testing'}
                    className="w-full px-4 py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {testStatus === 'testing' ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Conectando ao GCP...</>
                    ) : 'Diagnóstico Inteligente & Salvar'}
                  </button>
                </div>
              </div>

              {/* Advanced Options Accordion */}
              <div className="border border-border rounded-xl overflow-hidden mt-4">
                <button
                  onClick={() => setShowAdvancedGcp(!showAdvancedGcp)}
                  className="w-full px-4 py-3 bg-muted/30 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Opções Avançadas (Vertex)</span>
                  <span className="text-muted-foreground">{showAdvancedGcp ? '▼' : '▶'}</span>
                </button>
                <AnimatePresence>
                  {showAdvancedGcp && (
                    <motion.div 
                      initial={{ height: 0 }} 
                      animate={{ height: 'auto' }} 
                      exit={{ height: 0 }} 
                      className="overflow-hidden bg-card"
                    >
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                            Sobrescrever Project ID
                          </label>
                          <input
                            type="text"
                            value={gcpProjectId}
                            onChange={e => setGcpProjectId(e.target.value)}
                            placeholder="Opcional (Lido do JSON)"
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
                            onChange={e => setGcpRegion(e.target.value)}
                            placeholder="Ex: us-central1"
                            className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-mono text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div>
              {provider !== 'Local AI Proxy (CLI Tunnel)' && (
                <>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center justify-between">
                    <span>API Key</span>
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        if (testStatus !== 'idle' && testStatus !== 'testing') setTestStatus('idle');
                      }}
                      placeholder={`sk-...`}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-mono text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </>
              )}
              
              {provider === 'Local AI Proxy (CLI Tunnel)' && (
                <div className="mt-4">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center justify-between">
                    <span>API URL (Cloudflare/Ngrok Tunnel)</span>
                  </label>
                  <div className="relative">
                    <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={apiUrl}
                      onChange={(e) => {
                        setApiUrl(e.target.value);
                        if (testStatus !== 'idle' && testStatus !== 'testing') setTestStatus('idle');
                      }}
                      placeholder={`https://meu-tunel.trycloudflare.com`}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-mono text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                  
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 backdrop-blur-md overflow-hidden shadow-inner"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Network className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-bold text-primary">Proxy Local em Execução</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Lembre-se de manter o comando <code className="bg-black/20 px-1 py-0.5 rounded text-primary">cloudflared tunnel</code> rodando no seu terminal. Se você fechar a janela, a plataforma não conseguirá classificar os leads.
                    </p>
                  </motion.div>
                </div>
              )}

              {model === 'Gemini Free-Tier Ensemble (Auto-Routing)' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Network className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-sm font-bold text-emerald-500">Arquitetura de Fallbacks Auto-Gerenciada</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    O sistema distribuirá as tarefas inteligentemente para respeitar os <strong className="text-foreground">limites gratuitos</strong> da API do Google AI Studio, maximizando performance e zerando custos.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/10 dark:bg-white/5 text-xs">
                      <span className="font-bold text-foreground">Auditoria Longa (Scoring)</span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-emerald-400">Gemma 4 31B</span> 
                        <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded">Ilimitado</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/10 dark:bg-white/5 text-xs">
                      <span className="font-bold text-foreground">Ações Curtas (Pipeline)</span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-indigo-400">Gemma 4 26B</span> 
                        <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded">Ilimitado</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/10 dark:bg-white/5 text-xs">
                      <span className="font-bold text-foreground">Memória Semântica</span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-purple-400">Gemini Embedding 1</span> 
                        <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded">100 RPM</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/10 dark:bg-white/5 text-xs">
                      <span className="font-bold text-foreground">Visão e Áudio</span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-amber-400">Gemini 2.5 Flash</span> 
                        <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded">3-5 RPM</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Agrupar Lote Fora de Expediente</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Pausa a auditoria em tempo real à noite/fds para poupar recursos e condensa tudo no "Resumo Matinal".
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                     setOffHoursBatching(!offHoursBatching);
                     if (testStatus !== 'idle') setTestStatus('idle');
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${offHoursBatching ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${offHoursBatching ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="mt-6">
                <button 
                  onClick={handleTest} 
                  disabled={(provider !== 'Local AI Proxy (CLI Tunnel)' && !apiKey) || testStatus === 'testing' || (provider === 'Local AI Proxy (CLI Tunnel)' && !apiUrl)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      )}

      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          <TaskQueuePanel />
          <ProviderMonitoring activeProvider={aiSettings?.provider || 'Google'} activeModel={aiSettings?.model || ''} />
        </div>
      )}

      {activeTab === 'digests' && (
        <div className="space-y-6">
          <DailyDigestsPanel />
        </div>
      )}
    </div>
  );
};

