import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Trophy, Award, Crown } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { avgScore } from '@/utils/scoreUtils';

const TvExecutivo = () => {
  const { leads, managers } = useAppData();
  
  // Real-time tick to force re-render if necessary
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(i);
  }, []);

  const globalScore = avgScore(leads);
  const roundedGlobal = globalScore !== null ? Math.round(globalScore) : 0;
  const scoreColor = roundedGlobal >= 75 ? '#34d399' : roundedGlobal >= 50 ? '#818cf8' : '#f87171';

  // Calculate manager scores
  const managerScores: { id: string; name: string; score: number; count: number }[] = managers.map(m => {
    const managerLeads = leads.filter(l => l.manager_id === m.id);
    const mScore = avgScore(managerLeads);
    return {
      id: m.id,
      name: m.name,
      score: mScore !== null ? Math.round(mScore) : 0,
      count: managerLeads.filter(l => l.score !== null).length
    };
  }).filter(m => m.count > 0).sort((a, b) => b.score - a.score);

  const top3 = managerScores.slice(0, 3);

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white flex flex-col p-8 md:p-12 font-sans overflow-hidden relative">
      
      {/* Background Liquid Glass Effects */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between z-10 mb-16">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white/90">Qualidade & Performance</h1>
            <p className="text-lg text-white/40 font-medium uppercase tracking-widest">Painel Executivo</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-bold uppercase tracking-widest text-white/60">Live Sync</span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 z-10 flex-1">
        
        {/* Left Column: Global Score */}
        <div className="flex flex-col items-center justify-center bg-white/[0.02] border border-white/10 rounded-[2rem] p-10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute top-10 left-10 text-white/50 flex items-center gap-3">
            <Target className="w-6 h-6" />
            <span className="text-xl font-bold uppercase tracking-widest">Score Global</span>
          </div>

          <div className="relative flex items-center justify-center mt-8 w-64 h-64 md:w-80 md:h-80 lg:w-[360px] lg:h-[360px]">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 256 256">
              <circle cx="128" cy="128" r="116" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
              <motion.circle
                cx="128" cy="128" r="116" stroke={scoreColor} strokeWidth="12" fill="transparent"
                strokeDasharray={2 * Math.PI * 116}
                initial={{ strokeDashoffset: 2 * Math.PI * 116 }}
                animate={{ strokeDashoffset: (2 * Math.PI * 116) * (1 - roundedGlobal / 100) }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[4rem] md:text-[5rem] lg:text-[6rem] font-black tracking-tighter" style={{ color: scoreColor }}>{roundedGlobal}</span>
              <span className="text-sm md:text-lg uppercase font-bold text-white/40 mt-1">Pontos</span>
            </div>
          </div>
          
          <p className="mt-20 text-2xl text-white/60 font-medium text-center">
            Média de todas as unidades
          </p>
        </div>

        {/* Right Column: Top Managers */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 text-white/80 mb-4 pl-4">
            <Award className="w-8 h-8 text-amber-400" />
            <span className="text-2xl font-bold uppercase tracking-widest">Top Performance</span>
          </div>

          {top3.map((manager, index) => (
            <motion.div 
              key={manager.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`p-6 lg:p-8 rounded-[2rem] flex items-center justify-between border backdrop-blur-xl ${
                index === 0 
                  ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)]' 
                  : index === 1
                    ? 'bg-slate-300/10 border-slate-300/20'
                    : 'bg-amber-700/10 border-amber-700/20'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl ${
                  index === 0 ? 'bg-amber-500/20 text-amber-400' : 
                  index === 1 ? 'bg-slate-300/20 text-slate-300' : 
                  'bg-amber-700/20 text-amber-600'
                }`}>
                  {index === 0 ? <Crown className="w-8 h-8" /> : `#${index + 1}`}
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-1">{manager.name}</h3>
                  <p className="text-lg font-medium text-white/50 uppercase tracking-widest">
                    {manager.count} Auditorias
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-[3.5rem] font-black leading-none ${
                  index === 0 ? 'text-amber-400' : 'text-white'
                }`}>
                  {manager.score}
                </div>
                <div className="text-sm uppercase font-bold text-white/40 tracking-widest mt-2">Score</div>
              </div>
            </motion.div>
          ))}

          {top3.length === 0 && (
            <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[2rem] flex items-center justify-center text-white/30">
              <p className="text-2xl font-medium">Sem dados suficientes de auditoria</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TvExecutivo;
