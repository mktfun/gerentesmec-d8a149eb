import React from 'react';
import { AuditItemData, AuditPhoto } from '@/hooks/useAuditStorage';
import CameraCapture from './CameraCapture';
import { CheckCircle2, XCircle, Slash, X, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  data: AuditItemData;
  minPhotos: number;
  onChange: (data: AuditItemData) => void;
}

export default function AuditItem({ data, minPhotos, onChange }: Props) {
  // If user marks N/A, they still need 1 photo to prove it's empty
  const requiredPhotos = data.status === 'na' ? 1 : minPhotos;
  const isComplete = data.status !== null && data.photos.length >= requiredPhotos;

  const handleStatusChange = (status: AuditItemData['status']) => {
    onChange({ ...data, status });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...data, notes: e.target.value });
  };

  const handlePhotoCaptured = (photo: AuditPhoto) => {
    onChange({ ...data, photos: [...data.photos, photo] });
  };

  const removePhoto = (id: string) => {
    onChange({ ...data, photos: data.photos.filter(p => p.id !== id) });
  };

  return (
    <div className={`p-4 rounded-2xl border transition-colors ${isComplete ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-card'}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-bold text-foreground flex items-center gap-2">
            {data.item_name}
            {isComplete && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {requiredPhotos > 1 ? `Min. ${requiredPhotos} fotos` : '1 foto obrigatória'}
          </p>
        </div>
      </div>

      {/* Status Selector */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={() => handleStatusChange('conforme')}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
            data.status === 'conforme' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-background border-border text-muted-foreground hover:border-emerald-500/50'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Conforme</span>
        </button>
        <button
          onClick={() => handleStatusChange('não_conforme')}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
            data.status === 'não_conforme' ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' : 'bg-background border-border text-muted-foreground hover:border-rose-500/50'
          }`}
        >
          <XCircle className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Inconforme</span>
        </button>
        <button
          onClick={() => handleStatusChange('na')}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
            data.status === 'na' ? 'bg-zinc-500 text-white border-zinc-500 shadow-lg shadow-zinc-500/20' : 'bg-background border-border text-muted-foreground hover:border-zinc-500/50'
          }`}
        >
          <Slash className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">N/A</span>
        </button>
      </div>

      {/* Notes */}
      {(data.status === 'não_conforme' || data.status === 'na') && (
        <textarea
          value={data.notes}
          onChange={handleNotesChange}
          placeholder={data.status === 'na' ? "Justifique por que não se aplica..." : "Descreva o problema encontrado..."}
          className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground mb-4 focus:outline-none focus:border-indigo-500 transition-colors resize-none h-20"
        />
      )}

      {/* Photos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Evidências ({data.photos.length}/{requiredPhotos})</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {data.photos.map(photo => (
            <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-black/5 group border border-border">
              <img src={photo.previewUrl} alt="Evidência" className="w-full h-full object-cover" />
              <button 
                onClick={() => removePhoto(photo.id)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                <div className="flex items-center gap-1 text-[9px] text-white/90">
                  <MapPin className="w-3 h-3" />
                  {photo.lat ? `${photo.lat.toFixed(4)}, ${photo.long?.toFixed(4)}` : 'S/ GPS'}
                </div>
                <div className="text-[9px] text-white/70 mt-0.5">
                  {format(new Date(photo.timestamp), 'HH:mm:ss')}
                </div>
              </div>
            </div>
          ))}
          <CameraCapture onPhotoCaptured={handlePhotoCaptured} />
        </div>
      </div>
      
    </div>
  );
}
