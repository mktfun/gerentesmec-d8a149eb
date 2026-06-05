import React from 'react';
import { motion } from 'framer-motion';
import { Unit, Manager, Lead } from '@/context/AppDataContext';
import { calculateTmr, calculateDangerLeads } from '@/utils/metrics';
import { avgScoreInt } from '@/utils/scoreUtils';
import { Clock, AlertTriangle, Phone, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis, LabelList } from 'recharts';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UnitOperationalSlideProps {
  unit: Unit;
  managers: Manager[];
  leads: Lead[];
  dailyScores: any[];
  businessHours: any;
}

export const UnitOperationalSlide: React.FC<UnitOperationalSlideProps> = ({ 
  unit, 
  managers, 
  leads, 
  dailyScores,
  businessHours
}) => {
  // Considerando a regra 1 gerente = 1 unidade
  const manager = managers[0];
  
  const unitLeads = leads.filter(l => l.unit_id === unit.id);
  const dangerLeads = calculateDangerLeads(unitLeads, businessHours);
  
  const activeLeads = unitLeads.filter(l => ['lead_new', 'negotiation', 'quote'].includes(l.funnel_stage));
  const waitingLeads = activeLeads.filter(l => l.funnel_stage === 'lead_new').length;
  const tmr = calculateTmr(unitLeads, businessHours);
  
  const todayScore = avgScoreInt(unitLeads, { statusFilter: true });

  // Formatar histórico para o gráfico (Top 14 dias)
  const chartData = dailyScores.map(ds => {
    const breakdown = ds.unit_breakdown?.find((ub: any) => ub.unit_id === unit.id);
    return {
      date: ds.snapshot_date,
      displayDate: format(parseISO(ds.snapshot_date), "dd/MM", { locale: ptBR }),
      score: breakdown?.score || 0
    };
  }).reverse();
  
  // Inclui o dia de hoje no gráfico
  chartData.push({
    date: new Date().toISOString(),
    displayDate: "Hoje",
    score: todayScore
  });

  // Top 7 critical leads for the list
  const criticalLeads = dangerLeads.slice(0, 7);

  return (
    <motion.div
      key={`unit-${unit.id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 flex items-center justify-center p-8 lg:p-16"
    >
      <div className="w-full max-w-7xl">
        {/* Unit Header */}
        <div className="flex items-end justify-between mb-12">
          {/* Col 1: Unit Info */}
          <div className="flex-1">
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-[0.3em] mb-2">Unidade Operacional</h2>
            <h1 className="text-6xl font-black tracking-tight text-white truncate max-w-xl">{unit.name}</h1>
            {manager && (
              <p className="text-xl text-white/40 font-medium mt-2 truncate max-w-xl">Resp: {manager.name}</p>
            )}
          </div>
          
          {/* Col 2: Score Central (Novo) */}
          <div className="flex-1 flex justify-center">
             <div className="flex flex-col items-center justify-center p-6 bg-white/[0.03] border border-white/10 rounded-[2rem] backdrop-blur-md relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full" />
                <div className="flex items-center gap-2 text-indigo-400 mb-2 z-10">
                   <Target className="w-4 h-4" />
                   <span className="text-xs uppercase font-bold tracking-widest">Score Live</span>
                </div>
                <div className="text-6xl font-black tracking-tighter text-white z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                   {todayScore}
                </div>
             </div>
          </div>

          {/* Col 3: Stats */}
          <div className="flex-1 flex justify-end">
            <div className={`flex items-center gap-6 p-6 rounded-3xl bg-white/5 border backdrop-blur-md ${dangerLeads.length > 0 ? 'border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'border-white/10'}`}>
              <div className="flex flex-col">
                <span className="text-xs uppercase font-bold tracking-widest text-white/50 mb-1">TMR</span>
                <div className="text-4xl font-black text-white">{tmr}<span className="text-xl opacity-50 ml-1">m</span></div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-xs uppercase font-bold tracking-widest text-white/50 mb-1">Fila</span>
                <div className="text-4xl font-black text-white">{waitingLeads}</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="flex flex-col text-rose-400">
                <span className="text-xs uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Atraso
                </span>
                <div className="text-4xl font-black drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">{dangerLeads.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 rounded-[2rem] bg-white/[0.02] border border-white/10 p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            
            <h3 className="text-lg font-bold tracking-widest uppercase text-white/70 mb-8 z-10">Desempenho Histórico (Score)</h3>
            
            <div className="flex-1 min-h-[300px] z-10">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="rgba(255,255,255,0.2)" 
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 'bold' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.2)" 
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#818cf8" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#scoreColor)" 
                      animationDuration={1500}
                    >
                      <LabelList dataKey="score" position="top" fill="rgba(255,255,255,0.8)" fontSize={12} fontWeight="bold" offset={10} />
                    </Area>
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30 font-medium">
                  Nenhum dado histórico disponível.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {/* Critical Leads List - Compact */}
            <div className="rounded-[2rem] bg-white/[0.02] border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)] p-8 flex flex-col relative overflow-hidden shrink-0">
               <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-[60px] pointer-events-none" />
               
               <div className="flex items-center gap-3 mb-6 z-10">
                 <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                   <AlertTriangle className="w-5 h-5 text-rose-400" />
                 </div>
                 <div>
                   <h3 className="text-sm font-bold tracking-widest uppercase text-white leading-tight">Ação Imediata</h3>
                   <p className="text-[10px] text-rose-400 font-medium">Leads com SLA estourado</p>
                 </div>
               </div>

               <div className="flex flex-col gap-2 z-10">
                 {criticalLeads.length > 0 ? (
                   <motion.div 
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between"
                   >
                     <div className="flex flex-col min-w-0 pr-4">
                       <span className="font-bold text-white mb-1 truncate">{criticalLeads[0].customer_name}</span>
                       <span className="text-xs text-rose-200 flex items-center gap-1 truncate">
                         <Phone className="w-3 h-3 shrink-0" /> {criticalLeads[0].customer_phone || 'Sem contato'}
                       </span>
                     </div>
                     <div className="flex flex-col items-end shrink-0">
                       <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Atraso</span>
                       <span className="text-xl font-black text-rose-400">{criticalLeads[0].wait_time_minutes}m</span>
                     </div>
                   </motion.div>
                 ) : (
                   <div className="flex flex-col items-center justify-center text-emerald-400/50 py-4">
                      <div className="w-12 h-12 rounded-full border border-emerald-500/20 flex items-center justify-center mb-2">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      </div>
                      <span className="text-[10px] font-bold tracking-widest uppercase">Sem Atrasos</span>
                   </div>
                 )}
                 
                 {dangerLeads.length > 1 && (
                   <div className="text-center mt-2">
                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/5 border border-rose-500/10 text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                       + {dangerLeads.length - 1} leads em alerta
                     </span>
                   </div>
                 )}
               </div>
            </div>

            {/* Funnel Distribution */}
            <div className="flex-1 rounded-[2rem] bg-white/[0.02] border border-white/10 p-8 flex flex-col relative overflow-hidden">
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
               <h3 className="text-sm font-bold tracking-widest uppercase text-white/70 mb-6 z-10">Funil em Andamento</h3>
               
               <div className="flex flex-col gap-4 flex-1 justify-center z-10">
                 {[
                   { id: 'lead_new', label: 'Novos / Fila', color: 'bg-indigo-500', text: 'text-indigo-400' },
                   { id: 'negotiation', label: 'Em Negociação', color: 'bg-amber-500', text: 'text-amber-400' },
                   { id: 'quote', label: 'Orçamento Enviado', color: 'bg-emerald-500', text: 'text-emerald-400' },
                 ].map(stage => {
                   const count = unitLeads.filter(l => l.funnel_stage === stage.id).length;
                   const pct = activeLeads.length > 0 ? (count / activeLeads.length) * 100 : 0;
                   return (
                     <div key={stage.id} className="flex flex-col gap-2">
                       <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                         <span className="text-white/70">{stage.label}</span>
                         <span className={stage.text}>{count}</span>
                       </div>
                       <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${pct}%` }}
                           transition={{ duration: 1, ease: "easeOut" }}
                           className={`h-full rounded-full ${stage.color}`}
                         />
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

