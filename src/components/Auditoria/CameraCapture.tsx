import React, { useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { Camera, MapPin, Loader2 } from 'lucide-react';
import { AuditPhoto } from '@/hooks/useAuditStorage';

interface Props {
  onPhotoCaptured: (photo: AuditPhoto) => void;
  disabled?: boolean;
}

export default function CameraCapture({ onPhotoCaptured, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // 1. Get GPS coordinates
      let lat: number | null = null;
      let long: number | null = null;
      
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 0 });
        });
        lat = pos.coords.latitude;
        long = pos.coords.longitude;
      } catch (geoErr) {
        console.warn('GPS not available', geoErr);
        // Regra de negócio: devemos bloquear se não tiver GPS?
        // Em muitas oficinas o sinal de GPS dentro do galpão é ruim, então gravamos nulo se falhar,
        // mas o timestamp é sempre garantido.
      }

      // 2. Compress image
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true
      };
      const compressedBlob = await imageCompression(file, options);
      
      // 3. Create Photo Object
      const photo: AuditPhoto = {
        id: crypto.randomUUID(),
        blob: compressedBlob,
        lat,
        long,
        timestamp: new Date().toISOString(),
        previewUrl: URL.createObjectURL(compressedBlob)
      };

      onPhotoCaptured(photo);
      
    } catch (err) {
      console.error('Error capturing photo', err);
      alert('Erro ao processar foto. Tente novamente.');
    } finally {
      setIsProcessing(false);
      // Reset input so the same file can be captured again if needed
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <input 
        ref={inputRef}
        type="file" 
        accept="image/*" 
        capture="environment" // ANTI-FRAUD: Forces back camera on mobile, blocks gallery
        onChange={handleCapture}
        disabled={disabled || isProcessing}
        className="hidden" 
        id="camera-input"
      />
      <label 
        htmlFor="camera-input"
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed 
          transition-colors ${
            disabled || isProcessing 
              ? 'opacity-50 cursor-not-allowed border-border/50 bg-muted/20 text-muted-foreground' 
              : 'cursor-pointer border-indigo-500/50 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20'
          }`}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Camera className="w-5 h-5" />
            <span className="font-bold text-sm">Tirar Foto</span>
          </>
        )}
      </label>
    </div>
  );
}
