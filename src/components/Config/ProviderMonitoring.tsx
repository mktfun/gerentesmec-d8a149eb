import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, CheckCircle2, AlertTriangle, Clock, Database, 
  RefreshCw, Terminal, ArrowUpRight, Gauge, ShieldAlert, X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface ProviderMonitoringProps {
  activeProvider: string;
  activeModel: string;
}

interface UsageLog {
  id: string;
  created_at: string;
  provider: string;
  model: string;
  status: string;
  error_message: string | null;
  latency_ms: number | null;
  tokens_used: number | null;
  input_text: string | null;
  output_text: string | null;
  tokens_limit_remaining: number | null;
}

export const ProviderMonitoring: React.FC<ProviderMonitoringProps> = ({ 
  activeProvider, 
  activeModel 
}) => {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterProvider, setFilterProvider] = useState<string>(activeProvider || 'ALL');
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<UsageLog | null>(null);
  const [logTab, setLogTab] = useState<'input'|'output'>('input');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('llm_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs((data || []) as any);
    } catch (e) {
      console.error('Error fetching logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Set up auto-refresh interval every 15 seconds
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, []);

  // Sync active provider prop as default filter
  useEffect(() => {
    if (activeProvider) {
      setFilterProvider(activeProvider);
    }
  }, [activeProvider]);

  // Reset pagination to first page when filtering changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterProvider]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    if (filterProvider === 'ALL') return logs;
    return logs.filter(log => log.provider.toLowerCase() === filterProvider.toLowerCase());
  }, [logs, filterProvider]);

  // Paginated logs for table
  const paginatedLogs = useMemo(() => {
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    return filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // Compute stats
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const successes = filteredLogs.filter(l => l.status === 'success').length;
    const errors = filteredLogs.filter(l => l.status === 'error').length;
    const rate = total > 0 ? Math.round((successes / total) * 100) : 100;
    
    const validLatencies = filteredLogs.filter(l => l.latency_ms !== null) as { latency_ms: number }[];
    const avgLatency = validLatencies.length > 0 
      ? Math.round(validLatencies.reduce((acc, l) => acc + l.latency_ms, 0) / validLatencies.length)
      : 0;

    const totalTokens = filteredLogs.reduce((acc, l) => acc + (l.tokens_used || 0), 0);

    // RPM (Requests per minute) in the last 60 seconds
    const now = Date.now();
    const oneMinAgo = now - 60000;
    const rpm = filteredLogs.filter(l => new Date(l.created_at).getTime() > oneMinAgo).length;

    return { total, successes, errors, rate, avgLatency, totalTokens, rpm };
  }, [filteredLogs]);

  // Chart data: chronological order (reversed) for Recharts
  const chartData = useMemo(() => {
    return [...filteredLogs]
      .reverse()
      .slice(-30) // Show last 30 requests in the chart
      .map(log => ({
        time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        latency: log.latency_ms || 0,
        tokens: log.tokens_used || 0,
        status: log.status
      }));
  }, [filteredLogs]);

  // Active brand color setup matching Skill: ux-ui-architect-2026 guidelines
  const getProviderBranding = (prov: string) => {
    const p = prov.toLowerCase();
    if (p.includes('openai')) {
      return {
        color: 'hsl(161, 82%, 35%)',
        bg: 'rgba(16, 163, 127, 0.08)',
        border: 'rgba(16, 163, 127, 0.3)',
        text: 'text-[#10a37f]',
        glow: 'shadow-[0_0_20px_rgba(16,163,127,0.15)]',
        liquidBg: 'from-[#10a37f]/20 to-transparent'
      };
    } else if (p.includes('google') || p.includes('gemini') || p.includes('vertex')) {
      return {
        color: 'hsl(217, 89%, 61%)',
        bg: 'rgba(66, 133, 244, 0.08)',
        border: 'rgba(66, 133, 244, 0.3)',
        text: 'text-[#4285f4]',
        glow: 'shadow-[0_0_20px_rgba(66,133,244,0.15)]',
        liquidBg: 'from-[#4285f4]/20 to-transparent'
      };
    } else if (p.includes('nvidia') || p.includes('nim')) {
      return {
        color: 'hsl(93, 100%, 36%)',
        bg: 'rgba(118, 185, 0, 0.08)',
        border: 'rgba(118, 185, 0, 0.3)',
        text: 'text-[#76b900]',
        glow: 'shadow-[0_0_20px_rgba(118,185,0,0.15)]',
        liquidBg: 'from-[#76b900]/20 to-transparent'
      };
    } else if (p.includes('anthropic')) {
      return {
        color: 'hsl(24, 95%, 45%)',
        bg: 'rgba(235, 104, 33, 0.08)',
        border: 'rgba(235, 104, 33, 0.3)',
        text: 'text-[#eb6821]',
        glow: 'shadow-[0_0_20px_rgba(235,104,33,0.15)]',
        liquidBg: 'from-[#eb6821]/20 to-transparent'
      };
    }
    // Default / OpenRouter / etc
    return {
      color: 'hsl(250, 84%, 60%)',
      bg: 'rgba(99, 102, 241, 0.08)',
      border: 'rgba(99, 102, 241, 0.3)',
      text: 'text-indigo-400',
      glow: 'shadow-[0_0_20px_rgba(99,102,241,0.15)]',
      liquidBg: 'from-indigo-500/20 to-transparent'
    };
  };

  const branding = getProviderBranding(filterProvider === 'ALL' ? activeProvider : filterProvider);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-card">
        <div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-pulse bg-emerald-500`} />
            <h3 className="text-base font-black text-foreground">Monitor de Telemetria de IA</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Rastreamento de latência, tokens e integridade da Edge Function de Auditoria.
          </p>
        </div>

        {/* Filter / Refresh */}
        <div className="flex items-center gap-2">
          <select 
            value={filterProvider} 
            onChange={(e) => setFilterProvider(e.target.value)}
            className="px-3 py-2 rounded-xl bg-muted border border-border text-xs font-semibold text-foreground focus:outline-none focus:border-primary/50"
          >
            <option value="ALL">Todos os Provedores</option>
            <option value="Google">Google (AI Studio)</option>
            <option value="Google Vertex AI">Google Vertex AI</option>
            <option value="OpenAI">OpenAI</option>
            <option value="NVIDIA NIM">NVIDIA NIM</option>
            <option value="OpenRouter">OpenRouter</option>
          </select>
          
          <button 
            onClick={fetchLogs}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-muted border border-border hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Recarregando...' : 'Recarregar'}
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* RPM limit card */}
        <div className={`p-5 rounded-2xl bg-card border border-border transition-all duration-300 ${branding.glow} relative overflow-hidden`}>
          <div className="flex justify-between items-start mb-3">
            <Gauge className="w-5 h-5 text-muted-foreground" />
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Rate Limit</span>
          </div>
          <p className="text-2xl font-black text-foreground">{stats.rpm} <span className="text-xs font-normal text-muted-foreground">RPM</span></p>
          <div className="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="h-full transition-all duration-500" 
              style={{ width: `${Math.min((stats.rpm / 15) * 100, 100)}%`, backgroundColor: stats.rpm > 12 ? 'rgba(239, 68, 68, 0.8)' : branding.color }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Uso em tempo real (Limite sugerido: 15 RPM)</p>
          {/* Subtle liquid background aesthetic */}
          <div className={`absolute -bottom-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-tr ${branding.liquidBg} blur-xl pointer-events-none`} />
        </div>

        {/* Avg Latency Card */}
        <div className="p-5 rounded-2xl bg-card border border-border relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Latência Média</span>
          </div>
          <p className="text-2xl font-black text-foreground">
            {stats.avgLatency > 0 ? `${(stats.avgLatency / 1000).toFixed(2)}s` : 'N/A'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-3">Tempo de resposta da última chamada LLM</p>
        </div>

        {/* Total Tokens Consumed */}
        <div className="p-5 rounded-2xl bg-card border border-border relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <Database className="w-5 h-5 text-muted-foreground" />
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Tokens Usados</span>
          </div>
          <p className="text-2xl font-black text-foreground">
            {stats.totalTokens.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-3">Soma total de tokens processados nas últimas chamadas</p>
        </div>

        {/* Success Rate */}
        <div className="p-5 rounded-2xl bg-card border border-border relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Taxa de Sucesso</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-foreground">{stats.rate}%</p>
            <span className="text-[10px] text-muted-foreground">({stats.successes}/{stats.total})</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${stats.rate}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Sem erros críticos reportados</p>
        </div>
      </div>

      {/* Chart Panel */}
      {chartData.length > 0 && (
        <div className="p-5 rounded-2xl border border-border bg-card">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Latência das Últimas Requisições (ms)</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={branding.color} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={branding.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={9} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={9} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10,10,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelClassName="text-xs font-bold text-foreground"
                  itemStyle={{ fontSize: '12px', color: branding.color }}
                />
                <Area 
                  type="monotone" 
                  dataKey="latency" 
                  stroke={branding.color} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorLatency)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Audit logs table */}
      <div className="p-5 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Terminal className="w-4 h-4" /> Histórico de Telemetria de LLM
          </h4>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
            {filteredLogs.length} logs encontrados
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl">
            <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2 animate-pulse" />
            <p className="text-xs font-bold text-muted-foreground">Nenhum log encontrado para este provedor.</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Os logs de telemetria surgem à medida que o gerente envia e recebe mensagens.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="pb-3 pl-2">Data / Hora</th>
                    <th className="pb-3">Provedor</th>
                    <th className="pb-3">Modelo</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Tempo</th>
                    <th className="pb-3">Tokens</th>
                    <th className="pb-3 pr-2">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs">
                  {paginatedLogs.map((log) => {
                    const isError = log.status === 'error';
                    const logBranding = getProviderBranding(log.provider);
                    return (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 pl-2 font-mono text-muted-foreground/80">
                          {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${logBranding.text} ${logBranding.bg} border ${logBranding.border}`}>
                            {log.provider}
                          </span>
                        </td>
                        <td className="py-3.5 font-mono text-foreground/80">{log.model}</td>
                        <td className="py-3.5">
                          {isError ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 flex items-center gap-1 w-fit">
                              <ShieldAlert className="w-3 h-3" /> ERRO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> SUCESSO
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 font-mono font-bold">
                          {log.latency_ms ? `${log.latency_ms} ms` : '-'}
                        </td>
                        <td className="py-3.5 font-mono text-muted-foreground">
                          {log.tokens_used ? log.tokens_used.toLocaleString() : '-'}
                        </td>
                        <td className="py-3.5 pr-2">
                          {isError && log.error_message ? (
                            <button 
                              onClick={() => setSelectedError(log.error_message)}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[10px] font-bold transition-all flex items-center gap-1"
                            >
                              Ver Erro <ArrowUpRight className="w-3 h-3" />
                            </button>
                          ) : !isError && (log.input_text || log.output_text) ? (
                            <button 
                              onClick={() => { setSelectedLog(log); setLogTab('input'); }}
                              className="px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold transition-all flex items-center gap-1"
                            >
                              Ver Detalhes <ArrowUpRight className="w-3 h-3" />
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/40 pt-4 text-xs font-semibold text-muted-foreground">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl bg-muted border border-border hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold text-foreground"
                >
                  Anterior
                </button>
                
                <span>
                  Página <strong className="text-foreground">{currentPage}</strong> de <strong className="text-foreground">{totalPages}</strong>
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl bg-muted border border-border hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold text-foreground"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Details Modal */}
      <AnimatePresence>
        {selectedError && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
              onClick={() => setSelectedError(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5 text-rose-500">
                  <ShieldAlert className="w-5 h-5" />
                  <h4 className="text-sm font-black uppercase tracking-wider">Log de Erro da Provedora de IA</h4>
                </div>
                <button 
                  onClick={() => setSelectedError(null)}
                  className="p-1.5 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground transition-all text-xs font-bold"
                >
                  ESC
                </button>
              </div>

              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/15 text-xs font-mono text-rose-400 leading-relaxed overflow-y-auto max-h-60 break-words whitespace-pre-wrap">
                {selectedError}
              </div>

              <div className="mt-5 flex justify-end">
                <button 
                  onClick={() => setSelectedError(null)}
                  className="px-4 py-2 rounded-xl bg-muted border border-border text-xs font-bold text-foreground hover:bg-muted/80 transition-all"
                >
                  Fechar Diagnóstico
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {selectedLog && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
              onClick={() => setSelectedLog(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-border shrink-0 bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getProviderBranding(selectedLog.provider).bg} ${getProviderBranding(selectedLog.provider).border} border`}>
                    <Terminal className={`w-5 h-5 ${getProviderBranding(selectedLog.provider).text}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-foreground">Log de Execução: {selectedLog.provider}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">{selectedLog.model} • {selectedLog.latency_ms}ms</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Tokens Gastos</p>
                    <p className="text-sm font-black text-emerald-500">{selectedLog.tokens_used?.toLocaleString() || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Quota Restante</p>
                    <p className="text-sm font-black text-indigo-500">{selectedLog.tokens_limit_remaining?.toLocaleString() || '∞'}</p>
                  </div>
                  <div className="w-px h-8 bg-border mx-2" />
                  <button 
                    onClick={() => setSelectedLog(null)}
                    className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex border-b border-border px-6 pt-4 bg-muted/20 shrink-0">
                <button
                  onClick={() => setLogTab('input')}
                  className={`pb-3 px-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                    logTab === 'input' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Input Enviado (Prompt)
                </button>
                <button
                  onClick={() => setLogTab('output')}
                  className={`pb-3 px-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                    logTab === 'output' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Output da IA (Resposta)
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-[#0a0a0f]">
                {logTab === 'input' ? (
                  <pre className="text-xs font-mono text-indigo-300 whitespace-pre-wrap leading-relaxed">
                    {selectedLog.input_text || 'Nenhum input registrado.'}
                  </pre>
                ) : (
                  <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed">
                    {selectedLog.output_text || 'Nenhum output registrado.'}
                  </pre>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
