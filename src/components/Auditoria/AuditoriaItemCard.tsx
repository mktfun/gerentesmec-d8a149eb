import React, { useRef } from 'react';
import { Camera, Check, X, Slash, MapPin, XCircle } from 'lucide-react';
import { AuditItemData } from '@/hooks/useAuditStorage';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { format } from 'date-fns';

interface Props {
  data: AuditItemData;
  minPhotos: number;
  categoryName: string;
  instruction?: string;
  onChange: (newData: AuditItemData) => void;
}

export default function AuditoriaItemCard({ data, minPhotos, categoryName, instruction, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredPhotos = data.status === 'na' ? 0 : minPhotos;
  const isComplete = data.status !== null && 
    (data.status === 'na' ? data.notes.trim().length > 0 : data.photos.length >= requiredPhotos);

  const handleStatusChange = (status: AuditItemData['status']) => {
    onChange({ ...data, status });
  };

  const handleNotesChange = (notes: string) => {
    onChange({ ...data, notes });
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Simulação rápida de GPS e metadados, na prática pegaria do navigator.geolocation
      // Como estamos num browser/pwa, podemos tentar pegar, mas por enquanto vamos manter simples.
      const timestamp = new Date().toISOString();
      const previewUrl = URL.createObjectURL(file);
      
      onChange({
        ...data,
        photos: [
          ...data.photos,
          {
            id: crypto.randomUUID(),
            blob: file,
            previewUrl,
            timestamp,
            lat: null, // Pode ser adicionado navigator.geolocation depois
            long: null
          }
        ]
      });
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (id: string) => {
    onChange({
      ...data,
      photos: data.photos.filter(p => p.id !== id)
    });
  };

  return (
    <div className="w-full h-full max-w-lg mx-auto bg-card dark:bg-[#111116] relative flex flex-col">
      
      {/* Category Header Muted */}
      <div className="absolute top-4 left-4 z-20">
        <span className="bg-black/80 backdrop-blur text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/20 shadow-2xl flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
          {categoryName}
        </span>
      </div>

      {/* Hero Image Section (Blur or Photos) */}
      <div className="h-[40vh] min-h-[300px] w-full bg-zinc-100 dark:bg-black/50 relative overflow-hidden flex items-center justify-center">
        
        {/* Render Background Photos */}
        {data.photos.length > 0 ? (
          <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar relative">
            {data.photos.map((photo, idx) => (
              <div key={photo.id} className="min-w-full h-full relative snap-center">
                <Zoom>
                  <img src={photo.previewUrl} alt="Evidência" className="w-full h-full object-cover opacity-90" />
                </Zoom>
                <button 
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-4 right-4 z-30 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-rose-500 transition-colors border border-white/20"
                >
                  <XCircle className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 z-20 bg-black/70 backdrop-blur p-2 rounded-lg text-[10px] text-white flex items-center gap-2 pointer-events-none border border-white/10">
                  <span>{format(new Date(photo.timestamp), 'HH:mm:ss')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
        )}
        
        {data.photos.length < requiredPhotos && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="pointer-events-auto relative z-10 w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center gap-2 hover:bg-white/20 transition-all shadow-2xl animate-pulse-slow"
            >
              <Camera className="w-8 h-8 text-zinc-600 dark:text-white" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-white">
                Tirar Foto
              </span>
            </button>
          </div>
        )}
        
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          className="hidden" 
          ref={fileInputRef}
          onChange={handlePhotoCapture}
        />
      </div>

      <div className="px-6 py-8 pb-12 flex-1 flex flex-col z-20 bg-card dark:bg-[#111116]">
        <h2 className="text-2xl font-black text-foreground mb-4 flex items-center gap-2">
          {data.status === 'na' ? <span className="line-through opacity-40">{data.item_name}</span> : data.item_name}
          {isComplete && <Check className="w-5 h-5 text-emerald-500" />}
        </h2>
        
        {instruction && (
          <div className="bg-muted border border-border rounded-lg p-3 mb-6">
            <p className="text-muted-foreground text-sm font-medium leading-relaxed italic">
              "{instruction}"
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mt-auto">
          <button 
            onClick={() => handleStatusChange('ok')}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95
              ${data.status === 'ok' 
                ? 'bg-emerald-600 dark:bg-emerald-500/20 border-emerald-500 text-white dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-zinc-100 dark:bg-black/30 border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-white/40 hover:bg-zinc-200 dark:hover:bg-white/5'}`}
          >
            <Check className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Conforme</span>
          </button>
          
          <button 
            onClick={() => handleStatusChange('nok')}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95
              ${data.status === 'nok' 
                ? 'bg-rose-600 dark:bg-rose-500/20 border-rose-500 text-white dark:text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
                : 'bg-zinc-100 dark:bg-black/30 border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-white/40 hover:bg-zinc-200 dark:hover:bg-white/5'}`}
          >
            <X className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Não Conf</span>
          </button>
          
          <button 
            onClick={() => handleStatusChange('na')}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95
              ${data.status === 'na' 
                ? 'bg-zinc-600 dark:bg-zinc-500/20 border-zinc-500 text-white dark:text-zinc-400 shadow-[0_0_15px_rgba(161,161,170,0.3)]' 
                : 'bg-zinc-100 dark:bg-black/30 border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-white/40 hover:bg-zinc-200 dark:hover:bg-white/5'}`}
          >
            <Slash className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">N/A</span>
          </button>
        </div>

        <div className="space-y-2 mt-6">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Observação {(data.status === 'na' || data.status === 'nok') && <span className="text-rose-500">* (Obrigatória)</span>}
          </label>
          <textarea
            value={data.notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Adicione um comentário..."
            className={`w-full bg-background dark:bg-black/30 border border-input dark:border-white/10 rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 outline-none resize-none h-24 transition-all ${
              ((data.status === 'na' || data.status === 'nok') && data.notes.trim().length === 0)
                ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                : ''
            } ${
              data.status === 'nok' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-200 border-rose-500' : ''
            }`}
          />
        </div>
      </div>
    </div>
  );
}
