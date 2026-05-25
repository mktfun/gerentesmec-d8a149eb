import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, Zap, Target } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { calculateTmr, calculateDangerLeads } from '@/utils/metrics';

const TvOperacional = () => {
  const { leads, businessHours, managers } = useAppData();
  
  // Update UI every minute for real-time counters
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(i);
  }, []);

  const tmr = calculateTmr(leads, businessHours);
  const dangerLeads = calculateDangerLeads(leads, businessHours);
  
  const activeLeads = leads.filter(l => l.funnel_stage === 'lead_new' || l.funnel_stage === 'negotiation' || l.funnel_stage === 'quote');
  const criticalCount = dangerLeads.length;

  // Filas
  const waitQueue = activeLeads.filter(l => l.funnel_stage === 'lead_new').sort((a, b) => {
    const aTime = new Date(a.last_message_at || a.created_at).getTime();
    const bTime = new Date(b.last_message_at || b.created_at).getTime();
    return aTime - bTime; // oldest first
  });

  const inProgressLeads = activeLeads.filter(l => l.funnel_stage === 'negotiation' || l.funnel_stage === 'quote');
  
  // Status por unidade
  const unitStats = managers.map(m => {
    const mLeads = inProgressLeads.filter(l => l.manager_id === m.id);
    return {
      manager: m,
      negotiation: mLeads.filter(l => l.funnel_stage === 'negotiation').length,
      quote: mLeads.filter(l => l.funnel_stage === 'quote').length,
      total: mLeads.length
    };
  }).filter(u => u.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white flex flex-col p-8 md:p-12 font-sans overflow-hidden relative">
      
      {/* Background Liquid Glass Effects */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none transition-colors duration-1000 ${criticalCount > 0 ? 'bg-rose-600/20' : 'bg-emerald-600/10'}`} />

      {/* Header */}
      <header className="flex items-center justify-between z-10 mb-16">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl">
            <Target className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white/90">Operação em Tempo Real</h1>
            <p className="text-lg text-white/40 font-medium uppercase tracking-widest">Painel Gerencial</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-bold uppercase tracking-widest text-white/60">Live Sync</span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 flex-1">
        
        {/* Left Column: Fila de Espera (Novo Lead) */}
        <div className="lg:col-span-4 bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col">
          <div className="flex items-center gap-4 text-white/80 mb-8">
            <Zap className="w-6 h-6 text-indigo-400" />
            <span className="text-lg font-bold uppercase tracking-widest">Fila de Espera ({waitQueue.length})</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar flex flex-col gap-4">
            <AnimatePresence>
              {waitQueue.map((lead, idx) => {
                const manager = managers.find(m => m.id === lead.manager_id);
                const isCritical = dangerLeads.some(d => d.id === lead.id);

                return (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-5 rounded-2xl flex flex-col gap-3 border ${
                      isCritical 
                        ? 'bg-rose-500/5 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]' 
                        : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-white/70'
                        }`}>
                          {manager ? manager.name.substring(0, 2).toUpperCase() : '??'}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{lead.name}</h3>
                          <p className="text-xs font-medium text-white/50">{manager?.name || 'Sem Responsável'}</p>
                        </div>
                      </div>
                      {isCritical && (
                        <div className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded">Atrasado</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {waitQueue.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-white/30 text-center p-6">
                  <p className="text-lg font-medium">Nenhum cliente aguardando na etapa inicial.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Middle Column: Big Metrics */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* TMR Box */}
          <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 backdrop-blur-2xl flex flex-col justify-center items-center text-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-3 text-indigo-400 mb-6">
              <Clock className="w-6 h-6" />
              <span className="text-sm font-bold uppercase tracking-widest">TMR Geral</span>
            </div>
            <div>
              <div className="text-7xl lg:text-8xl font-black leading-none tracking-tighter text-white">
                {tmr}
                <span className="text-3xl lg:text-4xl text-white/50 ml-2">m</span>
              </div>
              <p className="text-lg text-white/60 font-medium mt-4">
                Meta: &lt; 15m
              </p>
            </div>
          </div>

          {/* Critical Count Box */}
          <div className={`flex-1 border rounded-[2rem] p-8 backdrop-blur-2xl flex flex-col justify-center items-center text-center transition-all duration-1000 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${
            criticalCount > 0 
              ? 'bg-rose-500/10 border-rose-500/30' 
              : 'bg-white/[0.02] border-white/10'
          }`}>
            <div className={`flex items-center gap-3 mb-6 ${criticalCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              <AlertTriangle className={`w-6 h-6 ${criticalCount > 0 ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-bold uppercase tracking-widest">SLAs Críticos</span>
            </div>
            <div>
              <div className={`text-7xl lg:text-8xl font-black leading-none tracking-tighter ${criticalCount > 0 ? 'text-rose-500 drop-shadow-[0_0_40px_rgba(244,63,94,0.4)]' : 'text-emerald-500'}`}>
                {criticalCount}
              </div>
              <p className={`text-lg font-medium mt-4 ${criticalCount > 0 ? 'text-rose-400/80' : 'text-emerald-400/80'}`}>
                {criticalCount > 0 ? 'Atenção Imediata' : 'Saudável'}
              </p>
            </div>
          </div>
          
        </div>

        {/* Right Column: Status de Atendimentos */}
        <div className="lg:col-span-4 bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col">
          <div className="flex items-center gap-4 text-white/80 mb-8">
            <Target className="w-6 h-6 text-amber-400" />
            <span className="text-lg font-bold uppercase tracking-widest">Em Atendimento ({inProgressLeads.length})</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar flex flex-col gap-4">
            <AnimatePresence>
              {unitStats.map((stat, idx) => (
                <motion.div
                  key={stat.manager.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-5 rounded-2xl bg-white/5 border border-white/5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{stat.manager.name}</h3>
                    <span className="text-2xl font-black text-amber-400">{stat.total}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/20 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-white/90">{stat.negotiation}</div>
                      <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Negociando</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-indigo-400">{stat.quote}</div>
                      <div className="text-[10px] uppercase font-bold text-indigo-400/60 tracking-wider">Orçamentos</div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {unitStats.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-white/30 text-center p-6">
                  <p className="text-lg font-medium">Nenhum lead em andamento no momento.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TvOperacional;
