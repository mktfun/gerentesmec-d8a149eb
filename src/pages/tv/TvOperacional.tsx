import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, Users, Layers } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { calculateTmr, calculateDangerLeads } from '@/utils/metrics';

const TvOperacional = () => {
  const { leads, businessHours, managers } = useAppData();
  
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(i);
  }, []);

  const tmr = calculateTmr(leads, businessHours);
  const dangerLeads = calculateDangerLeads(leads, businessHours);
  
  const activeLeads = leads.filter(l => l.funnel_stage === 'lead_new' || l.funnel_stage === 'negotiation' || l.funnel_stage === 'quote');
  const criticalCount = dangerLeads.length;
  const waitingLeads = activeLeads.filter(l => l.funnel_stage === 'lead_new').length;
  const inProgressLeads = activeLeads.filter(l => l.funnel_stage === 'negotiation' || l.funnel_stage === 'quote').length;

  const unitStats = managers.map(m => {
    const mLeads = activeLeads.filter(l => l.manager_id === m.id);
    const mDanger = dangerLeads.filter(l => l.manager_id === m.id).length;
    const mTmr = calculateTmr(mLeads, businessHours);
    
    return {
      manager: m,
      leadNew: mLeads.filter(l => l.funnel_stage === 'lead_new').length,
      negotiation: mLeads.filter(l => l.funnel_stage === 'negotiation').length,
      quote: mLeads.filter(l => l.funnel_stage === 'quote').length,
      danger: mDanger,
      tmr: mTmr
    };
  }).filter(u => u.leadNew > 0 || u.negotiation > 0 || u.quote > 0).sort((a, b) => b.danger - a.danger || b.leadNew - a.leadNew);

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden relative">
      
      {/* Background Liquid Glass Effects */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none transition-colors duration-1000 ${criticalCount > 0 ? 'bg-rose-600/20' : 'bg-emerald-600/10'}`} />

      {/* Header Compacto (Macro View) */}
      <header className="h-24 px-8 border-b border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Layers className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-tight">Radar Operacional</h1>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Live Sync</p>
            </div>
          </div>
          
          <div className="w-px h-8 bg-white/10 mx-2" />

          {/* Macro KPIs */}
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-widest">TMR Global</span>
              </div>
              <div className="text-2xl font-black">{tmr}<span className="text-sm text-white/50 ml-1">m</span></div>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-widest">Aguardando</span>
              </div>
              <div className="text-2xl font-black text-amber-400">{waitingLeads}</div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-white/50 mb-1">
                <Layers className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-widest">Em Box</span>
              </div>
              <div className="text-2xl font-black">{inProgressLeads}</div>
            </div>

            <div className={`flex flex-col pl-6 border-l border-white/10 ${criticalCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className={`w-4 h-4 ${criticalCount > 0 ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] uppercase font-bold tracking-widest">SLAs Violados</span>
              </div>
              <div className="text-3xl font-black">{criticalCount}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Online</span>
        </div>
      </header>

      {/* Corpo (Grid de Gerentes) */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {unitStats.map((stat, idx) => (
            <motion.div
              key={stat.manager.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-[2rem] bg-white/[0.02] border p-6 flex flex-col transition-all duration-500 ${
                stat.danger > 0 
                  ? 'border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)] bg-rose-500/5' 
                  : 'border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white leading-none mb-1">{stat.manager.name}</h3>
                  <div className="text-xs font-bold uppercase tracking-widest text-white/40">
                    Ativos: {stat.leadNew + stat.negotiation + stat.quote}
                  </div>
                </div>
                
                <div className={`flex flex-col items-end ${stat.tmr > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest mb-1">
                    <Clock className="w-3 h-3" /> TMR
                  </div>
                  <div className="text-3xl font-black leading-none">{stat.tmr}<span className="text-sm ml-0.5 opacity-50">m</span></div>
                </div>
              </div>

              {/* Contadores Internos */}
              <div className="grid grid-cols-3 gap-2 mt-auto">
                <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center ${
                  stat.leadNew > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-black/20 border-white/5 text-white/30'
                }`}>
                  <div className="text-2xl font-black mb-1">{stat.leadNew}</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest">Espera</div>
                </div>
                
                <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center ${
                  stat.negotiation > 0 ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-black/20 border-white/5 text-white/30'
                }`}>
                  <div className="text-2xl font-black mb-1">{stat.negotiation}</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest">Negoc.</div>
                </div>

                <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center ${
                  stat.quote > 0 ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-black/20 border-white/5 text-white/30'
                }`}>
                  <div className="text-2xl font-black mb-1">{stat.quote}</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest">Orçam.</div>
                </div>
              </div>

              {/* Alerta de Atraso */}
              {stat.danger > 0 && (
                <div className="mt-4 px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest text-rose-400">{stat.danger} Atrasados</span>
                </div>
              )}
            </motion.div>
          ))}

          {unitStats.length === 0 && (
            <div className="col-span-full h-64 flex flex-col items-center justify-center text-white/30">
              <p className="text-2xl font-bold">Nenhum atendimento ativo no momento.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default TvOperacional;
