import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppData } from '@/context/AppDataContext';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Search, ChevronRight, CheckCircle2, XCircle, ImageIcon, ClipboardCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Audit {
  id: string;
  unit_id: string;
  auditor_id: string;
  total_score: number;
  status: string;
  created_at: string;
}

interface AuditAnswer {
  id: string;
  item_id: string;
  is_compliant: boolean;
  photo_path: string | null;
  comment: string | null;
}

const AuditHistory = () => {
  const { user } = useAuth();
  const { managers, units } = useAppData();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [answers, setAnswers] = useState<AuditAnswer[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  const isUnitManager = user?.user_metadata?.role === 'unit_manager' || managers.some(m => m.auth_user_id === user?.id);
  const managerUnitId = managers.find(m => m.auth_user_id === user?.id)?.unit_id;

  useEffect(() => {
    fetchAudits();
  }, [user]);

  const fetchAudits = async () => {
    try {
      let query = supabase
        .from('audits')
        .select('*')
        .order('created_at', { ascending: false });

      if (isUnitManager && managerUnitId) {
        query = query.eq('unit_id', managerUnitId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAudits(data || []);
    } catch (err) {
      console.error('Error fetching audits', err);
    } finally {
      setLoading(false);
    }
  };

  const openAuditDetails = async (audit: Audit) => {
    setSelectedAudit(audit);
    setLoadingAnswers(true);
    try {
      const { data, error } = await supabase
        .from('audit_answers')
        .select('*')
        .eq('audit_id', audit.id);
      
      if (error) throw error;
      setAnswers(data || []);
    } catch (err) {
      console.error('Error fetching answers', err);
    } finally {
      setLoadingAnswers(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  const getPublicPhotoUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('audit_evidences').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Histórico de Vistorias
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resultados das auditorias presenciais realizadas.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : audits.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-border bg-card/30">
          <ClipboardCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">Nenhuma vistoria encontrada</h3>
          <p className="text-sm text-muted-foreground">As vistorias realizadas aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {audits.map((audit) => {
            const unit = units.find(u => u.id === audit.unit_id);
            return (
              <motion.div
                key={audit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => openAuditDetails(audit)}
                className="group relative flex items-center justify-between p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-bold text-foreground">{unit?.name || 'Unidade Desconhecida'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(audit.created_at), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                  <div className={`px-3 py-1.5 rounded-xl border text-lg font-black ${getScoreColor(audit.total_score)}`}>
                    {Math.round(audit.total_score)}%
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detalhes da Auditoria */}
      <Drawer open={!!selectedAudit} onOpenChange={(open) => !open && setSelectedAudit(null)}>
        <DrawerContent className="h-[85vh] bg-background/80 backdrop-blur-3xl border-t border-white/20">
          <div className="max-w-2xl mx-auto w-full h-full flex flex-col">
            <DrawerHeader className="border-b border-border/50 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <DrawerTitle className="text-2xl font-black">
                    Detalhes da Vistoria
                  </DrawerTitle>
                  <DrawerDescription className="text-sm mt-1">
                    {selectedAudit && format(new Date(selectedAudit.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </DrawerDescription>
                </div>
                {selectedAudit && (
                  <div className={`px-4 py-2 rounded-2xl border text-2xl font-black ${getScoreColor(selectedAudit.total_score)}`}>
                    {Math.round(selectedAudit.total_score)}%
                  </div>
                )}
              </div>
            </DrawerHeader>

            <ScrollArea className="flex-1 p-6">
              {loadingAnswers ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
                </div>
              ) : (
                <div className="space-y-6">
                  {answers.map((answer) => (
                    <div key={answer.id} className="p-5 rounded-3xl bg-card/50 border border-border shadow-sm flex flex-col md:flex-row gap-5">
                      {/* Foto da Evidência */}
                      <div className="shrink-0">
                        {answer.photo_path ? (
                          <div className="w-24 h-24 rounded-2xl overflow-hidden border border-border bg-muted">
                            <img 
                              src={getPublicPhotoUrl(answer.photo_path) || ''} 
                              alt="Evidência" 
                              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500 cursor-pointer"
                              onClick={() => window.open(getPublicPhotoUrl(answer.photo_path) || '', '_blank')}
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-2xl border border-dashed border-border bg-muted/50 flex flex-col items-center justify-center text-muted-foreground">
                            <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                            <span className="text-[10px] font-bold uppercase">Sem Foto</span>
                          </div>
                        )}
                      </div>

                      {/* Informações */}
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                          {answer.is_compliant ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 flex items-center gap-1.5 px-2.5 py-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Conforme
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20 flex items-center gap-1.5 px-2.5 py-1">
                              <XCircle className="w-3.5 h-3.5" /> Não Conforme
                            </Badge>
                          )}
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            {answer.item_id.replace(/_/g, ' ')}
                          </span>
                        </div>
                        
                        {answer.comment && (
                          <div className="mt-2 p-3 rounded-xl bg-background border border-border text-sm text-foreground/80">
                            <span className="font-bold text-xs text-muted-foreground block mb-1 uppercase">Observação</span>
                            {answer.comment}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default AuditHistory;
