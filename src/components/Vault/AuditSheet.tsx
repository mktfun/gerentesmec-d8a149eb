import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Circle, MessageSquare, Video, CheckSquare, Star, Link as LinkIcon } from 'lucide-react';
import { CycleMock } from '@/pages/Vault';

interface AuditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cycle: CycleMock | null;
}

const stepsConfig = [
  { id: 1, title: 'Cordialidade & Registro', desc: 'Atendimento educado e registro do que foi falado no balcão/telefone.', icon: MessageSquare },
  { id: 2, title: 'Orçamento + Vídeo + Efeitos', desc: 'Enviou link do orçamento acompanhado de vídeo do defeito e explicação das consequências.', icon: Video },
  { id: 3, title: 'Checklist Mecânico (Complementar)', desc: 'Enviou checklist do que mais precisa fazer no veículo para aumentar ticket.', icon: CheckSquare },
  { id: 4, title: 'Encerramento & Pedido de Review', desc: 'Mensagem de agradecimento padrão com solicitação para avaliar no Google.', icon: Star },
];

const AuditSheet: React.FC<AuditSheetProps> = ({ isOpen, onClose, cycle }) => {
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [proofLink, setProofLink] = useState('');

  // Reset or initialize state when cycle changes
  useEffect(() => {
    if (cycle) {
      const initialSteps = Array.from({ length: cycle.steps_completed }, (_, i) => i + 1);
      setCheckedSteps(initialSteps);
    }
  }, [cycle]);

  const toggleStep = (id: number) => {
    setCheckedSteps(prev => 
      prev.includes(id) ? prev.filter(step => step !== id) : [...prev, id]
    );
  };

  const score = checkedSteps.length * 25;

  return (
    <AnimatePresence>
      {isOpen && cycle && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
          />

          {/* Sheet */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full max-w-md h-full bg-slate-900/90 backdrop-blur-2xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Auditoria de Ciclo</h2>
                <p className="text-sm text-slate-400">{cycle.customer_phone}</p>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Score Visualization */}
            <div className="p-6 border-b border-white/5 flex flex-col items-center justify-center bg-white/[0.02]">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* SVG Radial Progress */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-800" />
                  <motion.circle 
                    cx="50" cy="50" r="40" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="none" 
                    strokeLinecap="round"
                    className={`${score === 100 ? 'text-emerald-500' : score >= 50 ? 'text-blue-500' : 'text-rose-500'}`}
                    initial={{ strokeDasharray: '0 251' }}
                    animate={{ strokeDasharray: `${(score / 100) * 251} 251` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">
                    <Counter value={score} />%
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Score</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  {cycle.manager_name[0]}
                </div>
                <span>{cycle.manager_name} • {cycle.unit_name}</span>
              </div>
            </div>

            {/* Content (Steps Checklist) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Etapas do Processo</h3>
              
              {stepsConfig.map((step) => {
                const isChecked = checkedSteps.includes(step.id);
                const Icon = step.icon;

                return (
                  <motion.div 
                    key={step.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => toggleStep(step.id)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all duration-300 flex gap-4 ${
                      isChecked 
                        ? 'bg-blue-500/10 border-blue-500/30' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <h4 className={`font-medium text-sm ${isChecked ? 'text-blue-400' : 'text-slate-200'}`}>
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}

              <div className="mt-8">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Evidências (Links)</h3>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      value={proofLink}
                      onChange={(e) => setProofLink(e.target.value)}
                      placeholder="Colar link do vídeo / imagem..."
                      className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <button className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-white/5 bg-slate-900/90">
              <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                Salvar Auditoria
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Animated Number Counter Component
const Counter = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;
    
    const duration = 1000;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutExpo)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setDisplayValue(Math.round(start + (end - start) * easeProgress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  return <>{displayValue}</>;
};

export default AuditSheet;
