import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, RefreshCw, Link as LinkIcon, CheckCircle2, Plus } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { supabase } from '@/integrations/supabase/client';

export const InboxMappingPanel = ({ apiUrl, apiToken, accountId }: { apiUrl: string, apiToken: string, accountId: string }) => {
  const { units, updateUnit, addUnit } = useAppData();
  const [inboxes, setInboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInboxes = async () => {
    if (!apiUrl || !apiToken) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('chatwoot-inboxes', {
        body: { chatwoot_url: apiUrl, chatwoot_token: apiToken, chatwoot_account_id: accountId ? Number(accountId) : undefined }
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setInboxes(data?.inboxes || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiUrl && apiToken) {
      fetchInboxes();
    }
  }, [apiUrl, apiToken]);

  const handleMapInbox = async (unitId: string, inboxId: number) => {
    if (!unitId) {
      // Unmap if empty string selected? We can support it, but for now we just map.
      return;
    }
    await updateUnit(unitId, { chatwoot_inbox_id: inboxId });
  };

  return (
    <div className="mt-6 border border-border rounded-2xl bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Caixas de Entrada (Chatwoot)</h3>
        </div>
        <button 
          onClick={fetchInboxes} 
          disabled={loading}
          className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Carregando...' : 'Atualizar'}
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 text-xs font-semibold rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
          Erro ao carregar canais: {error}
        </div>
      )}

      {inboxes.length === 0 && !loading && !error && (
        <div className="text-center py-6 text-xs text-muted-foreground">
          Nenhuma caixa de entrada encontrada nesta conta.
        </div>
      )}

      <div className="space-y-3">
        {inboxes.map(inbox => {
          const mappedUnit = units.find(u => u.chatwoot_inbox_id === inbox.id);
          
          return (
            <div key={inbox.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{inbox.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{inbox.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {inbox.id} • {inbox.channel_type}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <select 
                  value={mappedUnit?.id || ''}
                  onChange={(e) => handleMapInbox(e.target.value, inbox.id)}
                  className="px-2 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:border-primary/50 text-foreground"
                >
                  <option value="">Selecione a Unidade...</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                {mappedUnit ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <button
                    onClick={() => addUnit(inbox.name, inbox.id)}
                    title={`Criar unidade "${inbox.name}" automaticamente`}
                    className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
