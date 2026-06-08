import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppData } from '@/context/AppDataContext';
import { CHECKLIST_TEMPLATE, ChecklistItem } from '@/data/checklist_template';
import ChecklistOnboarding from '@/components/Checklist/ChecklistOnboarding';
import ChecklistItemCard from '@/components/Checklist/ChecklistItemCard';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface AuditSession {
  unitId: string;
  auditorName: string;
  answers: Record<string, { isConform: boolean; photoFile: File | Blob; photoUrl?: string; observation?: string }>;
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

  const handleAnswer = (itemId: string, data: { isConform: boolean; photoFile: File | Blob; observation?: string }) => {
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
        if (!answer) return null;

        const fileExt = answer.photoFile.type.split('/')[1] || 'jpeg';
        const fileName = `${auditId}/${item.id}_${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audit_evidences')
          .upload(fileName, answer.photoFile, { contentType: answer.photoFile.type });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('audit_evidences').getPublicUrl(fileName);

        return {
          audit_id: auditId,
          category: item.category,
          item_name: item.name,
          is_conform: answer.isConform,
          photo_url: publicUrl,
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
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Top Header - Dynamic Island Style */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{currentItem.category}</span>
          <div className="w-px h-4 bg-white/20"></div>
          <span className="text-sm font-black">{currentIndex + 1} / {CHECKLIST_TEMPLATE.length}</span>
        </div>
      </div>

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
