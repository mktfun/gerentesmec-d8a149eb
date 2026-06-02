import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, AlertTriangle, Globe } from 'lucide-react';
import { Unit, Lead } from '@/context/AppDataContext';
import { isLeadDanger } from '@/utils/metrics';
import { avgScore } from '@/utils/scoreUtils';

interface Props {
  units: Unit[];
  leads: Lead[];
  selectedUnitId: string | 'all';
  onSelect: (id: string | 'all') => void;
  disabled?: boolean;
}

const UnitSwitcher: React.FC<Props> = ({ units, leads, selectedUnitId, onSelect, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUnitMetrics = (unitId: string | 'all') => {
    const unitLeads = unitId === 'all' ? leads : leads.filter(l => l.unit_id === unitId);
    
    // Danger leads
    const today0 = new Date();
    today0.setHours(0,0,0,0);
    const todayLeads = unitLeads.filter(l => new Date(l.last_message_at).getTime() >= today0.getTime());
    const dangerCount = todayLeads.filter(l => isLeadDanger(l, undefined, 20)).length;

    // Score
    const score = avgScore(unitLeads);
    
    const lastActiveAt = unitLeads.reduce((max, l) => {
      const time = new Date(l.last_message_at || l.created_at).getTime();
      return time > max ? time : max;
    }, 0);
    const isInactive = lastActiveAt === 0 || (Date.now() - lastActiveAt) > 24 * 60 * 60 * 1000;

    return { dangerCount, score, isInactive };
  };

  const selectedUnit = selectedUnitId === 'all' 
    ? { id: 'all', name: 'Visão Global' } 
    : units.find(u => u.id === selectedUnitId) || { id: 'all', name: 'Visão Global' };

  const { dangerCount: selectedDanger, score: selectedScore, isInactive: selectedIsInactive } = getUnitMetrics(selectedUnit.id);

  const options = [{ id: 'all', name: 'Visão Global' }, ...units];

  return (
    <div className="relative z-50" ref={containerRef}>
      
      {/* Trigger Button */}
      <button 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`group relative flex items-center gap-3 px-5 py-3 bg-card border border-border backdrop-blur-xl rounded-2xl transition-all outline-none shadow-[0_4px_20px_rgba(0,0,0,0.2)] ${disabled ? 'opacity-80 cursor-default' : 'hover:bg-accent focus-visible:ring-2 focus-visible:ring-indigo-500'}`}
      >
        <div className="flex items-center gap-2">
          {selectedUnit.id === 'all' ? (
            <Globe className="w-5 h-5 text-indigo-400" />
          ) : (
            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${selectedDanger > 0 ? 'bg-rose-500 text-rose-500 animate-pulse' : 'bg-emerald-500 text-emerald-500'}`} />
          )}
          <span className="font-bold text-foreground tracking-wide flex items-center gap-2">
            {selectedUnit.name}
            {selectedIsInactive && selectedUnit.id !== 'all' && (
               <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-sm">
                 <AlertTriangle className="w-3 h-3" /> Off?
               </span>
            )}
          </span>
        </div>

        {/* Score Pill in Trigger */}
        <div className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black border ${selectedScore === null ? 'bg-muted border-border text-muted-foreground/40' : selectedScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400' : selectedScore >= 60 ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 dark:text-indigo-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500 dark:text-rose-400'}`}>
          {selectedScore !== null ? `${selectedScore}%` : '—'}
        </div>

        {!disabled && <ChevronDown className={`w-4 h-4 text-muted-foreground/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute top-full left-0 mt-3 w-80 bg-card/90 backdrop-blur-3xl border border-border rounded-3xl p-2 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {options.map((opt, i) => {
                const { dangerCount, score, isInactive } = getUnitMetrics(opt.id);
                const isSelected = selectedUnitId === opt.id;
                
                return (
                  <motion.button
                    key={opt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => {
                      onSelect(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl mb-1 transition-all text-left outline-none
                      ${isSelected ? 'bg-indigo-500/10' : 'hover:bg-black/5 dark:hover:bg-white/[0.04] focus-visible:bg-black/5 dark:focus-visible:bg-white/[0.04]'}`}
                  >
                    <div className="flex items-center gap-3">
                      {opt.id === 'all' ? (
                        <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 border border-border">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${dangerCount > 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                          {dangerCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </div>
                      )}
                      <div>
                        <h4 className={`text-sm font-bold ${isSelected ? 'text-indigo-400' : 'text-foreground/90'}`}>{opt.name}</h4>
                        {dangerCount > 0 && <p className="text-[10px] font-bold text-rose-500 mt-0.5">{dangerCount} LEAD{dangerCount > 1 && 'S'} EM RISCO</p>}
                        {isInactive && opt.id !== 'all' && <p className="text-[10px] font-black text-rose-500 mt-0.5 flex items-center gap-1 bg-rose-500/10 px-1.5 py-0.5 rounded-sm w-fit uppercase" title="Mais de 24h sem mensagens. O WhatsApp caiu?"><AlertTriangle className="w-3 h-3"/> Sem Conexão?</p>}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-sm font-black ${score === null ? 'text-muted-foreground/30' : score >= 80 ? 'text-emerald-500 dark:text-emerald-400' : score >= 60 ? 'text-indigo-500 dark:text-indigo-400' : 'text-rose-500 dark:text-rose-400'}`}>
                        {score !== null ? `${score}%` : '—'}
                      </div>
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/30 mt-0.5 font-bold">Score</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default UnitSwitcher;
