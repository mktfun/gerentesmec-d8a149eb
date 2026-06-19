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
    <div className="w-full max-w-lg mx-auto bg-[#111116] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative flex flex-col mt-4">
      
      {/* Category Header Muted */}
      <div className="absolute top-4 left-4 z-20">
        <span className="bg-black/60 backdrop-blur text-white/70 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
          {categoryName}
        </span>
      </div>

      {/* Hero Image Section (Blur or Photos) */}
      <div className="h-[40vh] min-h-[300px] w-full bg-black/50 relative overflow-hidden flex items-center justify-center">
        
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
                <div className="absolute bottom-4 left-4 z-20 bg-black/70 backdrop-blur p-2 rounded-lg text-[10px] text-white/80 flex items-center gap-2 pointer-events-none border border-white/10">
                  <span>{format(new Date(photo.timestamp), 'HH:mm:ss')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
        )}
        
        {/* Central Camera Button (Se não estiver N/A) */}
        {data.status !== 'na' && (
          <div className={`absolute inset-0 pointer-events-none flex items-center justify-center ${data.photos.length > 0 ? 'bg-black/40' : ''}`}>
             <button 
                onClick={() => fileInputRef.current?.click()}
                className={`pointer-events-auto relative z-10 w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center gap-2 hover:bg-white/20 transition-all shadow-2xl ${data.photos.length > 0 ? 'scale-75 opacity-80 hover:opacity-100' : 'animate-pulse-slow'}`}
              >
                <Camera className="w-8 h-8 text-white" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/90 shadow-black">
                  {data.photos.length > 0 ? 'Mais' : 'Tirar Foto'}
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

      {/* Info & Actions Section */}
      <div className="p-6 bg-[#111116] z-20 relative">
        <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
          {data.status === 'na' ? <span className="line-through text-white/40">{data.item_name}</span> : data.item_name}
          {isComplete && <Check className="w-5 h-5 text-emerald-500" />}
        </h2>
        
        <p className="text-sm text-white/50 mb-4">
          {data.status === 'na' 
            ? 'Item desabilitado (N/A).' 
            : `Evidências: ${data.photos.length} de ${requiredPhotos} min.`}
        </p>

        {instruction && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-6">
            <p className="text-zinc-400 text-sm font-medium leading-relaxed italic">
              "{instruction}"
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => handleStatusChange('ok')}
            className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all ${
              data.status === 'ok' 
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Check className="w-6 h-6 mb-2" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Conforme</span>
          </button>
          
          <button
            onClick={() => handleStatusChange('nok')}
            className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all ${
              data.status === 'nok' 
                ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
            }`}
          >
            <X className="w-6 h-6 mb-2" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Inconforme</span>
          </button>
          
          <button
            onClick={() => handleStatusChange('na')}
            className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all ${
              data.status === 'na' 
                ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Slash className="w-6 h-6 mb-2" />
            <span className="text-[10px] font-bold tracking-wider uppercase">N/A</span>
          </button>
        </div>

        {/* Observation Input (Obrigatório se N/A) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
            Observação {data.status === 'na' && <span className="text-rose-500">* (Obrigatória)</span>}
          </label>
          <textarea
            value={data.notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Adicione um comentário..."
            className={`w-full bg-black/50 border rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:ring-1 transition-colors ${
              data.status === 'na' && data.notes.trim().length === 0 
                ? 'border-rose-500/50 focus:ring-rose-500 focus:border-rose-500' 
                : 'border-white/10 focus:ring-indigo-500 focus:border-indigo-500'
            }`}
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
