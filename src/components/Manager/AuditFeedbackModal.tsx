import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mechanicId: string;
  leadId: string | null;
  auditReasons: string;
}

export const AuditFeedbackModal: React.FC<Props> = ({ isOpen, onClose, mechanicId, leadId, auditReasons }) => {
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!feedback.trim()) {
      toast.error('Descreva o que o IA avaliou errado ou certo.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-feedback-embedder', {
        body: {
          unit_id: mechanicId,
          lead_id: leadId,
          context: `Feedback sobre a vistoria: ${feedback}. Contexto original: ${auditReasons}`
        }
      });

      if (error) throw error;
      toast.success('Feedback salvo! O IA aprenderá com esta correção na próxima vez.');
      onClose();
      setFeedback('');
    } catch (err: any) {
      toast.error('Erro ao salvar feedback: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-background/80 backdrop-blur-xl border border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Corrigir Auditoria
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Descreva o que o IA errou nesta avaliação. Suas instruções guiarão o IA no futuro com este mecânico.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Ex: O IA deduziu que a peça estava suja, mas era apenas a sombra do elevador..."
            className="min-h-[120px] bg-black/20 border-white/10 focus-visible:ring-emerald-500 text-sm"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !feedback.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
          >
            {isLoading ? 'Salvando...' : 'Salvar Correção'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
