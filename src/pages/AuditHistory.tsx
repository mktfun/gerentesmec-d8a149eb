import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppData } from '@/context/AppDataContext';
import { AuditPayload } from '@/hooks/useAuditStorage';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Search, ChevronRight, CheckCircle2, Slash, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StoreInspection {
  id: string;
  store_id: string;
  started_at: string;
  completed_at: string;
  status: string;
  raw_payload: AuditPayload;
}

export default function AuditHistory() {
  const { user } = useAuth();
  const { managers, units } = useAppData();
  const [inspections, setInspections] = useState<StoreInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState<StoreInspection | null>(null);

  // Filters
  const [filterStore, setFilterStore] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const isUnitManager = user?.user_metadata?.role === 'unit_manager' || managers.some(m => m.auth_user_id === user?.id);
  const managerUnitId = managers.find(m => m.auth_user_id === user?.id)?.unit_id;

  useEffect(() => {
    fetchInspections();
  }, [user, filterStore, filterDate]);

  const fetchInspections = async () => {
    try {
      let query = supabase
        .from('store_inspections')
        .select('*')
        .eq('status', 'synced')
        .order('completed_at', { ascending: false });

      if (isUnitManager && managerUnitId) {
        query = query.eq('store_id', managerUnitId);
      } else if (filterStore) {
        query = query.eq('store_id', filterStore);
      }

      if (filterDate) {
        // simple date filtering
        const startOfDay = new Date(filterDate);
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(filterDate);
        endOfDay.setHours(23,59,59,999);
        query = query.gte('completed_at', startOfDay.toISOString()).lte('completed_at', endOfDay.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setInspections(data || []);
    } catch (err) {
      console.error('Error fetching audits', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header & Filters */}
      <div className="bg-card border-b border-border p-6 sticky top-0 z-10">
        <h1 className="text-2xl font-black text-foreground mb-4">Histórico de Auditorias</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          {!isUnitManager && (
            <select 
              value={filterStore}
              onChange={e => setFilterStore(e.target.value)}
              className="bg-background border border-input text-foreground px-4 py-2 rounded-xl text-sm"
            >
              <option value="">Todas as Lojas</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
          <input 
            type="date" 
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="bg-background border border-input text-foreground px-4 py-2 rounded-xl text-sm [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-4 pb-20">
          {loading ? (
            <div className="text-muted-foreground animate-pulse text-sm">Carregando...</div>
          ) : inspections.length === 0 ? (
            <div className="text-muted-foreground text-sm">Nenhuma auditoria encontrada.</div>
          ) : (
            inspections.map(audit => {
              const storeName = units.find(u => u.id === audit.store_id)?.name || 'Unidade Desconhecida';
              const auditorName = (audit.raw_payload as any)?.device_info ? JSON.parse((audit.raw_payload as any).device_info || '{}')?.auditorName : 'Auditor';
              const dateObj = new Date(audit.completed_at);
              
              // Cálculo de score dinâmico
              let totalItems = 0;
              let conformItems = 0;
              audit.raw_payload?.categories?.forEach(cat => {
                cat.items.forEach(item => {
                  if (item.status === 'ok' || item.status === 'conforme') conformItems++;
                  if (item.status !== 'na') totalItems++;
                });
              });
              
              const score = totalItems > 0 ? Math.round((conformItems / totalItems) * 100) : 0;
              const scoreColor = score >= 75 ? 'text-emerald-700 dark:text-emerald-400' : score >= 50 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400';
              const bgScore = score >= 75 ? 'bg-emerald-500/20 dark:bg-emerald-400/10' : score >= 50 ? 'bg-amber-500/20 dark:bg-amber-400/10' : 'bg-rose-500/20 dark:bg-rose-400/10';

              return (
                <div 
                  key={audit.id}
                  onClick={() => setSelectedAudit(audit)}
                  className="w-full bg-card hover:bg-card/80 border border-border rounded-2xl p-4 text-left transition-all group flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer active:scale-[0.98] shadow-sm hover:shadow-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      <h3 className="font-bold text-foreground text-lg">{storeName}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(dateObj, "dd 'de' MMM, yyyy", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Fim: {format(dateObj, "HH:mm")}
                      </div>
                      <span className="opacity-70">Auditor: {auditorName}</span>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <div className={`px-4 py-2 rounded-xl font-black ${scoreColor} ${bgScore}`}>
                      {score}%
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <Drawer open={!!selectedAudit} onOpenChange={(open) => !open && setSelectedAudit(null)}>
        <DrawerContent className="bg-card border-border h-[90vh]">
          <DrawerHeader className="border-b border-border pb-4">
            <DrawerTitle className="text-foreground">Detalhes da Auditoria</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-2xl mx-auto space-y-8 pb-10">
              {selectedAudit?.raw_payload?.categories.map(cat => (
                <div key={cat.category_name} className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">{cat.category_name}</h3>
                  <div className="space-y-3">
                    {cat.items.map(item => {
                      const isNok = item.status === 'nao_conforme' || item.status === 'nok';
                      return (
                      <div key={item.item_name} className={`bg-card rounded-xl p-4 border shadow-sm ${item.status === 'na' ? 'border-border opacity-60' : 'border-border'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-sm font-bold text-foreground flex items-center gap-2">
                              {item.status === 'na' ? <Slash className="w-4 h-4 text-muted-foreground" /> : isNok ? <XCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                              {item.item_name}
                            </p>
                            {item.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{item.notes}"</p>}
                          </div>
                        </div>
                        
                        {item.photos && item.photos.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                            {item.photos.map(p => (
                              <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-zinc-100 dark:bg-black/50">
                                <Zoom>
                                  <img src={p.previewUrl} alt="Foto" className="w-full h-full object-cover" />
                                </Zoom>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 text-[10px] text-white flex justify-between pointer-events-none">
                                  <span>{format(new Date(p.timestamp), 'HH:mm:ss')}</span>
                                  {p.lat && <span>GPS Ok</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>

    </div>
  );
}
