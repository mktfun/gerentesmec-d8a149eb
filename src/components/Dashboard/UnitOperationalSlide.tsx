import React from 'react';
import { motion } from 'framer-motion';
import { Unit, Manager, Lead } from '@/context/AppDataContext';
import { calculateTmr, calculateDangerLeads } from '@/utils/metrics';
import { Clock, AlertTriangle, Phone } from 'lucide-react';
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

  // Formatar histórico para o gráfico (Top 14 dias)
  const chartData = dailyScores.map(ds => {
    const breakdown = ds.unit_breakdown?.find((ub: any) => ub.unit_id === unit.id);
    return {
      date: ds.snapshot_date,
      displayDate: format(parseISO(ds.snapshot_date), "dd/MM", { locale: ptBR }),
      score: breakdown?.score || 0
    };
  }).reverse();

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
          <div>
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-[0.3em] mb-2">Unidade Operacional</h2>
            <h1 className="text-6xl font-black tracking-tight text-white">{unit.name}</h1>
            {manager && (
              <p className="text-xl text-white/40 font-medium mt-2">Resp: {manager.name}</p>
            )}
          </div>

          <div className={`flex items-center gap-6 p-6 rounded-3xl bg-white/5 border backdrop-blur-md ${dangerLeads.length > 0 ? 'border-rose-500/30' : 'border-white/10'}`}>
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
              <div className="text-4xl font-black">{dangerLeads.length}</div>
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

          {/* Critical Leads List */}
          <div className="rounded-[2rem] bg-white/[0.02] border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)] p-8 flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />
             
             <div className="flex items-center gap-3 mb-8 z-10">
               <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                 <AlertTriangle className="w-5 h-5 text-rose-400" />
               </div>
               <div>
                 <h3 className="text-lg font-bold tracking-widest uppercase text-white">Ação Imediata</h3>
                 <p className="text-xs text-rose-400 font-medium">Leads com SLA estourado</p>
               </div>
             </div>

             <div className="flex flex-col gap-3 z-10 flex-1">
               {criticalLeads.length > 0 ? (
                 criticalLeads.map((lead, idx) => (
                   <motion.div 
                     key={lead.id}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 0.5 + idx * 0.1 }}
                     className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors"
                   >
                     <div className="flex flex-col">
                       <span className="font-bold text-white mb-1">{lead.customer_name}</span>
                       <span className="text-xs text-white/50 flex items-center gap-1">
                         <Phone className="w-3 h-3" /> {lead.customer_phone || 'Sem contato'}
                       </span>
                     </div>
                     <div className="flex flex-col items-end">
                       <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Atraso</span>
                       <span className="font-black text-white">{lead.wait_time_minutes}m</span>
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-emerald-400/50">
                    <div className="w-16 h-16 rounded-full border border-emerald-500/20 flex items-center justify-center mb-4">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    </div>
                    <span className="text-sm font-bold tracking-widest uppercase">Sem Atrasos</span>
                    {activeLeads.length > 0 && (
                      <span className="text-xs font-bold text-emerald-500/50 mt-2">{activeLeads.length} leads no prazo</span>
                    )}
                 </div>
               )}
               
               {dangerLeads.length > 7 && (
                 <div className="text-center text-xs font-bold text-white/30 uppercase tracking-widest pt-4">
                   + {dangerLeads.length - 7} leads ocultos
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
