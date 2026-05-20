import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KanbanBoard from '@/components/Vault/KanbanBoard';
import { useAppData } from '@/context/AppDataContext';

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

const Vault = () => {
  const navigate = useNavigate();
  const { leads, managers, units } = useAppData();

  const mappedData: CycleMock[] = leads.map(lead => {
    const manager = managers.find(m => m.id === lead.manager_id);
    const unit = units.find(u => u.id === lead.unit_id);
    return {
      id: lead.id,
      customer_phone: lead.customer_phone,
      manager_name: manager?.name || 'Sem Gerente',
      unit_name: unit?.name || 'Sem Unidade',
      status: lead.funnel_stage === 'new' ? 'waiting' : lead.funnel_stage === 'closed_won' || lead.funnel_stage === 'closed_lost' ? 'closed' : 'in_progress',
      wait_time_minutes: lead.wait_time_minutes,
      steps_completed: lead.score !== null ? 4 : 0,
      is_sla_breached: lead.sla_status === 'danger'
    };
  });

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
          <KanbanBoard data={mappedData} />
        </motion.div>
      </main>
    </div>
  );
};

export default Vault;
