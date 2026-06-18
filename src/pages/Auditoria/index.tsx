import React, { useState, useEffect } from 'react';
import { useAuditStorage, AuditPayload, AuditItemData } from '@/hooks/useAuditStorage';
import { AUDIT_CATEGORIES, SCHEMA_VERSION } from './constants';
import AuditItem from '@/components/Auditoria/AuditItem';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loader2, UploadCloud, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function AuditoriaApp() {
  const { user } = useAuth();
  const { draft, loading, saveDraft, clearDraft } = useAuditStorage();
  
  const [storeId, setStoreId] = useState('');
  const [units, setUnits] = useState<{id: string, name: string}[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    supabase.from('units').select('id, name').then(({ data }) => {
      if (data) setUnits(data);
    });
  }, []);

  const handleStart = async () => {
    if (!storeId) return toast.error('Selecione uma loja');
    
    // Create skeleton based on constants
    const initialPayload: AuditPayload = {
      inspection_id: crypto.randomUUID(),
      store_id: storeId,
      schema_version: SCHEMA_VERSION,
      auditor_user_id: user?.id || null,
      started_at: new Date().toISOString(),
      completed_at: null,
      device_info: navigator.userAgent,
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
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  if (!draft) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border p-8 rounded-3xl shadow-xl">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6">
            <MapPin className="w-6 h-6 text-indigo-500" />
          </div>
          <h1 className="text-2xl font-black mb-2 text-foreground">Nova Auditoria</h1>
          <p className="text-muted-foreground text-sm mb-8">Tolerância Zero. Selecione a unidade para iniciar a inspeção rigorosa.</p>
          
          <select 
            value={storeId} 
            onChange={e => setStoreId(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-indigo-500 transition-colors mb-6"
          >
            <option value="">Selecione a Unidade...</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          
          <button 
            onClick={handleStart}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/25"
          >
            Iniciar Inspeção
          </button>
        </div>
      </div>
    );
  }

  const category = draft.categories[currentStep];
  const templateCategory = AUDIT_CATEGORIES.find(c => c.category_name === category.category_name);

  // Validation Check: all items in the ENTIRE payload must be complete
  const isAuditComplete = draft.categories.every(cat => 
    cat.items.every((item) => {
      const templateItem = AUDIT_CATEGORIES.find(c => c.category_name === cat.category_name)?.items.find(i => i.name === item.item_name);
      const reqPhotos = item.status === 'na' ? 0 : (templateItem?.min_photos || 1);
      return item.status !== null && 
        (item.status === 'na' ? item.notes.trim().length > 0 : item.photos.length >= reqPhotos);
    })
  );

  const handleItemChange = (itemIdx: number, newData: AuditItemData) => {
    const newDraft = { ...draft };
    newDraft.categories[currentStep].items[itemIdx] = newData;
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
      
      // 1. Upload photos to Storage sequentially or batch
      for (const cat of payloadToSync.categories) {
        for (const item of cat.items) {
          for (let i = 0; i < item.photos.length; i++) {
            const photo = item.photos[i];
            const fileExt = 'jpg'; // browser-image-compression outputs jpeg
            const filePath = `${draft.store_id}/${draft.inspection_id}/${item.category_name.replace(/[^a-z0-9]/gi, '')}/${photo.id}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('audits')
              .upload(filePath, photo.blob, { contentType: 'image/jpeg', upsert: true });
              
            if (uploadError) throw uploadError;
            
            // Generate public URL
            const { data: publicUrl } = supabase.storage.from('audits').getPublicUrl(filePath);
            
            // Replace local blob preview URL with remote URL
            item.photos[i].previewUrl = publicUrl.publicUrl;
            // Remove blob so it can be JSON serialized without issues
            // @ts-ignore
            delete item.photos[i].blob; 
          }
        }
      }

      // 2. Save JSON Payload to DB
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
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="font-black text-foreground">Auditoria em Andamento</h1>
          <p className="text-xs text-muted-foreground">{draft.store_id} • Offline-First Mode</p>
        </div>
        
        <button 
          onClick={handleSync}
          disabled={!isAuditComplete || isSyncing}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            isAuditComplete && !isSyncing 
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'
              : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
          }`}
        >
          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          <span className="hidden sm:inline">Sincronizar (All-or-Nothing)</span>
        </button>
      </div>

      {/* Stepper Tabs */}
      <div className="overflow-x-auto border-b border-border bg-card/50 px-2 py-3 flex gap-2 no-scrollbar">
        {draft.categories.map((cat, idx) => {
          // Check if category is 100% complete
          const isCatComplete = cat.items.every(item => {
             const tItem = AUDIT_CATEGORIES.find(c => c.category_name === cat.category_name)?.items.find(i => i.name === item.item_name);
             const reqPhotos = item.status === 'na' ? 0 : (tItem?.min_photos || 1);
             return item.status !== null && 
               (item.status === 'na' ? item.notes.trim().length > 0 : item.photos.length >= reqPhotos);
          });

          return (
            <button 
              key={cat.category_name}
              onClick={() => setCurrentStep(idx)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
                currentStep === idx 
                  ? 'bg-indigo-500 text-white shadow-md' 
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {isCatComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {idx + 1}. {cat.category_name}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-xl font-black text-foreground mb-6">{category.category_name}</h2>
          
          {category.items.map((item, idx) => {
            const templateItem = templateCategory?.items.find(i => i.name === item.item_name);
            return (
              <AuditItem 
                key={item.item_name}
                data={item}
                minPhotos={templateItem?.min_photos || 1}
                onChange={(newData) => handleItemChange(idx, newData)}
              />
            );
          })}
        </div>
      </div>

      {/* Footer Nav */}
      <div className="bg-card border-t border-border p-4 fixed bottom-0 left-0 right-0 z-10 flex justify-between items-center md:pl-[280px]">
        <button 
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-muted-foreground disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" /> Anterior
        </button>
        <span className="text-xs text-muted-foreground/50 font-medium">Etapa {currentStep + 1} de {draft.categories.length}</span>
        <button 
          onClick={() => setCurrentStep(prev => Math.min(draft.categories.length - 1, prev + 1))}
          disabled={currentStep === draft.categories.length - 1}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-500 disabled:opacity-30"
        >
          Próximo <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
