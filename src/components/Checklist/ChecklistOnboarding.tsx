import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck } from 'lucide-react';

interface Props {
  units: any[];
  onStart: (unitId: string, auditorName: string) => void;
}

export default function ChecklistOnboarding({ units, onStart }: Props) {
  const [selectedUnit, setSelectedUnit] = useState(units[0]?.id || '');
  const [auditorName, setAuditorName] = useState('');

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0a0a0f] border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden"
      >
        {/* Glow de fundo */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/30 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-violet-500/20 blur-[100px] rounded-full"></div>

        <div className="relative z-10 text-center mb-10">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-primary/30">
            <ClipboardCheck className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Vistoria Padrão Ouro</h1>
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
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm font-semibold focus:outline-none focus:border-primary focus:bg-primary/5 transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
              Unidade Inspecionada
            </label>
            <select 
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm font-semibold appearance-none focus:outline-none focus:border-primary focus:bg-primary/5 transition-all"
            >
              <option value="" disabled>Selecione a Unidade</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
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
