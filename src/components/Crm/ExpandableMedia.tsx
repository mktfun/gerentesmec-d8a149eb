import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, ZoomIn } from 'lucide-react';

interface ExpandableMediaProps {
  src: string;
  type: 'image' | 'video';
}

export const ExpandableMedia: React.FC<ExpandableMediaProps> = ({ src, type }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Thumbnail */}
      <div 
        className="relative mt-2 w-full max-w-xs group cursor-pointer overflow-hidden rounded-xl shadow-sm border border-black/5 dark:border-white/5"
        onClick={() => setIsOpen(true)}
      >
        {type === 'image' ? (
          <>
            <img src={src} alt="Anexo" className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100">
                <ZoomIn className="w-5 h-5 text-white" />
              </div>
            </div>
          </>
        ) : (
          <>
            <video src={src} className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105" preload="metadata" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transition-transform scale-95 group-hover:scale-105 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-zoom-out"
              onClick={() => setIsOpen(false)}
            />

            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Media Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
              className="relative z-10 max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Prevent clicks on media from closing modal
            >
              {type === 'image' ? (
                <img 
                  src={src} 
                  alt="Anexo Expandido" 
                  className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl" 
                />
              ) : (
                <video 
                  src={src} 
                  controls 
                  autoPlay
                  className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl bg-black" 
                />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
