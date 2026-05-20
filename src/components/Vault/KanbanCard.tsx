import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, AlertCircle } from 'lucide-react';
import { CycleMock } from '@/pages/Vault';

interface KanbanCardProps {
  data: CycleMock;
  index: number;
  onClick: () => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ data, index, onClick }) => {
  const isDanger = data.wait_time_minutes >= 20;
  const isWarning = data.wait_time_minutes >= 10 && !isDanger;

  return (
    <motion.div
      layoutId={data.id}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      whileHover={{ y: -2, scale: 1.02 }}
      onClick={onClick}
      className={`relative group cursor-pointer bg-slate-900/80 backdrop-blur-md rounded-xl p-4 border transition-all duration-300 ${
        isDanger 
          ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:border-rose-400' 
          : isWarning
          ? 'border-amber-500/30 hover:border-amber-400/50'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* SLA Indicator Line */}
      <div className={`absolute top-0 left-0 w-full h-1 rounded-t-xl ${
        isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-transparent'
      }`} />

      {/* Pulse effect if danger */}
      {isDanger && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
        </span>
      )}

      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-sm text-slate-100">{data.customer_phone}</h4>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
            <MapPin className="w-3 h-3" />
            {data.unit_name}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            {data.manager_name[0]}
          </div>
          <span className="text-slate-300 truncate max-w-[100px]">{data.manager_name}</span>
        </div>

        <div className={`flex items-center gap-1 font-medium ${
          isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-400'
        }`}>
          <Clock className="w-3 h-3" />
          {data.wait_time_minutes}m
        </div>
      </div>

      {/* Steps progress bar indicator */}
      <div className="mt-4 pt-3 border-t border-white/5 flex gap-1">
        {[1, 2, 3, 4].map((step) => (
          <div 
            key={step} 
            className={`h-1 flex-1 rounded-full ${
              step <= data.steps_completed ? 'bg-blue-500' : 'bg-white/10'
            }`} 
          />
        ))}
      </div>
    </motion.div>
  );
};

export default KanbanCard;
