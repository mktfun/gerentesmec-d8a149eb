import React, { useState, useEffect, useMemo } from 'react';
import { useAuditStorage, AuditPayload, AuditItemData } from '@/hooks/useAuditStorage';
import { AUDIT_CATEGORIES, SCHEMA_VERSION } from './constants';
import AuditoriaItemCard from '@/components/Auditoria/AuditoriaItemCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loader2, UploadCloud, ChevronRight, ChevronLeft, MapPin, X } from 'lucide-react';
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

export default function AuditoriaApp() {
  const { user } = useAuth();
  const { draft, loading, saveDraft, clearDraft } = useAuditStorage();
  
  const [storeId, setStoreId] = useState('');
  const [auditorName, setAuditorName] = useState('');
  const [units, setUnits] = useState<{id: string, name: string}[]>([]);
  const [currentGlobalIndex, setCurrentGlobalIndex] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    supabase.from('units').select('id, name').then(({ data }) => {
      if (data) setUnits(data);
    });
  }, []);

  const handleStart = async () => {
    if (!auditorName.trim()) {
      return toast.error('Por favor, preencha o seu nome antes de iniciar.');
    }
    if (!storeId) return toast.error('Selecione uma loja');
    
    const initialPayload: AuditPayload = {
      inspection_id: crypto.randomUUID(),
      store_id: storeId,
      schema_version: SCHEMA_VERSION,
      auditor_user_id: user?.id || null,
      started_at: new Date().toISOString(),
      completed_at: null,
      device_info: JSON.stringify({ userAgent: navigator.userAgent, auditorName: auditorName.trim() }),
      categories: AUDIT_CATEGORIES.map(cat => ({
        category_name: cat.category_name,
        items: cat.items.map(i => ({
          item_name: i.name,
          category_name: cat.category_name,
          status: null,
          notes: '',
          photos: []
        }))
      }))
    };
    
    await saveDraft(initialPayload);
    setCurrentGlobalIndex(0);
  };

  const handleAbort = async () => {
    if (confirm('Tem certeza que deseja abortar a auditoria? Os dados locais serão apagados.')) {
      await clearDraft();
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#0a0a0f]"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  if (!draft) {
    return (
      <div className="flex flex-col h-screen bg-[#0a0a0f] items-center justify-center p-6">
        <div className="relative bg-[#121214] border border-zinc-800 rounded-2xl p-6 shadow-xl w-full max-w-sm overflow-hidden">
          
          {/* Barra Animada no Topo */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-[length:200%_200%] animate-gradient-shift"></div>

          {/* Ícone e Título */}
          <div className="mb-6 mt-2">
            <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-4">
              <MapPin className="text-indigo-400 w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Nova Auditoria</h2>
            <p className="text-zinc-400 text-sm">
              Selecione a unidade para iniciar a inspeção rigorosa. Imersão total ativada.
            </p>
          </div>

          <div className="space-y-4">
            {/* Input: Nome do Auditor */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Seu Nome (Auditor)
              </label>
              <input
                type="text"
                placeholder="Ex: Carlos Silva"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white placeholder-zinc-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
              />
            </div>

            {/* Select: Unidade */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Unidade Inspecionada
              </label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none appearance-none transition-all"
              >
                <option value="">Selecione a Unidade...</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            {/* Botão de Iniciar */}
            <button
              onClick={handleStart}
              className="w-full bg-white text-black font-semibold rounded-lg p-3 mt-4 hover:bg-zinc-200 transition-colors active:scale-95"
            >
              Iniciar Inspeção
            </button>
          </div>
        </div>
      </div>
    );
  }

  const flatItems = getFlattenedItems(draft);
  const totalItems = flatItems.length;
  const isCheckoutPhase = currentGlobalIndex >= totalItems;

  const handleNext = () => {
    if (currentGlobalIndex < totalItems) {
      setCurrentGlobalIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentGlobalIndex > 0) {
      setCurrentGlobalIndex(prev => prev - 1);
    }
  };

  // Validation Check: all items in the ENTIRE payload must be complete
  const isAuditComplete = draft.categories.every(cat => 
    cat.items.every((item) => {
      const templateItem = AUDIT_CATEGORIES.find(c => c.category_name === cat.category_name)?.items.find(i => i.name === item.item_name);
      const reqPhotos = item.status === 'na' ? 0 : (templateItem?.min_photos || 1);
      return item.status !== null && 
        (item.status === 'na' ? item.notes.trim().length > 0 : item.photos.length >= reqPhotos);
    })
  );

  const pendingCount = flatItems.filter(f => {
    const tItem = AUDIT_CATEGORIES.find(c => c.category_name === f.catName)?.items.find(i => i.name === f.data.item_name);
    const reqPhotos = f.data.status === 'na' ? 0 : (tItem?.min_photos || 1);
    return f.data.status === null || (f.data.status === 'na' ? f.data.notes.trim().length === 0 : f.data.photos.length < reqPhotos);
  }).length;

  const handleItemChange = (cIdx: number, iIdx: number, newData: AuditItemData) => {
    const newDraft = { ...draft };
    newDraft.categories[cIdx].items[iIdx] = newData;
    saveDraft(newDraft);
  };

  const handleSync = async () => {
    if (!isAuditComplete) {
      toast.error('Auditoria incompleta! Preencha 100% dos itens antes de sincronizar.');
      return;
    }
    
    setIsSyncing(true);
    toast.loading('Fazendo upload de evidências... Isso pode levar alguns minutos.', { id: 'sync' });
    
    try {
      const payloadToSync = { ...draft, completed_at: new Date().toISOString() };
      
      // Upload photos
      for (const cat of payloadToSync.categories) {
        for (const item of cat.items) {
          for (let i = 0; i < item.photos.length; i++) {
            const photo = item.photos[i];
            const fileExt = 'jpg';
            const filePath = `${draft.store_id}/${draft.inspection_id}/${item.category_name.replace(/[^a-z0-9]/gi, '')}/${photo.id}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('audits')
              .upload(filePath, photo.blob, { contentType: 'image/jpeg', upsert: true });
              
            if (uploadError) throw uploadError;
            
            const { data: publicUrl } = supabase.storage.from('audits').getPublicUrl(filePath);
            item.photos[i].previewUrl = publicUrl.publicUrl;
            // @ts-ignore
            delete item.photos[i].blob; 
          }
        }
      }

      const { error: dbError } = await supabase.from('store_inspections').insert({
        id: payloadToSync.inspection_id,
        store_id: payloadToSync.store_id,
        auditor_user_id: payloadToSync.auditor_user_id,
        started_at: payloadToSync.started_at,
        completed_at: payloadToSync.completed_at,
        device_info: payloadToSync.device_info,
        status: 'synced',
        raw_payload: payloadToSync
      });

      if (dbError) throw dbError;

      toast.success('Auditoria sincronizada com sucesso!', { id: 'sync' });
      await clearDraft();

    } catch (err) {
      console.error(err);
      toast.error('Erro na sincronização. Suas fotos continuam salvas no dispositivo.', { id: 'sync' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] overflow-hidden">
      
      {/* Top Navbar Minimalista */}
      <div className="flex items-center justify-between p-4 z-50 absolute top-0 w-full bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <button onClick={handleAbort} className="w-10 h-10 bg-black/50 backdrop-blur border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="text-white">
            <p className="text-xs font-bold opacity-50 uppercase tracking-widest">{units.find(u => u.id === draft.store_id)?.name || draft.store_id}</p>
          </div>
        </div>
        
        {/* Progress Dots */}
        {!isCheckoutPhase && (
          <div className="text-white/60 text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur">
            {currentGlobalIndex + 1} / {totalItems}
          </div>
        )}
      </div>

      {/* Main Viewport (Carousel or Checkout) */}
      <div className="flex-1 flex items-center justify-center px-4 relative pt-16 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!isCheckoutPhase ? (
            <motion.div
              key={currentGlobalIndex}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full max-w-lg"
            >
              {(() => {
                const flatItem = flatItems[currentGlobalIndex];
                const templateItem = AUDIT_CATEGORIES.find(c => c.category_name === flatItem.catName)?.items.find(i => i.name === flatItem.data.item_name);
                
                return (
                  <AuditoriaItemCard 
                    data={flatItem.data}
                    minPhotos={templateItem?.min_photos || 1}
                    categoryName={flatItem.catName}
                    onChange={(newData) => handleItemChange(flatItem.categoryIdx, flatItem.itemIdx, newData)}
                  />
                );
              })()}
            </motion.div>
          ) : (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-[#111116] border border-white/10 p-8 rounded-[2rem] text-center shadow-2xl relative overflow-hidden"
            >
              {pendingCount > 0 ? (
                <>
                  <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-10 h-10 text-rose-500" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">Auditoria Incompleta</h2>
                  <p className="text-white/50 text-sm mb-8">
                    Faltam <strong>{pendingCount}</strong> itens ou fotos obrigatórias. Volte e finalize tudo para liberar a sincronização.
                  </p>
                  <button 
                    onClick={() => setCurrentGlobalIndex(0)}
                    className="w-full py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-colors"
                  >
                    Revisar Itens
                  </button>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-emerald-500/5"></div>
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                    <UploadCloud className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2 relative z-10">Tudo Pronto!</h2>
                  <p className="text-emerald-400/80 text-sm mb-8 font-medium relative z-10">
                    100% dos itens verificados.
                  </p>
                  
                  <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full relative z-10 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSyncing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Sincronizar Oficialmente'}
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={currentGlobalIndex === 0 || isSyncing}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-bold transition-all disabled:opacity-20 flex items-center justify-center border border-white/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleNext}
            disabled={isCheckoutPhase || isSyncing}
            className="flex-[2] py-4 bg-white hover:bg-white/90 text-black rounded-2xl font-black transition-all disabled:opacity-20 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Próximo <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
