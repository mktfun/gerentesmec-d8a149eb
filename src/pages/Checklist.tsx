import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppData } from '@/context/AppDataContext';
import { CHECKLIST_TEMPLATE, ChecklistItem } from '@/data/checklist_template';
import ChecklistOnboarding from '@/components/Checklist/ChecklistOnboarding';
import ChecklistItemCard from '@/components/Checklist/ChecklistItemCard';
import { CheckCircle2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface AuditSession {
  unitId: string;
  auditorName: string;
  answers: Record<string, { isConform: boolean; photoFiles: File[]; observation?: string }>;
}

export default function Checklist() {
  const { units } = useAppData();
  const [session, setSession] = useState<AuditSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleStart = (unitId: string, auditorName: string) => {
    setSession({ unitId, auditorName, answers: {} });
    setCurrentIndex(0);
    setFinished(false);
  };

  const handleAnswer = (itemId: string, data: { isConform: boolean; photoFiles: File[]; observation?: string }) => {
    if (!session) return;
    setSession(prev => ({
      ...prev!,
      answers: {
        ...prev!.answers,
        [itemId]: data
      }
    }));
    
    if (currentIndex < CHECKLIST_TEMPLATE.length - 1) {
      setCurrentIndex(curr => curr + 1);
    } else {
      setFinished(true);
    }
  };

  const submitAudit = async () => {
    if (!session) return;
    setIsSubmitting(true);
    
    try {
      // 1. Criar o cabeçalho
      const score = Math.round((Object.values(session.answers).filter(a => a.isConform).length / CHECKLIST_TEMPLATE.length) * 100);
      
      const { data: auditData, error: auditError } = await supabase.from('audits').insert({
        unit_id: session.unitId,
        auditor_name: session.auditorName,
        score_percentage: score,
        status: 'completed',
        completed_at: new Date().toISOString()
      }).select().single();

      if (auditError) throw auditError;
      const auditId = auditData.id;

      // 2. Upload fotos em background e preparar answers
      const answerPromises = CHECKLIST_TEMPLATE.map(async (item) => {
        const answer = session.answers[item.id];
        if (!answer || !answer.photoFiles || answer.photoFiles.length === 0) return null;

        const uploadPromises = answer.photoFiles.map(async (file, idx) => {
          const fileExt = file.type.split('/')[1] || 'jpeg';
          const fileName = `${auditId}/${item.id}_${Date.now()}_${idx}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('audit_evidences')
            .upload(fileName, file, { contentType: file.type });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from('audit_evidences').getPublicUrl(fileName);
          return publicUrl;
        });

        const urls = await Promise.all(uploadPromises);

        return {
          audit_id: auditId,
          category: item.category,
          item_name: item.name,
          is_conform: answer.isConform,
          photo_url: urls.join(','),
          observation: answer.observation || null
        };
      });

      const answersToInsert = (await Promise.all(answerPromises)).filter(Boolean);
      
      const { error: answersError } = await supabase.from('audit_answers').insert(answersToInsert as any[]);
      if (answersError) throw answersError;

      alert('Auditoria finalizada com sucesso!');
      setSession(null);
      setFinished(false);

    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar auditoria: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return <ChecklistOnboarding units={units} onStart={handleStart} />;
  }

  if (finished) {
    const totalConform = Object.values(session.answers).filter(a => a.isConform).length;
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black">Auditoria Concluída!</h2>
          <p className="text-muted-foreground text-lg">
            Você verificou {CHECKLIST_TEMPLATE.length} itens.<br/>
            Sendo <strong className="text-emerald-500">{totalConform} Conformes</strong> e <strong className="text-rose-500">{CHECKLIST_TEMPLATE.length - totalConform} Não Conformes</strong>.
          </p>
          <button 
            onClick={submitAudit}
            disabled={isSubmitting}
            className="w-full max-w-sm mt-8 px-6 py-4 bg-primary text-white text-lg font-bold rounded-2xl disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Enviar Relatório'}
          </button>
        </motion.div>
      </div>
    );
  }

  const currentItem = CHECKLIST_TEMPLATE[currentIndex];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background glow global */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      {/* Top Header - Dynamic Island Style */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{currentItem.category}</span>
          <div className="w-px h-4 bg-white/20"></div>
          <span className="text-sm font-black">{currentIndex + 1} / {CHECKLIST_TEMPLATE.length}</span>
        </div>
      </div>

      <button 
        onClick={() => window.location.href = '/historico-auditorias'}
        className="fixed top-6 right-6 z-50 w-10 h-10 bg-black/20 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-black/40 transition-all shadow-lg"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center p-6 pt-24 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-md"
          >
            <ChecklistItemCard 
              item={currentItem} 
              onAnswer={(data) => handleAnswer(currentItem.id, data)}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
