import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Calendar, Clock, Check, X, User } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export type CreatedPeriod = '7d' | '30d' | '90d' | 'all' | 'custom';
export interface CustomDateRange { start: string; end: string; }

interface Props {
  createdPeriod: CreatedPeriod;
  setCreatedPeriod: (p: CreatedPeriod) => void;
  customDateRange: CustomDateRange;
  setCustomDateRange: (r: CustomDateRange) => void;
  unansweredOnly: boolean;
  setUnansweredOnly: (v: boolean) => void;
  inactiveOnly: boolean;
  setInactiveOnly: (v: boolean) => void;
}

const AdvancedFilters: React.FC<Props> = ({
  createdPeriod, setCreatedPeriod,
  customDateRange, setCustomDateRange,
  unansweredOnly, setUnansweredOnly,
  inactiveOnly, setInactiveOnly
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isDark } = useTheme();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const hasActiveFilters = createdPeriod !== 'all' || unansweredOnly || inactiveOnly;

  return (
    <div className="relative font-instrument" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
          hasActiveFilters || isOpen
            ? 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
            : 'bg-black/5 dark:bg-white/5 text-muted-foreground border-border hover:border-muted-foreground/30 hover:text-foreground'
        }`}
      >
        <Filter className={`w-3.5 h-3.5 ${hasActiveFilters ? 'text-indigo-500' : 'text-muted-foreground/50'}`} />
        Filtros
        {hasActiveFilters && (
          <span className={`w-1.5 h-1.5 rounded-full bg-indigo-500 absolute top-1.5 right-1.5`} />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute top-full right-0 mt-2 w-80 z-50 rounded-[1.5rem] border shadow-2xl p-5 flex flex-col gap-5
              backdrop-blur-xl ${isDark ? 'bg-[#212529]/95 border-white/10 shadow-black/50' : 'bg-white/95 border-black/10 shadow-black/10'}
            `}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-widest opacity-80 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filtros Avançados
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors opacity-50 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Criação do Lead */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Data de Criação
              </label>
              <div className="flex flex-wrap gap-2">
                {(['30d', '7d', '90d', 'all', 'custom'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setCreatedPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      createdPeriod === p 
                        ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' 
                        : 'bg-transparent border-border opacity-70 hover:opacity-100 hover:border-muted-foreground/30'
                    }`}
                  >
                    {p === '7d' ? '7 Dias' : p === '30d' ? '30 Dias' : p === '90d' ? '3 Meses' : p === 'all' ? 'Tudo' : 'Personalizado'}
                  </button>
                ))}
              </div>

              {createdPeriod === 'custom' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-center gap-2 mt-1">
                  <input 
                    type="date" 
                    value={customDateRange.start} 
                    onChange={e => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                    className={`flex-1 px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-indigo-500 ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-black/10'}`} 
                  />
                  <span className="opacity-40">-</span>
                  <input 
                    type="date" 
                    value={customDateRange.end} 
                    onChange={e => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                    className={`flex-1 px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-indigo-500 ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-black/10'}`} 
                  />
                </motion.div>
              )}
            </div>

            <div className="w-full h-px bg-border my-1" />

            {/* Interações */}
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Interação & Tempo
              </label>

              <button 
                onClick={() => setUnansweredOnly(!unansweredOnly)}
                className="flex items-center gap-3 text-left group"
              >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${unansweredOnly ? 'bg-indigo-500 border-indigo-500' : 'border-border group-hover:border-indigo-500/50'}`}>
                  {unansweredOnly && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div>
                  <p className="text-xs font-bold leading-none mb-0.5">Sem Resposta do Agente</p>
                  <p className="text-[10px] font-semibold opacity-50 leading-tight">Cliente foi o último a falar.</p>
                </div>
              </button>

              <button 
                onClick={() => setInactiveOnly(!inactiveOnly)}
                className="flex items-center gap-3 text-left group"
              >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${inactiveOnly ? 'bg-indigo-500 border-indigo-500' : 'border-border group-hover:border-indigo-500/50'}`}>
                  {inactiveOnly && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div>
                  <p className="text-xs font-bold leading-none mb-0.5">Inativo há mais de 24h</p>
                  <p className="text-[10px] font-semibold opacity-50 leading-tight">Nenhuma mensagem trocada ontem/hoje.</p>
                </div>
              </button>
            </div>

            <button 
              onClick={() => {
                setCreatedPeriod('all');
                setUnansweredOnly(false);
                setInactiveOnly(false);
              }}
              className="mt-2 text-[10px] font-bold uppercase tracking-widest text-indigo-500 opacity-60 hover:opacity-100 text-center py-2 transition-opacity"
            >
              Limpar Filtros
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedFilters;
