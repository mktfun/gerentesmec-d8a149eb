import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, Clock, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { useAppData, Lead } from '@/context/AppDataContext';
import { calculateTmr, calculateDangerLeads } from '@/utils/metrics';
import TvDashboard from '@/components/Dashboard/TvDashboard';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 280, damping: 26, delay },
});

const WEEK_DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const avg = (nums: number[]) => nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;

const Index = () => {
  const { leads, managers, units, isTvMode, setIsTvMode, chatwootInsights, integrationSettings } = useAppData();
  
  if (isTvMode) {
    return <TvDashboard />;
  }

  const toggleTvMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsTvMode(true);
    }
  };

  // --- Real-time Metrics Calculation ---
  const now = new Date();
  const today0 = startOfDay(now);

  const scoredLeads = leads.filter(l => l.score !== null);
  const globalScoreAvg = avg(scoredLeads.map(l => Number(l.score)));
  const globalScore = globalScoreAvg !== null ? Math.round(globalScoreAvg * 10) / 10 : null;

  // Score series — last 7 days
  const scoreHistory = useMemo(() => {
    const series: { day: string; score: number | null }[] = [];
    let validPoints = 0;
    
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today0); day.setDate(day.getDate() - i);
      const next = new Date(day); next.setDate(next.getDate() + 1);
      const dayLeads = scoredLeads.filter(l => {
        const t = new Date(l.last_message_at).getTime();
        return t >= day.getTime() && t < next.getTime();
      });
      const a = avg(dayLeads.map(l => Number(l.score)));
      if (a !== null) validPoints++;
      series.push({ day: WEEK_DAY_LABELS[day.getDay()], score: a !== null ? Math.round(a) : null });
    }

    // Chart Fallback: Se for o dia 1 de uso e só tem 1 ponto, vamos "esticar" essa linha horizontalmente 
    // para preencher o gráfico de forma visualmente agradável ao invés de um ponto solto solitário.
    if (validPoints === 1) {
      const singleScore = series.find(s => s.score !== null)?.score;
      if (singleScore !== undefined) {
        return series.map(s => ({ ...s, score: singleScore }));
      }
    }
    
    return series;
  }, [scoredLeads, today0]);

  const hasHistory = scoreHistory.some(d => d.score !== null);

  // Week-over-week trend
  const weekTrend = useMemo(() => {
    const lastWeek = scoredLeads.filter(l => {
      const t = new Date(l.last_message_at).getTime();
      return t >= today0.getTime() - 7 * 86400000 && t < today0.getTime() + 86400000;
    });
    const prevWeek = scoredLeads.filter(l => {
      const t = new Date(l.last_message_at).getTime();
      return t >= today0.getTime() - 14 * 86400000 && t < today0.getTime() - 7 * 86400000;
    });
    const a = avg(lastWeek.map(l => Number(l.score)));
    const b = avg(prevWeek.map(l => Number(l.score)));
    if (a === null || b === null) return null;
    return Math.round((a - b) * 10) / 10;
  }, [scoredLeads, today0]);

  // Unit scores
  const unitScores = units.map(u => {
    const uLeads = scoredLeads.filter(l => l.unit_id === u.id);
    const a = avg(uLeads.map(l => Number(l.score)));
    return { ...u, score: a !== null ? Math.round(a) : null };
  });

  // Today metrics
  const todayLeads = leads.filter(l => new Date(l.last_message_at).getTime() >= today0.getTime());
  
  const calculateTmrFallback = (leadsList: Lead[]) => calculateTmr(leadsList);
  const todayTmr = calculateTmrFallback(todayLeads);

  const pendingAudits = todayLeads.filter(l => (l.funnel_stage === 'closed_won' || l.funnel_stage === 'closed_lost') && l.score === null).length;
  const completedLeads = todayLeads.filter(l => l.funnel_stage === 'closed_won' || l.funnel_stage === 'closed_lost');
  const resolutionRate = todayLeads.length > 0 ? ((completedLeads.length / todayLeads.length) * 100).toFixed(1) : '0';
  
  const dangerLeads = calculateDangerLeads(todayLeads);

  const [chatwootTmr, setChatwootTmr] = React.useState<string | null>(null);
  const [chatwootRes, setChatwootRes] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (integrationSettings && integrationSettings.chatwoot_url && integrationSettings.chatwoot_token) {
      const fetchMetrics = async () => {
        try {
          const baseUrl = integrationSettings.chatwoot_url.startsWith('http') ? integrationSettings.chatwoot_url : `https://${integrationSettings.chatwoot_url}`;
          const token = integrationSettings.chatwoot_token;
          const accountId = integrationSettings.chatwoot_account_id || 5; // using 5 as we found
          
          // last 7 days
          const since = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
          const until = Math.floor(Date.now() / 1000);

          const headers = { 'api_access_token': token };

          const [tmrRes, resRes] = await Promise.all([
            fetch(`${baseUrl.replace(/\/$/, '')}/api/v2/accounts/${accountId}/reports/summary?metric=avg_first_response_time&since=${since}&until=${until}`, { headers }),
            fetch(`${baseUrl.replace(/\/$/, '')}/api/v2/accounts/${accountId}/reports/summary?metric=avg_resolution_time&since=${since}&until=${until}`, { headers })
          ]);

          const tmrData = await tmrRes.json();
          const resData = await resRes.json();

          const tmrSec = tmrData.avg_first_response_time || 0;
          if (tmrSec > 0) setChatwootTmr((tmrSec / 60).toFixed(1));

          const resSec = resData.avg_resolution_time || 0;
          if (resSec > 0) setChatwootRes((resSec / 3600).toFixed(1));

        } catch (e) {
          console.error("Failed to fetch chatwoot metrics", e);
        }
      };
      fetchMetrics();
    }
  }, [integrationSettings]);

  // Manager ranking
  const managerRanking = managers.map(m => {
    const mLeads = scoredLeads.filter(l => l.manager_id === m.id || (!l.manager_id && l.unit_id === m.unit_id));
    const a = avg(mLeads.map(l => Number(l.score)));
    const unit = units.find(u => u.id === m.unit_id);
    return { ...m, score: a !== null ? Math.round(a) : null, unitName: unit?.name || 'N/A' };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  const todayStr = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date());

  return (
    <div className="p-8 pb-20 min-h-screen">
      
      {/* ── HERO CARD: SCORE GLOBAL ── */}
      <motion.div {...fadeUp(0.05)} className="mb-6 rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-indigo-300/70 mb-4">Score Global da Rede</p>
          <div className="flex items-end gap-6 mb-2">
            <h2 className="text-7xl lg:text-8xl font-black text-white tracking-tighter leading-none">
              {globalScore !== null ? <>{globalScore}<span className="text-4xl text-white/50">%</span></> : <span className="text-white/40">—</span>}
            </h2>
            {weekTrend !== null && (
              <div className={`mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm ${weekTrend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                <TrendingUp className={`w-4 h-4 ${weekTrend < 0 ? 'rotate-180' : ''}`} />
                {weekTrend >= 0 ? '+' : ''}{weekTrend}% vs semana anterior
              </div>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-4">
            {globalScore !== null ? `Média de qualidade de atendimento · Hoje, ${todayStr}` : 'Aguardando primeiras auditorias'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch justify-start lg:justify-end gap-4 w-full lg:w-auto mt-6 lg:mt-0">
          
          <div className="bg-black/20 backdrop-blur-md px-6 py-5 rounded-2xl flex flex-col justify-center min-w-[140px] border border-white/5 shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Unidades Ativas</p>
            <p className="text-3xl font-black text-white">{units.length}</p>
          </div>

          <div className="bg-black/20 backdrop-blur-md px-6 py-5 rounded-2xl flex flex-col justify-center min-w-[140px] border border-white/5 shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Resolução {chatwootRes ? '(Global)' : 'Hoje'}
            </p>
            <p className="text-3xl font-black text-emerald-400">
              {chatwootRes ? <>{chatwootRes}<span className="text-sm font-bold text-emerald-400/50 ml-1">hrs</span></> : <>{resolutionRate}%</>}
            </p>
          </div>

          <div className="bg-black/20 backdrop-blur-md px-6 py-5 rounded-2xl flex flex-col justify-center min-w-[140px] border border-white/5 shadow-inner relative overflow-hidden">
            <div className="absolute right-[-10px] top-[-10px] w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Tempo Médio {chatwootTmr ? '(Global)' : ''}
            </p>
            <p className="text-3xl font-black text-indigo-400">
              {chatwootTmr ? chatwootTmr : todayTmr}<span className="text-sm font-bold text-indigo-400/50 ml-1">min</span>
            </p>
          </div>

        </div>
      </motion.div>

      {/* ── METRICS ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <motion.div {...fadeUp(0.1)} className="rounded-2xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6">
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-4xl font-black text-white mb-2">{todayLeads.length}</h3>
          <p className="text-sm text-slate-300 font-medium mb-1">Atendimentos Hoje</p>
          <p className="text-xs text-indigo-400">{pendingAudits} auditorias pendentes</p>
        </motion.div>

        <motion.div {...fadeUp(0.15)} className="rounded-2xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-4xl font-black text-white mb-2">{completedLeads.length}</h3>
          <p className="text-sm text-slate-300 font-medium mb-1">Concluídos com Sucesso</p>
          <p className="text-xs text-emerald-400">{resolutionRate}% de resolução</p>
        </motion.div>

        <motion.div {...fadeUp(0.2)} className="rounded-2xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <h3 className={`text-4xl font-black mb-2 ${dangerLeads.length > 0 ? 'text-rose-500' : 'text-white'}`}>{dangerLeads.length}</h3>
          <p className="text-sm text-slate-300 font-medium mb-1">Leads em Alerta ({'>'}20m)</p>
          <p className="text-xs text-rose-400">Ação imediata necessária</p>
        </motion.div>
      </div>

      {/* ── CHARTS & RANKING ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Area Chart */}
        <motion.div {...fadeUp(0.25)} className="rounded-2xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 lg:col-span-2 shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex flex-col">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Evolução do Score Global</h3>
              <p className="text-sm text-slate-400 mt-1">Últimos 7 dias</p>
            </div>
            {weekTrend !== null && (
              <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${weekTrend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {weekTrend >= 0 ? '▲' : '▼'} {weekTrend >= 0 ? '+' : ''}{weekTrend}%
              </div>
            )}
          </div>
          <div className="flex-1 min-h-[220px]">
            {hasHistory ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#13111A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" connectNulls activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                <Clock className="w-8 h-8 mb-3 opacity-40" />
                <p className="text-sm font-semibold">Sem auditorias nos últimos 7 dias</p>
                <p className="text-xs text-slate-500 mt-1">O gráfico será preenchido conforme novos atendimentos forem pontuados.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Ranking */}
        <motion.div {...fadeUp(0.3)} className="rounded-2xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 lg:col-span-1 shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Ranking de Gerentes</h3>
          </div>
          <div className="flex-1 flex flex-col gap-5">
            {managerRanking.map((m, idx) => (
              <div key={m.id} className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-500 w-4">{idx + 1}</span>
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm shrink-0">
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{m.name}</h4>
                  <p className="text-xs text-slate-400 truncate">{m.unitName}</p>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-black flex items-center justify-end gap-1 mb-1 ${m.score === null ? 'text-white/30' : m.score >= 75 ? 'text-emerald-400' : m.score >= 50 ? 'text-indigo-300' : 'text-rose-400'}`}>
                    {m.score !== null ? `${m.score}%` : '—'}
                  </div>
                  <div className="w-16 h-1.5 bg-[#13111A] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${m.score ?? 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {managerRanking.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-8">Cadastre gerentes para ver o ranking.</p>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Index;
