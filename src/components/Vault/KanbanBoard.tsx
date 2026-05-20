import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CycleMock } from '@/pages/Vault';
import KanbanCard from './KanbanCard';
import AuditSheet from './AuditSheet';

interface KanbanBoardProps {
  data: CycleMock[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ data }) => {
  const [selectedCycle, setSelectedCycle] = useState<CycleMock | null>(null);

  const columns = [
    { id: 'waiting', title: 'Aguardando Resposta' },
    { id: 'in_progress', title: 'Em Atendimento' },
    { id: 'closed', title: 'Concluído' },
  ];

  return (
    <>
      <div className="flex gap-6 h-full w-full overflow-x-auto pb-4 custom-scrollbar">
        {columns.map((col, index) => {
          const colData = data.filter(d => d.status === col.id);
          
          return (
            <motion.div 
              key={col.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex flex-col min-w-[320px] max-w-[320px] h-full"
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {col.title}
                </h3>
                <span className="bg-white/5 text-slate-400 text-xs py-0.5 px-2 rounded-full">
                  {colData.length}
                </span>
              </div>
              
              <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col gap-3 overflow-y-auto">
                <AnimatePresence>
                  {colData.map((cycle, i) => (
                    <KanbanCard 
                      key={cycle.id} 
                      data={cycle} 
                      index={i} 
                      onClick={() => setSelectedCycle(cycle)}
                    />
                  ))}
                  {colData.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="h-full w-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl"
                    >
                      <span className="text-sm text-slate-600">Vazio</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AuditSheet 
        isOpen={!!selectedCycle} 
        onClose={() => setSelectedCycle(null)} 
        cycle={selectedCycle} 
      />
    </>
  );
};

export default KanbanBoard;
