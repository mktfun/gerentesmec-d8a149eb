import React from 'react';
import { motion } from 'framer-motion';
import { Unit, Manager, Lead } from '@/context/AppDataContext';
import { calculateTmr, calculateDangerLeads } from '@/utils/metrics';
import { Clock, AlertTriangle, Layers, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis, LabelList } from 'recharts';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GlobalOperationalSlideProps {
  units: Unit[];
  managers: Manager[];
  leads: Lead[];
  dailyScores: any[];
  businessHours: any;
}

export const GlobalOperationalSlide: React.FC<GlobalOperationalSlideProps> = ({ 
  units, 
  leads, 
  dailyScores,
  businessHours
}) => {
  const globalDangerLeads = calculateDangerLeads(leads, businessHours);
  const activeLeads = leads.filter(l => ['lead_new', 'negotiation', 'quote'].includes(l.funnel_stage));
  const waitingLeads = activeLeads.filter(l => l.funnel_stage === 'lead_new').length;
  const globalTmr = calculateTmr(leads, businessHours);

  // Formatar histórico para o gráfico (Top 14 dias)
  const chartData = dailyScores.map(ds => {
    return {
      date: ds.snapshot_date,
      displayDate: format(parseISO(ds.snapshot_date), "dd/MM", { locale: ptBR }),
      score: ds.global_score || 0
    };
  }).reverse();

  // Ranking das Piores Unidades em TMR/Danger
  const unitStats = units.map(u => {
    const uLeads = leads.filter(l => l.unit_id === u.id);
    const uDanger = calculateDangerLeads(uLeads, businessHours);
    const uTmr = calculateTmr(uLeads, businessHours);
    return {
      unit: u,
      tmr: uTmr,
      danger: uDanger.length,
      active: uLeads.filter(l => ['lead_new', 'negotiation', 'quote'].includes(l.funnel_stage)).length
    };
  }).filter(s => s.active > 0).sort((a, b) => b.danger - a.danger || b.tmr - a.tmr);

  const topGargalos = unitStats.slice(0, 5);

  return (
    <motion.div
      key="global-operational"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 flex items-center justify-center p-8 lg:p-16"
    >
      <div className="w-full max-w-7xl">
        {/* Global Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-[0.3em] mb-2">Painel Consolidado</h2>
            <h1 className="text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
              Visão Empresa
            </h1>
          </div>

          <div className="flex items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-xs uppercase font-bold tracking-widest text-white/50 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> TMR Global
              </span>
              <div className="text-4xl font-black text-white">{globalTmr}<span className="text-xl opacity-50 ml-1">m</span></div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-xs uppercase font-bold tracking-widest text-white/50 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Fila Geral
              </span>
              <div className="text-4xl font-black text-white">{waitingLeads}</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="flex flex-col text-amber-400">
              <span className="text-xs uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Total Atrasos
              </span>
              <div className="text-4xl font-black">{globalDangerLeads.length}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 rounded-[2rem] bg-white/[0.02] border border-white/10 p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            
            <h3 className="text-lg font-bold tracking-widest uppercase text-white/70 mb-8 z-10 flex items-center gap-2">
               <TrendingUp className="w-5 h-5" /> Evolução Global (Score)
            </h3>
            
            <div className="flex-1 min-h-[300px] z-10">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreColorGlobal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
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
                      itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#34d399" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#scoreColorGlobal)" 
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

          {/* Ranking de Gargalos */}
          <div className="rounded-[2rem] bg-white/[0.02] border border-amber-500/20 shadow-[0_0_30px_rgba(251,191,36,0.05)] p-8 flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
             
             <div className="flex items-center gap-3 mb-8 z-10">
               <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                 <AlertTriangle className="w-5 h-5 text-amber-400" />
               </div>
               <div>
                 <h3 className="text-lg font-bold tracking-widest uppercase text-white">Ranking de Gargalos</h3>
                 <p className="text-xs text-amber-400/80 font-medium">Lojas que precisam de atenção</p>
               </div>
             </div>

             <div className="flex flex-col gap-3 z-10 flex-1">
               {topGargalos.length > 0 ? (
                 topGargalos.map((stat, idx) => (
                   <motion.div 
                     key={stat.unit.id}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 0.5 + idx * 0.1 }}
                     className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors"
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/50">
                         {idx + 1}
                       </div>
                       <span className="font-bold text-white tracking-wide">{stat.unit.name}</span>
                     </div>
                     <div className="flex items-center gap-4">
                       <div className="flex flex-col items-end">
                         <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider">TMR</span>
                         <span className="font-black text-white">{stat.tmr}m</span>
                       </div>
                       <div className="flex flex-col items-end">
                         <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Atrasos</span>
                         <span className="font-black text-rose-400">{stat.danger}</span>
                       </div>
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="flex-1 flex items-center justify-center text-white/30 font-bold uppercase tracking-widest text-sm text-center">
                    Nenhuma loja ativa
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
