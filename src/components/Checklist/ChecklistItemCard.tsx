import React, { useState, useRef } from 'react';
import { Camera, Check, X, MessageSquarePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChecklistItem } from '@/data/checklist_template';

interface Props {
  item: ChecklistItem;
  onAnswer: (data: { isConform: boolean; photoFile: File; observation?: string }) => void;
}

export default function ChecklistItemCard({ item, onAnswer }: Props) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [showObservation, setShowObservation] = useState(false);
  const [observation, setObservation] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setPhotos(prev => [...prev, ...newFiles]);
      setPhotoUrls(prev => [...prev, ...newFiles.map(file => URL.createObjectURL(file))]);
    }
  };

  const submitAnswer = (isConform: boolean) => {
    if (photos.length === 0) return;
    onAnswer({ isConform, photoFiles: photos, observation });
  };

  return (
    <div className="w-full bg-[#111116] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative">
      {/* Imagem de Fundo (Blur) ou Placeholder */}
      <div className="h-64 w-full bg-black/50 relative overflow-hidden flex items-center justify-center">
        {photoUrls.length > 0 ? (
          <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory">
            {photoUrls.map((url, idx) => (
              <img key={idx} src={url} alt={`Evidência ${idx + 1}`} className="min-w-full h-full object-cover snap-center opacity-80" />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
        )}
        
        {/* Botão de Câmera Centralizado (se vazio) */}
        {photoUrls.length === 0 && (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="relative z-10 w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center gap-2 hover:bg-white/20 transition-all shadow-xl"
          >
            <Camera className="w-8 h-8 text-white" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Tirar Foto</span>
          </button>
        )}
        
        {/* Adicionar Mais Fotos (Canto superior) */}
        {photoUrls.length > 0 && (
          <div className="absolute top-4 right-4 flex gap-2">
            <div className="bg-black/50 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 flex items-center justify-center text-xs font-bold text-white">
              {photoUrls.length} {photoUrls.length === 1 ? 'Foto' : 'Fotos'}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-primary/80 hover:bg-primary backdrop-blur-md border border-white/20 rounded-full p-2 text-white shadow-lg transition-colors"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
        )}

        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          multiple
          className="hidden" 
          ref={fileInputRef}
          onChange={handlePhotoCapture}
        />
      </div>

      <div className="p-6">
        <h3 className="text-2xl font-black mb-2">{item.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">{item.description}</p>

        {/* Botões de Decisão */}
        <div className="flex items-center gap-4">
          <button
            disabled={photos.length === 0}
            onClick={() => {
              setShowObservation(true);
              // Pequeno delay para a pessoa digitar a observação se for Não Conforme
            }}
            className="flex-1 py-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold flex flex-col items-center gap-2 disabled:opacity-30 disabled:grayscale transition-all hover:bg-rose-500/20"
          >
            <X className="w-6 h-6" />
            Não Conforme
          </button>

          <button
            disabled={photos.length === 0}
            onClick={() => submitAnswer(true)}
            className="flex-1 py-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold flex flex-col items-center gap-2 disabled:opacity-30 disabled:grayscale transition-all hover:bg-emerald-500/20"
          >
            <Check className="w-6 h-6" />
            Conforme
          </button>
        </div>

        {/* Observation Accordion */}
        <div className="mt-6">
          {!showObservation ? (
            <button 
              disabled={photos.length === 0}
              onClick={() => setShowObservation(true)}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-white transition-colors disabled:opacity-30"
            >
              <MessageSquarePlus className="w-4 h-4" />
              Adicionar Observação (Opcional)
            </button>
          ) : (
            <AnimatePresence>
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-4"
              >
                <textarea 
                  autoFocus
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Detalhe o problema ou observação aqui..."
                  className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                />
                <button 
                  onClick={() => submitAnswer(false)}
                  className="w-full py-4 rounded-xl bg-rose-500 text-white font-bold uppercase tracking-widest text-xs"
                >
                  Confirmar Irregularidade
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
