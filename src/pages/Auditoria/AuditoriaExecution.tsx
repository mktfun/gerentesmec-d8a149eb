import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuditStorage, AuditPayload, AuditItemData } from '@/hooks/useAuditStorage';
import { SCHEMA_VERSION } from './constants';
import AuditoriaItemCard from '@/components/Auditoria/AuditoriaItemCard';
import { Loader2, UploadCloud, ChevronRight, ChevronLeft, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to flatten the categories
function getFlattenedItems(draft: AuditPayload) {
  const flat: { categoryIdx: number; itemIdx: number; data: AuditItemData; catName: string }[] = [];
  draft.categories.forEach((cat, cIdx) => {
    cat.items.forEach((item, iIdx) => {
      flat.push({ categoryIdx: cIdx, itemIdx: iIdx, data: item, catName: cat.category_name });
    });
  });
  return flat;
}

export default function AuditoriaExecution() {
  const navigate = useNavigate();
  const { draft, loading, saveDraft, clearDraft } = useAuditStorage();
  
  const [currentGlobalIndex, setCurrentGlobalIndex] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState('');

  // Se não houver rascunho em andamento, volta para o dashboard da auditoria
  useEffect(() => {
    if (!loading && !draft) {
      navigate('/auditoria');
    }
  }, [loading, draft, navigate]);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate('/historico-auditorias');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  const handleAbort = async () => {
    if (confirm('Tem certeza que deseja abortar a auditoria? Os dados locais serão apagados.')) {
      await clearDraft();
      navigate('/auditoria');
    }
  };

  if (loading || !draft) {
    return <div className="flex h-screen items-center justify-center bg-background dark:bg-[#0a0a0f]"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  // --- MODO EXECUÇÃO (STEPPER IMERSIVO) ---
  const flatItems = getFlattenedItems(draft);
  const currentItem = flatItems[currentGlobalIndex];
  const progress = Math.round(((currentGlobalIndex) / flatItems.length) * 100);

  const handleNext = () => {
    if (currentGlobalIndex < flatItems.length - 1) {
      setCurrentGlobalIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentGlobalIndex > 0) {
      setCurrentGlobalIndex(prev => prev - 1);
    }
  };

  const syncAudit = async () => {
    // A lógica de sincronização já está implementada dentro do AuditoriaItemCard.
    // Isso é só caso queiramos um botão manual final (Opcional).
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col h-screen bg-background dark:bg-[#0a0a0f] items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-full mb-6">
          <UploadCloud className="w-16 h-16 text-emerald-500" />
        </motion.div>
        <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">Inspeção Concluída</h2>
        <p className="text-muted-foreground">Todos os dados e evidências foram sincronizados com sucesso.</p>
        <p className="text-muted-foreground text-sm mt-8">Redirecionando para o histórico...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background dark:bg-[#0a0a0f] overflow-hidden fixed inset-0 z-[100]">
      {/* HEADER SUPERIOR (Progresso e Categoria Atual) */}
      <div className="shrink-0 bg-card/80 dark:bg-[#121214]/80 backdrop-blur-xl border-b border-border dark:border-zinc-800/50 p-4 pt-safe z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5 block">
              Categoria {currentItem.categoryIdx + 1} de {draft.categories.length}
            </span>
            <h2 className="text-sm font-semibold text-foreground line-clamp-1">
              {currentItem.catName}
            </h2>
          </div>
          
          <button 
            onClick={handleAbort}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Progresso Fina */}
        <div className="h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ÁREA CENTRAL (O Card Principal) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 snap-y snap-mandatory scroll-smooth">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentGlobalIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full flex items-center justify-center"
          >
            <AuditoriaItemCard 
              data={currentItem.data}
              minPhotos={1}
              categoryName={currentItem.catName}
              onChange={(newData) => {
                if (!draft) return;
                const newDraft = { ...draft };
                newDraft.categories[currentItem.categoryIdx].items[currentItem.itemIdx] = newData;
                saveDraft(newDraft);
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FOOTER INFERIOR (Navegação Rápida) */}
      <div className="shrink-0 bg-card/90 dark:bg-[#121214]/90 backdrop-blur-xl border-t border-border dark:border-zinc-800/50 p-4 pb-safe absolute bottom-0 w-full z-10">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <button 
            onClick={handlePrev}
            disabled={currentGlobalIndex === 0}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <span className="text-xs font-medium text-muted-foreground">
            {currentGlobalIndex + 1} de {flatItems.length}
          </span>

          {currentGlobalIndex === flatItems.length - 1 ? (
            <button 
              onClick={() => setIsSuccess(true)}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20 text-white active:scale-95 transition-all"
            >
              <Check className="w-6 h-6" />
            </button>
          ) : (
            <button 
              onClick={handleNext}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 active:scale-95 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
