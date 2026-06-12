import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Filter } from 'lucide-react';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filters: { funnel: string; checklistScore: number }) => void;
}

export const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({ isOpen, onClose, onExport }) => {
  const [funnelFilter, setFunnelFilter] = useState('all');
  const [checklistScore, setChecklistScore] = useState(0);

  if (!isOpen) return null;

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

            {/* Checklist Filter */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                Score Mínimo do Checklist
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={checklistScore}
                onChange={(e) => setChecklistScore(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>0%</span>
                <span className="text-indigo-400 font-bold">{checklistScore}%</span>
                <span>100%</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onExport({ funnel: funnelFilter, checklistScore });
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
