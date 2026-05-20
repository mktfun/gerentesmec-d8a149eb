import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KanbanBoard from '@/components/Vault/KanbanBoard';

export interface CycleMock {
  id: string;
  customer_phone: string;
  manager_name: string;
  unit_name: string;
  status: 'waiting' | 'in_progress' | 'closed';
  wait_time_minutes: number;
  steps_completed: number;
  is_sla_breached: boolean;
}

const mockData: CycleMock[] = [
  { id: '1', customer_phone: '+55 11 9999-8888', manager_name: 'Renato Silva', unit_name: 'Dom Pedro', status: 'waiting', wait_time_minutes: 25, steps_completed: 0, is_sla_breached: true },
  { id: '2', customer_phone: '+55 11 9777-6666', manager_name: 'Marcos Souza', unit_name: 'Jabaquara', status: 'waiting', wait_time_minutes: 5, steps_completed: 0, is_sla_breached: false },
  { id: '3', customer_phone: '+55 11 9555-4444', manager_name: 'Amanda Costa', unit_name: 'Kennedy', status: 'in_progress', wait_time_minutes: 2, steps_completed: 1, is_sla_breached: false },
  { id: '4', customer_phone: '+55 11 9444-3333', manager_name: 'Jorge Bereta', unit_name: 'Jabaquara', status: 'closed', wait_time_minutes: 0, steps_completed: 3, is_sla_breached: false },
];

const Vault = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30">
      {/* Liquid Glass Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <h1 className="font-semibold text-sm tracking-wide text-slate-100 uppercase">Hermes Vault</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">Monitoramento Ativo</span>
        </div>
      </header>

      {/* Main Content: Kanban */}
      <main className="relative z-10 p-6 h-[calc(100vh-4rem)] overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full"
        >
          <KanbanBoard data={mockData} />
        </motion.div>
      </main>
    </div>
  );
};

export default Vault;
