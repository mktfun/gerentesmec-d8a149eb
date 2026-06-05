import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppData, Lead } from '@/context/AppDataContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { avgScore } from '@/utils/scoreUtils';
import { filterDashboardLeads } from '@/utils/dashboardFilters';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inbox'>('inbox');
  const [filter, setFilter] = useState<'todos' | 'hoje' | 'atraso'>('todos');

  const currentManager = managers.find(m => m.auth_user_id === user?.id);
  const isAdmin = !currentManager;
  const managerLeads = leads.filter(l => currentManager ? l.manager_id === currentManager.id : (l.funnel_stage === 'closed_won' || l.funnel_stage === 'closed_lost'));

  const managerLeadsDash = filterDashboardLeads(managerLeads, 30);
  const score = avgScore(managerLeadsDash);
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
    <div className={`min-h-screen pb-20 font-instrument ${isDark ? 'bg-[#212529] text-white' : 'bg-[#f5f6f7] text-[#212529]'}`}>

      {/* Greetings */}
      <div className="pt-12 px-6">
        <h2 className="text-xl font-medium opacity-60">
          {isAdmin ? 'Olá, Administrador' : `Olá, ${currentManager?.name?.split(' ')[0] || 'Gerente'}`}
        </h2>
        <h1 className="text-4xl font-black tracking-tight mt-1">
          {isAdmin ? 'Visão Global de Auditoria' : 'Sua Oficina'}
        </h1>
      </div>

      {/* Segmented Control (Apenas para Gerentes) */}
      {!isAdmin && (
        <div className="px-6 mt-8">
          <div className={`flex p-1 rounded-full ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-3 text-sm font-bold rounded-full transition-all ${activeTab === 'dashboard' ? (isDark ? 'bg-white text-black shadow-md' : 'bg-[#212529] text-white shadow-md') : 'text-current opacity-60'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex-1 py-3 text-sm font-bold rounded-full transition-all flex items-center justify-center gap-2 ${activeTab === 'inbox' ? (isDark ? 'bg-white text-black shadow-md' : 'bg-[#212529] text-white shadow-md') : 'text-current opacity-60'}`}
            >
              Inbox
              {dangerLeads.length > 0 && <span className="w-2 h-2 rounded-full bg-rose-500" />}
            </button>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="mt-8 mb-6 mx-6 rounded-[2rem] bg-indigo-600 overflow-hidden relative p-8 shadow-xl border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/50 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[4rem] font-black leading-none tracking-tighter text-white">{managerLeads.length}</span>
            <span className="text-xs font-bold mt-2 text-white/80 uppercase tracking-[0.2em]">Atendimentos Pendentes de Auditoria</span>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {(!isAdmin && activeTab === 'dashboard') ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 space-y-6"
          >
            <div className="mx-6 rounded-[3rem] bg-[#212529] overflow-hidden relative p-8 shadow-xl border border-white/5">
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
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="inbox"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={isAdmin ? "mt-2" : "mt-6"}
          >
            {/* Pills Filter (Apenas para Gerentes) */}
            {!isAdmin && (
              <div className="flex gap-2 overflow-x-auto px-6 pb-2 no-scrollbar">
                <button 
                  onClick={() => setFilter('todos')}
                  className={`px-5 py-2 text-xs rounded-full font-bold whitespace-nowrap transition-colors ${filter === 'todos' ? (isDark ? 'bg-white text-black' : 'bg-[#212529] text-white') : (isDark ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-black/5 text-black/60 hover:bg-black/10')}`}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setFilter('hoje')}
                  className={`px-5 py-2 text-xs rounded-full font-bold whitespace-nowrap transition-colors ${filter === 'hoje' ? (isDark ? 'bg-white text-black' : 'bg-[#212529] text-white') : (isDark ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-black/5 text-black/60 hover:bg-black/10')}`}
                >
                  Hoje
                </button>
                <button 
                  onClick={() => setFilter('atraso')}
                  className={`px-5 py-2 text-xs rounded-full font-bold whitespace-nowrap transition-colors ${filter === 'atraso' ? (isDark ? 'bg-white text-black' : 'bg-[#212529] text-white') : (isDark ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-black/5 text-black/60 hover:bg-black/10')}`}
                >
                  Em Atraso
                </button>
              </div>
            )}

            {/* Inbox List */}
            <div className={`mt-4 mx-4 rounded-[2.5rem] p-2 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'} shadow-sm`}>
              {sortedLeads.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 opacity-40">
                  <Search className="w-12 h-12 mb-4" />
                  <p className="text-lg font-bold">Inbox vazia</p>
                </div>
              )}

              <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
                {sortedLeads.map((lead, i) => {
                  const sc = lead.score as number | null;
                  const isDanger = dangerLeads.some(d => d.id === lead.id);
                  const name = (lead as any).name || lead.customer_name || 'Cliente Sem Nome';
                  const date = format(new Date(lead.created_at), "dd/MM HH:mm", { locale: ptBR });
                  
                  let scoreColor = isDark ? 'text-white/40' : 'text-black/40';
                  
                  if (sc !== null) {
                    if (sc >= 75) scoreColor = 'text-emerald-500';
                    else if (sc >= 50) scoreColor = 'text-indigo-500';
                    else scoreColor = 'text-rose-500';
                  }

                  const initials = name.substring(0, 2).toUpperCase();

                  return (
                    <button
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`flex items-center gap-4 p-4 rounded-3xl transition-all hover:bg-black/5 dark:hover:bg-white/5 text-left`}
                    >
                      {/* Avatar */}
                      <div className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center text-lg font-black ${isDark ? 'bg-white/5 text-white' : 'bg-black/5 text-black'} relative`}>
                        {initials}
                        {isDanger && <span className="absolute bottom-0 right-0 w-4 h-4 bg-rose-500 rounded-full border-2 border-background" />}
                      </div>
                      
                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-bold text-base truncate">{name}</h3>
                          <span className="text-xs font-semibold opacity-40 shrink-0">{date}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium opacity-60 truncate">Ver auditoria completa...</p>
                          {/* Score Text */}
                          <div className={`font-black text-sm shrink-0 ml-2 ${scoreColor}`}>
                            {sc !== null ? `${sc}%` : 'Pendente'}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
