import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, Zap } from 'lucide-react';
import { Lead } from '@/context/AppDataContext';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export const AIXrayModal: React.FC<Props> = ({ lead, isOpen, onClose }) => {
  const { isDark } = useTheme();

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const rawInsight = lead.ai_insight || 'Nenhum log de raciocínio profundo encontrado para este lead.';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-[#0a0a0a] border border-[#333] font-mono text-sm"
        >
          {/* Header - Terminal Style */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#333] bg-[#111]">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-gray-200 uppercase tracking-widest text-xs">Raio-X da IA (Laudo Bruto)</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Chain-of-Thought Reasoning Dump</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body - Code Editor Style */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a] text-emerald-400/90 leading-relaxed custom-scrollbar selection:bg-emerald-500/30">
            <div className="flex items-center gap-2 mb-4 text-emerald-500/50 text-xs uppercase tracking-widest border-b border-emerald-900/30 pb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Step-by-Step Execution Log</span>
            </div>
            <pre className="whitespace-pre-wrap break-words font-mono text-sm">
              {rawInsight}
            </pre>
          </div>
          
          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#333] bg-[#111] flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest">
            <span>Model: gemini-3.1-flash-lite (ou fallback)</span>
            <span>Status: Executado</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
