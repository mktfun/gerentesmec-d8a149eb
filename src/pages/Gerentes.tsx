import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { useAppData, Manager, Unit } from '@/context/AppDataContext';
import ManagerModal from '@/components/Gerentes/ManagerModal';
import ManagerModalForm from '@/components/Gerentes/ManagerModalForm';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 300, damping: 28, delay },
});

const Gerentes = () => {
  const { managers, deleteManager, units, leads } = useAppData();
  
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [formManager, setFormManager] = useState<Manager | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (m: Manager, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormManager(m);
    setIsFormOpen(true);
  };

  const handleDelete = (m: Manager, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Excluir o gerente ${m.name}?`)) {
      deleteManager(m.id);
    }
  };

  const handleNew = () => {
    setFormManager(null);
    setIsFormOpen(true);
  };

  return (
    <div className="p-8">
      {/* Page header */}
      <motion.div {...fadeUp(0)} className="mb-8 flex items-end justify-between">
        <div>
          <p className="label-caps text-indigo-400/70 mb-1">Gestão</p>
          <h1 className="text-2xl font-black text-foreground">Gerentes & Unidades</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {units.length} unidades · {managers.length} gerentes ativos
          </p>
        </div>
        <button onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-500 text-white
            hover:bg-indigo-600 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.25)]">
          <Plus className="w-4 h-4" />
          Novo Funcionário
        </button>
      </motion.div>

      {/* Units grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {units.map((unit, idx) => {
          const unitManagers = managers.filter(m => m.unit_id === unit.id);
          
          // Calculate average score for the unit
          const unitLeads = leads.filter(l => l.unit_id === unit.id && l.score !== null);
          const unitScore = unitLeads.length > 0
            ? Math.round(unitLeads.reduce((acc, l) => acc + (l.score || 0), 0) / unitLeads.length)
            : null;
            
          const scoreColor = unitScore === null ? 'text-white/30' : unitScore >= 80 ? 'text-emerald-400' : unitScore >= 65 ? 'text-indigo-300' : 'text-rose-400';
          const barColor   = unitScore === null ? 'bg-white/10' : unitScore >= 80 ? 'bg-emerald-400' : unitScore >= 65 ? 'bg-indigo-400' : 'bg-rose-400';
          const glowColor  = unitScore !== null && unitScore >= 80
            ? 'shadow-[0_0_30px_rgba(52,211,153,0.08)]'
            : unitScore !== null && unitScore >= 65
            ? 'shadow-[0_0_30px_rgba(99,102,241,0.08)]'
            : unitScore !== null
            ? 'shadow-[0_0_30px_rgba(251,113,133,0.08)]'
            : '';

          return (
            <motion.div
              key={unit.id}
              {...fadeUp(0.08 * idx)}
              className={`rounded-2xl p-6 bg-[#111118] border border-white/[0.08] ${glowColor} cursor-default`}
            >
              {/* Unit header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-black text-base text-foreground">{unit.name}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground font-medium">
                    <Users className="w-3 h-3" />
                    {unitManagers.length} gerente{unitManagers.length > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-black ${scoreColor}`}>{unitScore !== null ? `${unitScore}%` : '—'}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{unitScore !== null ? 'Score médio' : 'Sem auditorias'}</p>
                </div>
              </div>

              {/* Unit progress bar */}
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${unitScore ?? 0}%` }}
                  transition={{ delay: 0.1 + idx * 0.08, duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${barColor}`}
                />
              </div>

              {/* Manager list */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Gerentes ({unitManagers.length})
                </p>
                {unitManagers.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-white/10 text-center">
                    <span className="text-xs text-muted-foreground">Sem gerentes</span>
                  </div>
                ) : unitManagers.map((manager, mIdx) => {
                  const managerLeads = leads.filter(l => l.manager_id === manager.id && l.score !== null);
                  const mScore = managerLeads.length > 0 
                    ? Math.round(managerLeads.reduce((acc, l) => acc + (l.score || 0), 0) / managerLeads.length)
                    : null;
                  const trend = mScore !== null && mScore >= 70;
                  return (
                    <motion.div
                      key={manager.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.08 + mIdx * 0.06, type: 'spring' }}
                      onClick={() => setSelectedManager(manager)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                        bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05]
                        hover:border-indigo-500/30 transition-all text-left group cursor-pointer"
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

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => handleEdit(manager, e)} className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => handleDelete(manager, e)} className="p-1.5 rounded-md hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Score + Trend */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {mScore !== null && (trend
                          ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                          : <TrendingDown className="w-3 h-3 text-rose-400" />
                        )}
                        <span className={`text-xs font-black ${
                          mScore === null ? 'text-white/30' : mScore >= 80 ? 'text-emerald-400' : mScore >= 60 ? 'text-indigo-300' : 'text-rose-400'
                        }`}>{mScore !== null ? `${mScore}%` : '—'}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* View Modal */}
      <ManagerModal manager={selectedManager} onClose={() => setSelectedManager(null)} />
      
      {/* Form Modal */}
      <ManagerModalForm manager={formManager} isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};

export default Gerentes;
