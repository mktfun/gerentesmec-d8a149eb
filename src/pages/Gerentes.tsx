import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';
import { mockUnits, mockManagers, Manager } from '@/data/mockData';
import ManagerModal from '@/components/Gerentes/ManagerModal';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 300, damping: 28, delay },
});

const Gerentes = () => {
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);

  return (
    <div className="p-8">
      {/* Page header */}
      <motion.div {...fadeUp(0)} className="mb-8">
        <p className="label-caps text-indigo-400/70 mb-1">Gestão</p>
        <h1 className="text-2xl font-black text-foreground">Gerentes & Unidades</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mockUnits.length} unidades · {mockManagers.length} gerentes ativos
        </p>
      </motion.div>

      {/* Units grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {mockUnits.map((unit, idx) => {
          const managers = mockManagers.filter(m => m.unit_id === unit.id);
          const unitScore = unit.score;
          const scoreColor = unitScore >= 80 ? 'text-emerald-400' : unitScore >= 65 ? 'text-indigo-300' : 'text-rose-400';
          const barColor   = unitScore >= 80 ? 'bg-emerald-400' : unitScore >= 65 ? 'bg-indigo-400' : 'bg-rose-400';
          const glowColor  = unitScore >= 80
            ? 'shadow-[0_0_30px_rgba(52,211,153,0.08)]'
            : unitScore >= 65
            ? 'shadow-[0_0_30px_rgba(99,102,241,0.08)]'
            : 'shadow-[0_0_30px_rgba(251,113,133,0.08)]';

          return (
            <motion.div
              key={unit.id}
              {...fadeUp(0.08 * idx)}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`rounded-2xl p-6 bg-[#111118] border border-white/[0.08] ${glowColor} cursor-default`}
            >
              {/* Unit header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-black text-base text-foreground">{unit.name}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground font-medium">
                    <Users className="w-3 h-3" />
                    {managers.length} gerente{managers.length > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-black ${scoreColor}`}>{unitScore}%</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Score médio</p>
                </div>
              </div>

              {/* Unit progress bar */}
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${unitScore}%` }}
                  transition={{ delay: 0.1 + idx * 0.08, duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${barColor}`}
                />
              </div>

              {/* Manager list */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Gerentes
                </p>
                {managers.map((manager, mIdx) => {
                  const trend = manager.score >= 70;
                  return (
                    <motion.button
                      key={manager.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.08 + mIdx * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
                      onClick={() => setSelectedManager(manager)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                        bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05]
                        hover:border-indigo-500/30 transition-all text-left group"
                    >
                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center
                        text-xs font-black text-indigo-300 shrink-0">
                        {manager.name[0]}
                      </div>

                      {/* Name */}
                      <span className="text-xs font-semibold text-foreground/80 flex-1 truncate
                        group-hover:text-foreground transition-colors">
                        {manager.name}
                      </span>

                      {/* Score + Trend */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {trend
                          ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                          : <TrendingDown className="w-3 h-3 text-rose-400" />
                        }
                        <span className={`text-xs font-black ${
                          manager.score >= 80 ? 'text-emerald-400' : manager.score >= 60 ? 'text-indigo-300' : 'text-rose-400'
                        }`}>{manager.score}%</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Manager drill-down modal */}
      <ManagerModal manager={selectedManager} onClose={() => setSelectedManager(null)} />
    </div>
  );
};

export default Gerentes;
