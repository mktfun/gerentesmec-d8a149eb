import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { useAppData, Manager } from '@/context/AppDataContext';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Key, Mail, Lock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

import { format, subDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  manager: Manager | null;
  onClose: () => void;
}

const ManagerModal: React.FC<Props> = ({ manager, onClose }) => {
  const { units, leads } = useAppData();
  const unit = units.find(u => u.id === manager?.unit_id);
  
  // Calculate average score
  const managerLeads = leads.filter(l => l.manager_id === manager?.id && l.score !== null);
  const avgScore = managerLeads.length > 0 
    ? Math.round(managerLeads.reduce((acc, l) => acc + (l.score || 0), 0) / managerLeads.length)
    : 0;

  // History Chart logic (last 4 weeks roughly)
  const chartData = React.useMemo(() => {
    if (!managerLeads.length) return [];
    
    // Group by week (last 4 weeks)
    const now = new Date();
    const weeks = [
      { label: 'S1', start: subDays(now, 28), end: subDays(now, 21), leads: [] as any[] },
      { label: 'S2', start: subDays(now, 21), end: subDays(now, 14), leads: [] as any[] },
      { label: 'S3', start: subDays(now, 14), end: subDays(now, 7), leads: [] as any[] },
      { label: 'S4', start: subDays(now, 7), end: now, leads: [] as any[] },
    ];

    managerLeads.forEach(lead => {
      const d = new Date(lead.created_at);
      const targetWeek = weeks.find(w => isAfter(d, w.start) && !isAfter(d, w.end));
      if (targetWeek) targetWeek.leads.push(lead);
    });

    return weeks.map(w => {
      const avg = w.leads.length > 0 
        ? Math.round(w.leads.reduce((sum, l) => sum + (l.score || 0), 0) / w.leads.length)
        : null;
      return { week: w.label, score: avg };
    });
  }, [managerLeads]);

  // Replace nulls with previous values or 0 for a continuous line
  const displayChartData = chartData.map((d, i, arr) => {
    if (d.score !== null) return d;
    // Find previous valid score
    let prevValid = 0;
    for (let j = i - 1; j >= 0; j--) {
      if (arr[j].score !== null) { prevValid = arr[j].score as number; break; }
    }
    return { ...d, score: prevValid };
  });

  // Recent Audits
  const recentAudits = React.useMemo(() => {
    return [...managerLeads]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(l => ({
        date: format(new Date(l.created_at), "d 'de' MMM, HH:mm", { locale: ptBR }),
        client: (l as any).name || l.customer_name || 'Cliente',
        score: l.score || 0
      }));
  }, [managerLeads]);

  // Calculate KPI (Difference between current week and 4 weeks ago)
  const kpiDiff = displayChartData.length === 4 
    ? displayChartData[3].score - displayChartData[0].score 
    : 0;
  const isKpiPositive = kpiDiff >= 0;

  // Access Generation State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [accessSuccess, setAccessSuccess] = useState(false);
  const [isEditingAccess, setIsEditingAccess] = useState(false);

  // Reset access state whenever a different manager is opened
  useEffect(() => {
    setEmail('');
    setPassword('');
    setAccessError('');
    setAccessSuccess(false);
    setIsEditingAccess(false);
    setLoadingAccess(false);
  }, [manager?.id]);


  const handleAccessAction = async (action: 'create' | 'update' | 'revoke') => {
    if ((action === 'create' || action === 'update') && (!email && !password)) return;
    if (!manager) return;

    setLoadingAccess(true);
    setAccessError('');
    setAccessSuccess(false);

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { 
          action, 
          email, 
          password, 
          manager_id: manager.id, 
          auth_user_id: manager.auth_user_id 
        }
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setAccessSuccess(true);
      if (action === 'revoke' || action === 'update') setIsEditingAccess(false);
    } catch (err: any) {
      setAccessError(err.message || 'Erro ao processar acesso.');
    } finally {
      setLoadingAccess(false);
    }
  };

  return (
    <AnimatePresence>
      {manager && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed top-0 right-0 h-full w-full max-w-[420px] z-50
              bg-card border-l border-border flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 flex items-center justify-center
                  text-lg font-black text-indigo-300">
                  {manager.name[0]}
                </div>
                <div>
                  <p className="font-black text-foreground">{manager.name}</p>
                  <p className="text-xs text-muted-foreground">{unit?.name}</p>
                </div>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/[0.05] hover:bg-black/10 dark:hover:bg-white/[0.10]
                  flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Access Control highlight */}
            <div className="px-6 py-5 border-b border-border bg-black/5 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-4 h-4 text-amber-500" />
                <p className="label-caps text-amber-500/80 mb-0">Acesso ao Sistema</p>
              </div>

              {manager.auth_user_id && !isEditingAccess ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Acesso Ativo</p>
                      <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">Este gerente possui login no sistema.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsEditingAccess(true)}
                    className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-foreground/80 hover:bg-white/10 transition-colors"
                  >
                    Alterar Credenciais
                  </button>
                </div>
              ) : accessSuccess && !isEditingAccess ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Acesso Criado/Atualizado!</p>
                    <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">Tudo pronto.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground mb-3">
                    {manager.auth_user_id ? 'Digite os novos dados para alterar o login atual.' : 'Gere as credenciais para este gerente visualizar apenas a própria loja.'}
                  </p>
                  
                  {accessError && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="text-[10px] leading-relaxed">{accessError}</p>
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                    <input 
                      type="text" placeholder={manager.auth_user_id ? "Novo Usuário ou E-mail (opcional)" : "Usuário ou E-mail"} 
                      value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                    <input 
                      type="text" placeholder={manager.auth_user_id ? "Nova Senha (opcional)" : "Senha provisória"} 
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  
                  {manager.auth_user_id ? (
                    <div className="flex items-center gap-2 pt-2">
                      <button 
                        onClick={() => setIsEditingAccess(false)}
                        className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-foreground/80 hover:bg-white/10 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => handleAccessAction('revoke')}
                        disabled={loadingAccess}
                        className="flex-1 py-2 rounded-lg bg-rose-500/20 text-rose-500 text-xs font-bold hover:bg-rose-500/30 transition-colors disabled:opacity-50"
                      >
                        {loadingAccess ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Revogar Acesso'}
                      </button>
                      <button 
                        onClick={() => handleAccessAction('update')}
                        disabled={loadingAccess || (!email && !password)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500 text-amber-950 text-xs font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
                      >
                        {loadingAccess ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleAccessAction('create')}
                      disabled={loadingAccess || !email || !password}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500 text-amber-950 text-xs font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
                    >
                      {loadingAccess ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                      {loadingAccess ? 'Gerando...' : 'Gerar Acesso'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Score highlight */}
            <div className="px-6 py-5 border-b border-border">
              <p className="label-caps text-indigo-400/70 mb-2">Score Atual</p>
              <div className="flex items-end gap-3">
                <span className={`text-5xl font-black ${
                  avgScore >= 80 ? 'text-emerald-500 dark:text-emerald-400' : avgScore >= 60 ? 'text-indigo-500 dark:text-indigo-300' : 'text-rose-500 dark:text-rose-400'
                }`}>{avgScore}%</span>
                
                {kpiDiff !== 0 && (
                  <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mb-1.5 ${
                    isKpiPositive 
                      ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20' 
                      : 'text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-400/10 border border-rose-500/20'
                  }`}>
                    {isKpiPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isKpiPositive ? '+' : ''}{kpiDiff}% no mês
                  </span>
                )}
                {kpiDiff === 0 && avgScore > 0 && (
                   <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mb-1.5 text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
                     Estável no mês
                   </span>
                )}
              </div>
            </div>

            {/* History Chart */}
            <div className="px-6 py-5 border-b border-border">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Evolução (4 semanas)</p>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={displayChartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <XAxis dataKey="week" axisLine={false} tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, 100]}
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                    itemStyle={{ color: '#818cf8', fontWeight: 700 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5}
                    dot={{ fill: '#6366f1', r: 4, stroke: '#fff', strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1200}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Audits */}
            <div className="flex-1 px-6 py-5 overflow-y-auto">
              <p className="label-caps text-muted-foreground mb-3">Últimas Auditorias</p>
              <div className="space-y-2">
                {recentAudits.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic mt-2">Nenhuma auditoria recente.</p>
                ) : recentAudits.map((audit, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                    bg-black/5 dark:bg-white/[0.03] border border-border hover:bg-black/10 dark:hover:bg-white/[0.06] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground/80 truncate">{audit.client}</p>
                      <p className="text-[10px] text-muted-foreground">{audit.date}</p>
                    </div>
                    <span className={`text-xs font-black ${
                      audit.score >= 75 ? 'text-emerald-500 dark:text-emerald-400' : audit.score >= 50 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400'
                    }`}>{audit.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ManagerModal;
