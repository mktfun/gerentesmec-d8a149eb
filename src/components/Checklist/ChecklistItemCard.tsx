import React, { useState, useRef } from 'react';
import { Camera, Check, X, MessageSquarePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChecklistItem } from '@/data/checklist_template';

interface Props {
  item: ChecklistItem;
  onAnswer: (data: { isConform: boolean; photoFile: File; observation?: string }) => void;
}

export default function ChecklistItemCard({ item, onAnswer }: Props) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showObservation, setShowObservation] = useState(false);
  const [observation, setObservation] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoUrl(URL.createObjectURL(file));
    }
  };

  const submitAnswer = (isConform: boolean) => {
    if (!photo) return;
    onAnswer({ isConform, photoFile: photo, observation });
  };

  return (
    <div className="w-full bg-[#111116] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative">
      {/* Imagem de Fundo (Blur) ou Placeholder */}
      <div className="h-64 w-full bg-black/50 relative overflow-hidden flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt="Evidência" className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
        )}
        
        {/* Botão de Câmera Centralizado (Glassmorphism) */}
        {!photoUrl && (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="relative z-10 w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center gap-2 hover:bg-white/20 transition-all shadow-xl"
          >
            <Camera className="w-8 h-8 text-white" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Tirar Foto</span>
          </button>
        )}
        
        {/* Retirar Foto (Canto superior) */}
        {photoUrl && (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute top-4 right-4 bg-black/50 backdrop-blur-md border border-white/20 rounded-full p-2"
          >
            <Camera className="w-5 h-5 text-white" />
          </button>
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

      <div className="p-6">
        <h3 className="text-2xl font-black mb-2">{item.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">{item.description}</p>

        {/* Botões de Decisão */}
        <div className="flex items-center gap-4">
          <button
            disabled={!photo}
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
            disabled={!photo}
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
              disabled={!photo}
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
