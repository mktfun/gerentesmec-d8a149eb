import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppData, Lead } from '@/context/AppDataContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { avgScore } from '@/utils/scoreUtils';
import { calculateDangerLeads } from '@/utils/metrics';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Target, Search } from 'lucide-react';
import ManagerAuditInspector from '@/components/Manager/ManagerAuditInspector';

const ManagerDashboard: React.FC = () => {
  const { leads, managers, businessHours } = useAppData();
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<'todos' | 'hoje' | 'atraso'>('todos');

  const currentManager = managers.find(m => m.auth_user_id === user?.id);
  const managerLeads = leads.filter(l => currentManager ? l.manager_id === currentManager.id : true);

  const score = avgScore(managerLeads);
  const displayScore = score !== null ? Math.round(score) : 0;
  const dangerLeads = calculateDangerLeads(managerLeads, businessHours);
  const todayLeads = managerLeads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString());

  // Sorting
  const sortedLeads = [...managerLeads].sort((a, b) => {
    if (a.score !== null && b.score !== null) return Number(a.score) - Number(b.score);
    if (a.score !== null) return -1;
    if (b.score !== null) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }).filter(l => {
    if (filter === 'hoje') return new Date(l.created_at).toDateString() === new Date().toDateString();
    if (filter === 'atraso') return dangerLeads.some(d => d.id === l.id);
    return true;
  });

  return (
    <div className={`min-h-screen pb-10 font-instrument ${isDark ? 'bg-[#212529] text-white' : 'bg-[#f5f6f7] text-[#212529]'}`}>

      {/* Greetings */}
      <div className="pt-12 px-6">
        <h2 className="text-xl font-medium opacity-60">Olá, {currentManager?.name?.split(' ')[0] || 'Gerente'}</h2>
        <h1 className="text-4xl font-black tracking-tight mt-1">Sua Oficina</h1>
      </div>

      {/* Massive Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-6 mt-8 rounded-[3rem] bg-[#212529] overflow-hidden relative p-8 shadow-xl border border-white/5"
      >
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Cars" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
          <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#111] to-transparent' : 'from-[#212529] to-transparent'}`} />
        </div>
        
        <div className="relative z-10 flex flex-col items-center mt-4">
          <span className="text-[6rem] font-black leading-none tracking-tighter text-white">{score !== null ? displayScore : '—'}</span>
          <span className="text-xs font-bold mt-2 text-white/60 uppercase tracking-[0.2em]">Score Geral</span>
        </div>
        
        <div className="relative z-10 flex justify-between mt-10 gap-4">
          <div className="flex-1 text-center bg-white/10 px-6 py-4 rounded-3xl backdrop-blur-md border border-white/10">
            <div className="text-2xl font-black text-white">{todayLeads.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Hoje</div>
          </div>
          <div className={`flex-1 text-center px-6 py-4 rounded-3xl backdrop-blur-md border ${dangerLeads.length > 0 ? 'bg-rose-500/80 border-rose-400' : 'bg-white/10 border-white/10'}`}>
            <div className="text-2xl font-black text-white">{dangerLeads.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Atrasos</div>
          </div>
        </div>
      </motion.div>

      {/* Pills Filter */}
      <div className="flex gap-3 overflow-x-auto px-6 mt-10 pb-2 no-scrollbar">
        <button 
          onClick={() => setFilter('todos')}
          className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${filter === 'todos' ? (isDark ? 'bg-white text-black' : 'bg-[#212529] text-white') : (isDark ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-black/5 text-black/60 hover:bg-black/10')}`}
        >
          Todos
        </button>
        <button 
          onClick={() => setFilter('hoje')}
          className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${filter === 'hoje' ? (isDark ? 'bg-white text-black' : 'bg-[#212529] text-white') : (isDark ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-black/5 text-black/60 hover:bg-black/10')}`}
        >
          Hoje
        </button>
        <button 
          onClick={() => setFilter('atraso')}
          className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${filter === 'atraso' ? (isDark ? 'bg-white text-black' : 'bg-[#212529] text-white') : (isDark ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-black/5 text-black/60 hover:bg-black/10')}`}
        >
          Em Atraso
        </button>
      </div>

      {/* Leads List */}
      <div className="px-6 mt-6 space-y-4">
        {sortedLeads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 opacity-40">
            <Search className="w-12 h-12 mb-4" />
            <p className="text-lg font-bold">Nenhum atendimento</p>
          </div>
        )}

        {sortedLeads.map((lead, i) => {
          const sc = lead.score as number | null;
          const isDanger = dangerLeads.some(d => d.id === lead.id);
          const name = lead.name || lead.customer_name || 'Cliente Sem Nome';
          const date = format(new Date(lead.created_at), "dd MMM, HH:mm", { locale: ptBR });
          
          let scoreBg = isDark ? 'bg-white/5' : 'bg-black/5';
          let scoreText = isDark ? 'text-white' : 'text-black';
          
          if (sc !== null) {
            if (sc >= 75) { scoreBg = 'bg-emerald-100 dark:bg-emerald-500/20'; scoreText = 'text-emerald-600 dark:text-emerald-400'; }
            else if (sc >= 50) { scoreBg = 'bg-indigo-100 dark:bg-indigo-500/20'; scoreText = 'text-indigo-600 dark:text-indigo-400'; }
            else { scoreBg = 'bg-rose-100 dark:bg-rose-500/20'; scoreText = 'text-rose-600 dark:text-rose-400'; }
          }

          return (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-6 rounded-[2.5rem] flex flex-col gap-6 shadow-sm border ${isDark ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-black/5'}`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-4">
                  <h3 className="font-black text-2xl truncate">{name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-semibold opacity-50">{date}</p>
                    {isDanger && <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest">Atraso</span>}
                  </div>
                </div>
                
                {/* Score Pill */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ${scoreBg} ${scoreText}`}>
                  {sc !== null ? sc : '?'}
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedLead(lead)}
                className={`w-full py-4 rounded-full font-black text-base transition-transform active:scale-95 ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#212529] text-white hover:bg-black'}`}
              >
                Avaliar Atendimento
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Audit Inspector Modal */}
      <AnimatePresence>
        {selectedLead && (
          <ManagerAuditInspector
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagerDashboard;
