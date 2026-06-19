import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuditStorage, AuditPayload } from '@/hooks/useAuditStorage';
import { AUDIT_CATEGORIES, SCHEMA_VERSION } from './constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loader2, MapPin, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RecentAudit {
  id: string;
  store_id: string;
  final_score: number;
  completed_at: string;
  units: { name: string } | null;
}

export default function AuditoriaApp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { draft, loading, saveDraft } = useAuditStorage();
  
  const [storeId, setStoreId] = useState('');
  const [auditorName, setAuditorName] = useState('');
  const [units, setUnits] = useState<{id: string, name: string}[]>([]);
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    supabase.from('units').select('id, name').then(({ data }) => {
      if (data) setUnits(data);
    });

    const fetchRecent = async () => {
      setLoadingRecent(true);
      const { data } = await supabase
        .from('store_inspections')
        .select('id, store_id, final_score, completed_at, units(name)')
        .order('completed_at', { ascending: false })
        .limit(3);
      if (data) setRecentAudits(data as unknown as RecentAudit[]);
      setLoadingRecent(false);
    };
    fetchRecent();
  }, []);

  const handleStart = async () => {
    if (draft) {
      // Já tem rascunho em andamento, apenas redireciona
      return navigate('/auditoria/execucao');
    }

    if (!auditorName.trim()) {
      return toast.error('Por favor, preencha o seu nome antes de iniciar.');
    }
    if (!storeId) return toast.error('Selecione uma loja');
    
    const initialPayload: AuditPayload = {
      inspection_id: crypto.randomUUID(),
      store_id: storeId,
      schema_version: SCHEMA_VERSION,
      auditor_user_id: user?.id || null,
      started_at: new Date().toISOString(),
      completed_at: null,
      device_info: JSON.stringify({ userAgent: navigator.userAgent, auditorName: auditorName.trim() }),
      categories: AUDIT_CATEGORIES.map(cat => ({
        category_name: cat.category_name,
        items: cat.items.map(i => ({
          item_name: i.name,
          category_name: cat.category_name,
          status: null,
          notes: '',
          photos: []
        }))
      }))
    };
    
    await saveDraft(initialPayload);
    navigate('/auditoria/execucao');
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Auditoria de Qualidade</h1>
          <p className="text-sm text-zinc-400 font-medium">Inspeção padronizada de lojas e pátios.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        
        {/* LADO ESQUERDO: Card de Iniciar */}
        <div className="flex flex-col gap-6">
          <div className="relative bg-[#121214] border border-zinc-800 rounded-3xl p-6 shadow-xl overflow-hidden">
            {/* Barra Animada no Topo */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-[length:200%_200%] animate-gradient-shift"></div>

            <div className="mb-6 mt-2">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-4 shadow-inner">
                <MapPin className="text-indigo-400 w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {draft ? 'Rascunho em Andamento' : 'Nova Auditoria'}
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {draft 
                  ? 'Você possui uma auditoria em andamento. Deseja continuar de onde parou?'
                  : 'Selecione a unidade para iniciar a inspeção rigorosa. Imersão total ativada.'}
              </p>
            </div>

            {!draft && (
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Seu Nome (Auditor)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Silva"
                    value={auditorName}
                    onChange={(e) => setAuditorName(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3 text-white placeholder-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Unidade Inspecionada
                  </label>
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none transition-all"
                  >
                    <option value="">Selecione a Unidade...</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={handleStart}
              className={`w-full font-bold rounded-xl p-3.5 mt-6 transition-all active:scale-95 shadow-lg
                ${draft 
                  ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20' 
                  : 'bg-white hover:bg-zinc-200 text-black shadow-white/10'}`}
            >
              {draft ? 'Continuar Inspeção' : 'Iniciar Inspeção'}
            </button>
          </div>
        </div>

        {/* LADO DIREITO: Resumo Rápido */}
        <div className="bg-[#121214] border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Últimas Vistorias
            </h2>
            <button 
              onClick={() => navigate('/historico-auditorias')} 
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wide transition-colors"
            >
              Ver Histórico
            </button>
          </div>
          
          <div className="space-y-3 flex-1">
            {loadingRecent ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-600" /></div>
            ) : recentAudits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-500 text-center">
                <AlertCircle className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm">Nenhuma vistoria recente encontrada.</p>
              </div>
            ) : (
              recentAudits.map(audit => {
                const scoreColor = audit.final_score >= 75 ? 'text-emerald-400' : audit.final_score >= 50 ? 'text-amber-400' : 'text-rose-400';
                const bgScore = audit.final_score >= 75 ? 'bg-emerald-400/10' : audit.final_score >= 50 ? 'bg-amber-400/10' : 'bg-rose-400/10';
                
                return (
                  <div key={audit.id} className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-zinc-800/50 hover:bg-black/60 transition-colors">
                    <div>
                      <p className="font-bold text-white text-sm mb-1">{audit.units?.name || 'Unidade Desconhecida'}</p>
                      <p className="text-xs text-zinc-500 font-medium">
                        {new Date(audit.completed_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg font-black text-sm ${scoreColor} ${bgScore}`}>
                      {audit.final_score}%
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
