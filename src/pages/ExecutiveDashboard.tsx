import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import TvRadarView from './tv/views/TvRadarView';
import TvSemaforoView from './tv/views/TvSemaforoView';
import TvOperationsView from './tv/views/TvOperationsView';

const SCREENS = [TvRadarView, TvSemaforoView, TvOperationsView];

export default function ExecutiveTvMode() {
  const { leads, units, isLoading } = useAppData();
  const [activeScreen, setActiveScreen] = useState(0);
  const [intervalTime, setIntervalTime] = useState(15000); // 15s padrão
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setActiveScreen((prev) => (prev + 1) % SCREENS.length);
      } else if (e.key === 'ArrowLeft') {
        setActiveScreen((prev) => (prev === 0 ? SCREENS.length - 1 : prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    const timer = setInterval(() => {
      if (!isMenuOpen) {
        setActiveScreen((prev) => (prev + 1) % SCREENS.length);
      }
    }, intervalTime);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [intervalTime, isMenuOpen]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#121214] text-white">
        <div className="animate-spin rounded-full border-4 border-t-indigo-500 w-16 h-16 border-white/10"></div>
      </div>
    );
  }

  const ActiveComponent = SCREENS[activeScreen];

  return (
    <div className="relative flex-1 min-h-[calc(100vh-64px)] w-full bg-[#121214] text-white overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeScreen}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.8 }}
          className="h-full w-full"
        >
          <ActiveComponent leads={leads} units={units} />
        </motion.div>
      </AnimatePresence>

      {/* Roda de Progresso / Indicador */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50 bg-black/40 px-6 py-3 rounded-full border border-white/10 backdrop-blur-md">
        {SCREENS.map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className={`h-2 rounded-full transition-all duration-500 ${i === activeScreen ? 'w-12 bg-indigo-500' : 'w-3 bg-white/20'}`} />
          </div>
        ))}
        <div className="w-px h-6 bg-white/10 mx-2" />
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white/40 hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Controles Laterais Visíveis no Hover */}
      <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-start opacity-0 hover:opacity-100 transition-opacity z-40">
         <button onClick={() => setActiveScreen(p => p === 0 ? SCREENS.length - 1 : p - 1)} className="ml-4 p-4 rounded-full bg-black/50 text-white/50 hover:text-white hover:bg-black/80 backdrop-blur transition-all">
            <ChevronLeft className="w-8 h-8" />
         </button>
      </div>
      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-end opacity-0 hover:opacity-100 transition-opacity z-40">
         <button onClick={() => setActiveScreen(p => (p + 1) % SCREENS.length)} className="mr-4 p-4 rounded-full bg-black/50 text-white/50 hover:text-white hover:bg-black/80 backdrop-blur transition-all">
            <ChevronRight className="w-8 h-8" />
         </button>
      </div>

      {/* Menu de Configuração de Tempo */}
      {isMenuOpen && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-2xl z-50 flex gap-2 backdrop-blur-xl">
          {[10, 15, 30, 60].map(sec => (
            <button
              key={sec}
              onClick={() => {
                setIntervalTime(sec * 1000);
                setIsMenuOpen(false);
              }}
              className={`px-4 py-2 rounded-xl text-lg font-bold transition-all ${
                intervalTime === sec * 1000 ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
