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
        
        {/* Left Column: Big Metrics */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* TMR Box */}
          <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[2rem] p-10 backdrop-blur-2xl flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-4 text-indigo-400 mb-8">
              <Clock className="w-8 h-8" />
              <span className="text-xl font-bold uppercase tracking-widest">TMR Geral</span>
            </div>
            <div>
              <div className="text-7xl md:text-8xl lg:text-9xl font-black leading-none tracking-tighter text-white">
                {tmr}
                <span className="text-3xl md:text-5xl text-white/50 ml-2">m</span>
              </div>
              <p className="text-xl md:text-2xl text-white/60 font-medium mt-4">
                Meta: &lt; 15m
              </p>
            </div>
          </div>

          {/* Critical Count Box */}
          <div className={`flex-1 border rounded-[2rem] p-10 backdrop-blur-2xl flex flex-col justify-between transition-all duration-1000 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${
            criticalCount > 0 
              ? 'bg-rose-500/10 border-rose-500/30' 
              : 'bg-white/[0.02] border-white/10'
          }`}>
            <div className={`flex items-center gap-4 mb-8 ${criticalCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              <AlertTriangle className={`w-8 h-8 ${criticalCount > 0 ? 'animate-pulse' : ''}`} />
              <span className="text-xl font-bold uppercase tracking-widest">SLAs Críticos</span>
            </div>
            <div>
              <div className={`text-7xl md:text-8xl lg:text-9xl font-black leading-none tracking-tighter ${criticalCount > 0 ? 'text-rose-500 drop-shadow-[0_0_40px_rgba(244,63,94,0.4)]' : 'text-emerald-500'}`}>
                {criticalCount}
              </div>
              <p className={`text-xl md:text-2xl font-medium mt-4 ${criticalCount > 0 ? 'text-rose-400/80' : 'text-emerald-400/80'}`}>
                {criticalCount > 0 ? 'Atenção Imediata Necessária' : 'Operação Saudável'}
              </p>
            </div>
          </div>
          
        </div>

        {/* Right Column: Live Feed */}
        <div className="lg:col-span-7 bg-white/[0.02] border border-white/10 rounded-[2rem] p-10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4 text-white/80">
              <Zap className="w-8 h-8 text-amber-400" />
              <span className="text-xl font-bold uppercase tracking-widest">Atendimentos Ativos ({activeLeads.length})</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
            
            <div className="flex flex-col gap-4 overflow-y-auto h-full pr-4 pb-12 custom-scrollbar">
              <AnimatePresence>
                {activeLeads.slice(0, 10).map((lead, idx) => {
                  const manager = managers.find(m => m.id === lead.manager_id);
                  const isCritical = dangerLeads.some(d => d.id === lead.id);

                  return (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`p-6 rounded-2xl flex items-center justify-between border ${
                        isCritical 
                          ? 'bg-rose-500/10 border-rose-500/20' 
                          : 'bg-white/5 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl ${
                          isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-white/70'
                        }`}>
                          {manager ? manager.name.substring(0, 2).toUpperCase() : '??'}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-1">{lead.name}</h3>
                          <p className="text-sm font-medium text-white/60 uppercase tracking-widest">
                            {lead.funnel_stage === 'lead_new' ? 'Novo Lead' : lead.funnel_stage === 'quote' ? 'Orçamento' : 'Em Negociação'}
                          </p>
                        </div>
                      </div>
                      
                      {isCritical && (
                        <div className="px-4 py-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold animate-pulse">
                          Atrasado
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                {activeLeads.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-white/30">
                    <Target className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-xl font-medium">Nenhum atendimento ativo no momento</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TvOperacional;
