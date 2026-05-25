import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppData } from '@/context/AppDataContext';
import { UnitOperationalSlide } from '@/components/Dashboard/UnitOperationalSlide';
import { GlobalOperationalSlide } from '@/components/Dashboard/GlobalOperationalSlide';
import { supabase } from '@/integrations/supabase/client';
import { Pause, Play } from 'lucide-react';

const SLIDE_DURATION = 15000; // 15 seconds per slide

const TvOperacional = () => {
  const { leads, businessHours, managers, units } = useAppData();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dailyScores, setDailyScores] = useState<any[]>([]);
  
  // Apenas unidades que possuem leads ou gerentes associados
  const activeUnits = units.filter(u => {
    const hasLeads = leads.some(l => l.unit_id === u.id);
    const hasManager = managers.some(m => m.unit_id === u.id);
    return hasLeads || hasManager;
  });

  const totalSlides = activeUnits.length + 1; // Units + Global Slide

  // Fetch historical data once on mount
  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('daily_score_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(14);
      
      if (!error && data) {
        setDailyScores(data);
      }
    };
    fetchHistory();
  }, []);

  // Carousel logic
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, SLIDE_DURATION);

    return () => clearInterval(interval);
  }, [totalSlides, isPaused]);

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden relative selection:bg-white/20">
      
      {/* Background liquid glass generic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-indigo-900/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header Minimalista (Controls) */}
      <div className="absolute top-8 right-8 z-50 flex items-center gap-4">
         <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Live</span>
         </div>
         <button 
           onClick={() => setIsPaused(!isPaused)}
           className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/70 hover:text-white"
         >
           {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
         </button>
      </div>

      <div className="absolute top-8 left-8 z-50">
         <div className="text-xs font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
            Radar Operacional <span className="text-white/10">/</span> Slide {currentIndex + 1} de {totalSlides}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative w-full h-full">
        <AnimatePresence mode="wait">
          {currentIndex < activeUnits.length ? (
            <UnitOperationalSlide 
              key={`unit-${activeUnits[currentIndex].id}`}
              unit={activeUnits[currentIndex]}
              managers={managers.filter(m => m.unit_id === activeUnits[currentIndex].id)}
              leads={leads}
              dailyScores={dailyScores}
              businessHours={businessHours}
            />
          ) : (
            <GlobalOperationalSlide 
              key="global-slide"
              units={activeUnits}
              managers={managers}
              leads={leads}
              dailyScores={dailyScores}
              businessHours={businessHours}
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Progress Bar Indicator */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
        <div 
          className="h-full bg-indigo-500/50 transition-all ease-linear"
          style={{ 
            width: isPaused ? '100%' : '100%',
            transitionDuration: isPaused ? '0s' : `${SLIDE_DURATION}ms`,
            transformOrigin: 'left',
            animation: isPaused ? 'none' : `progress ${SLIDE_DURATION}ms linear infinite`
          }}
        />
        <style>{`
          @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default TvOperacional;
