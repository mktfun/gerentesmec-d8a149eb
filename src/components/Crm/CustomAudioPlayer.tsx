import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface CustomAudioPlayerProps {
  src: string;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ src }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const { isDark } = useTheme();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    // Events
    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const prevValue = isPlaying;
    setIsPlaying(!prevValue);
    if (!prevValue) {
      audioRef.current?.play();
    } else {
      audioRef.current?.pause();
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = Number(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 p-2 rounded-full w-full max-w-sm ${isDark ? 'bg-white/10' : 'bg-black/5'} transition-all`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button 
        onClick={togglePlayPause}
        className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-sm text-white"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
           <Pause className="w-5 h-5 fill-current" />
        ) : (
           <Play className="w-5 h-5 fill-current ml-0.5" />
        )}
      </button>

      {/* Progress Bar & Time */}
      <div className="flex-1 flex flex-col justify-center min-w-0 pr-3">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] font-bold ${isDark ? 'text-white/60' : 'text-black/60'} font-instrument`}>Mensagem de Áudio</span>
          <span className={`text-[10px] font-black tracking-wide ${isDark ? 'text-white/80' : 'text-black/80'} font-instrument`}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        
        {/* Fake Slider wrapper for custom styling */}
        <div className="relative w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden group">
           <div 
             className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-100" 
             style={{ width: `${progressPercentage}%` }} 
           />
           {/* Invisible real range input on top for sliding */}
           <input
             type="range"
             min="0"
             max={duration || 100}
             value={currentTime}
             onChange={handleProgressChange}
             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
           />
        </div>
      </div>
    </div>
  );
};
