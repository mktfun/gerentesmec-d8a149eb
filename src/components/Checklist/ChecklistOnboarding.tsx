import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, X } from 'lucide-react';

interface Props {
  units: any[];
  onStart: (unitId: string, auditorName: string) => void;
}

export default function ChecklistOnboarding({ units, onStart }: Props) {
  const [selectedUnit, setSelectedUnit] = useState(units[0]?.id || '');
  const [auditorName, setAuditorName] = useState('');

  return (
    <div className="min-h-screen bg-background text-foreground p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow global */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <button 
        onClick={() => window.location.href = '/historico-auditorias'}
        className="fixed top-6 right-6 z-50 w-10 h-10 bg-black/20 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-black/40 transition-all shadow-lg"
      >
        <X className="w-5 h-5" />
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-border p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] relative overflow-hidden"
      >
        <div className="relative z-10 text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-primary/20 shadow-inner">
            <ClipboardCheck className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Vistoria Padrão Ouro</h1>
          <p className="text-muted-foreground mt-3 text-sm">Preencha as informações para iniciar uma nova auditoria presencial na unidade.</p>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
              Seu Nome (Auditor)
            </label>
            <input 
              type="text" 
              value={auditorName}
              onChange={(e) => setAuditorName(e.target.value)}
              placeholder="Ex: Carlos Silva"
              className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:bg-primary/5 transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
              Unidade Inspecionada
            </label>
            <select 
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-4 text-sm font-semibold text-foreground appearance-none focus:outline-none focus:border-primary focus:bg-primary/5 transition-all"
            >
              <option value="" disabled className="text-black dark:text-white">Selecione a Unidade</option>
              {units.map(u => (
                <option key={u.id} value={u.id} className="text-black dark:text-white">{u.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => onStart(selectedUnit, auditorName)}
            disabled={!selectedUnit || !auditorName}
            className="w-full py-5 rounded-xl bg-primary text-primary-foreground font-black tracking-wide uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all mt-4"
          >
            Iniciar Auditoria
          </button>
        </div>
      </motion.div>
    </div>
  );
}
