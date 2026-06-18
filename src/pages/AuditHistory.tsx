import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppData } from '@/context/AppDataContext';
import { AuditPayload } from '@/hooks/useAuditStorage';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Search, ChevronRight, CheckCircle2, Slash, Clock } from 'lucide-react';
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
    <div className="flex flex-col h-screen bg-[#0a0a0f]">
      {/* Header & Filters */}
      <div className="bg-card border-b border-border p-6 sticky top-0 z-10">
        <h1 className="text-2xl font-black text-white mb-4">Histórico de Auditorias</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          {!isUnitManager && (
            <select 
              value={filterStore}
              onChange={e => setFilterStore(e.target.value)}
              className="bg-background border border-border text-white px-4 py-2 rounded-xl text-sm"
            >
              <option value="">Todas as Lojas</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
          <input 
            type="date" 
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="bg-background border border-border text-white px-4 py-2 rounded-xl text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-4 pb-20">
          {loading ? (
            <div className="text-white/50 animate-pulse text-sm">Carregando...</div>
          ) : inspections.length === 0 ? (
            <div className="text-white/50 text-sm">Nenhuma auditoria encontrada.</div>
          ) : (
            inspections.map((audit) => {
              const unitName = units.find(u => u.id === audit.store_id)?.name || audit.store_id;
              const dateObj = new Date(audit.completed_at);
              const startDateObj = new Date(audit.started_at);
              
              return (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={audit.id}
                  onClick={() => setSelectedAudit(audit)}
                  className="w-full bg-card hover:bg-card/80 border border-border rounded-2xl p-4 text-left transition-all group flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      <h3 className="font-bold text-white text-lg">{unitName}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/50 font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(dateObj, "dd 'de' MMM, yyyy", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Início: {format(startDateObj, "HH:mm")}
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Fim: {format(dateObj, "HH:mm")}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/80 transition-colors" />
                </motion.button>
              );
            })
          )}
        </div>
      </ScrollArea>

      <Drawer open={!!selectedAudit} onOpenChange={(open) => !open && setSelectedAudit(null)}>
        <DrawerContent className="bg-card border-border h-[90vh]">
          <DrawerHeader className="border-b border-border pb-4">
            <DrawerTitle className="text-white">Detalhes da Auditoria</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-2xl mx-auto space-y-8 pb-10">
              {selectedAudit?.raw_payload?.categories.map(cat => (
                <div key={cat.category_name} className="space-y-4">
                  <h3 className="text-lg font-bold text-white border-b border-border pb-2">{cat.category_name}</h3>
                  <div className="space-y-3">
                    {cat.items.map(item => (
                      <div key={item.item_name} className={`bg-background rounded-xl p-4 border ${item.status === 'na' ? 'border-border opacity-60' : 'border-border'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-sm font-bold text-white flex items-center gap-2">
                              {item.status === 'na' ? <Slash className="w-4 h-4 text-white/50" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                              {item.item_name}
                            </p>
                            {item.notes && <p className="text-xs text-white/70 mt-1 italic">"{item.notes}"</p>}
                          </div>
                        </div>
                        
                        {item.photos && item.photos.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                            {item.photos.map(p => (
                              <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden border border-border">
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
                    ))}
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
