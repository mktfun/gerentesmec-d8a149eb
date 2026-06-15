import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Filter, Check } from 'lucide-react';
import { auditStepsConfig } from '@/utils/scoreUtils';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filters: { funnel: string; unmarkedChecks: string[] }) => void;
}

export const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({ isOpen, onClose, onExport }) => {
  const [funnelFilter, setFunnelFilter] = useState('all');
  const [unmarkedChecks, setUnmarkedChecks] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleCheck = (id: string) => {
    setUnmarkedChecks(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const allChecks = auditStepsConfig.flatMap(step => step.items);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-background/80 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] p-6"
        >
          {/* Liquid Glass Effect Elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Filter className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-black text-foreground tracking-tight">Opções de Exportação</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors" aria-label="Fechar modal">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative z-10 space-y-6">
            {/* Funnel Filter */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                Filtro de Funil
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['all', 'closed_won', 'closed_lost'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setFunnelFilter(val)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                      funnelFilter === val
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                        : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                    }`}
                  >
                    {val === 'all' ? 'Todos' : val === 'closed_won' ? 'Ganhos' : 'Perdidos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Unmarked Checks Filter */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-foreground/80 flex items-center justify-between gap-2">
                <span>Checks não marcados (Filtro OR)</span>
                {unmarkedChecks.length > 0 && (
                  <button onClick={() => setUnmarkedChecks([])} className="text-xs text-indigo-400 hover:text-indigo-300">
                    Limpar
                  </button>
                )}
              </label>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {allChecks.map((item) => {
                  const isSelected = unmarkedChecks.includes(item.id);
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                        isSelected 
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-50' 
                          : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                      }`}
                    >
                      <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-rose-500 border-rose-500' : 'border-muted-foreground/50'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-xs font-medium leading-tight">
                        {item.text}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onExport({ funnel: funnelFilter, unmarkedChecks });
                onClose();
              }}
              className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 bg-foreground text-background rounded-2xl text-sm font-black hover:bg-foreground/90 transition-colors shadow-xl"
            >
              <Download className="w-5 h-5" />
              Gerar Relatórios em Lote
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
