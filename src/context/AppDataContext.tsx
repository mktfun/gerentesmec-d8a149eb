import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';
import { BusinessHoursConfig, DEFAULT_BUSINESS_HOURS } from '@/utils/businessHours';

export type Lead = Database['public']['Tables']['leads']['Row'] & {
  audit_checklist_messages?: Record<string, string>;
};
export type Manager = Database['public']['Tables']['managers']['Row'] & {
  auth_user_id?: string | null;
};
export type Unit = Database['public']['Tables']['units']['Row'];
export type AiSettings = Database['public']['Tables']['ai_settings']['Row'] & {
  api_url?: string | null;
  system_prompt?: string;
  evaluation_criteria?: any;
  features?: { auto_scoring?: boolean; auto_pipeline?: boolean; vision?: boolean; audio?: boolean; };
  embedding_provider?: string;
};
export type IntegrationSettings = Database['public']['Tables']['integration_settings']['Row'];
export type ChatwootInsights = {
  id: string;
  type: string;
  entity_id: string;
  metrics: any;
  created_at: string;
  updated_at: string;
};

export type FunnelStage = Lead['funnel_stage'];

interface AppDataContextType {
  leads: Lead[];
  managers: Manager[];
  units: Unit[];
  aiSettings: AiSettings | null;
  integrationSettings: IntegrationSettings | null;
  chatwootInsights: ChatwootInsights | null;
  addManager: (manager: Omit<Manager, 'id' | 'created_at'>) => Promise<void>;
  updateManager: (id: string, updates: Partial<Manager>) => Promise<void>;
  deleteManager: (id: string) => Promise<void>;
  addUnit: (name: string, chatwoot_inbox_id?: number) => Promise<void>;
  updateUnit: (id: string, updates: Partial<Unit>) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'last_message_at'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  saveLeadAudit: (id: string, score: number | null, summary: string, checklist: Record<string, boolean>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  deleteLeads: (ids: string[]) => Promise<void>;
  moveLeadStage: (id: string, stage: FunnelStage) => Promise<void>;
  isTvMode: boolean;
  setIsTvMode: (val: boolean) => void;
  updateAiSettings: (updates: Partial<AiSettings>) => Promise<void>;
  updateIntegrationSettings: (updates: Partial<IntegrationSettings> & { business_hours?: any }) => Promise<void>;
  businessHours: BusinessHoursConfig;
  isLoading: boolean;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings | null>(null);
  const [chatwootInsights, setChatwootInsights] = useState<ChatwootInsights | null>(null);
  const [isTvMode, setIsTvMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchInitialData();

    // Subscribe to realtime changes
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (!(payload.new.audit_checklist as any)?.is_deleted) {
            setLeads(prev => [...prev, payload.new as Lead]);
          }
        } else if (payload.eventType === 'UPDATE') {
          if ((payload.new.audit_checklist as any)?.is_deleted) {
            setLeads(prev => prev.filter(l => l.id !== payload.new.id));
          } else {
            setLeads(prev => prev.map(l => l.id === payload.new.id ? { ...l, ...payload.new } as Lead : l));
          }
        } else if (payload.eventType === 'DELETE') {
          setLeads(prev => prev.filter(l => l.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'managers' }, (payload) => {
        if (payload.eventType === 'INSERT') setManagers(prev => [...prev, payload.new as Manager]);
        if (payload.eventType === 'UPDATE') setManagers(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } as Manager : m));
        if (payload.eventType === 'DELETE') setManagers(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, (payload) => {
        if (payload.eventType === 'INSERT') setUnits(prev => [...prev, payload.new as Unit]);
        if (payload.eventType === 'UPDATE') setUnits(prev => prev.map(u => u.id === payload.new.id ? { ...u, ...payload.new } as Unit : u));
        if (payload.eventType === 'DELETE') setUnits(prev => prev.filter(u => u.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_settings' }, (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') setAiSettings(payload.new as AiSettings);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'integration_settings' }, (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') setIntegrationSettings(payload.new as IntegrationSettings);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chatwoot_insights' }, (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          if (payload.new.type === 'account') setChatwootInsights(payload.new as ChatwootInsights);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchInitialData = async () => {
    const managersRes = await (supabase as any).from('managers').select('*').order('name');
    const allManagers = managersRes.data as Manager[] || [];
    
    // Determine if current user is a unit manager
    const currentManager = allManagers.find(m => m.auth_user_id === user?.id);
    const isUnitManager = user?.user_metadata?.role === 'unit_manager' || !!currentManager;

    let leadsRes;
    let unitsRes;

    const leadsColumns = 'id, customer_name, customer_phone, customer_vehicle, unit_id, manager_id, last_message_at, funnel_stage, score, wait_time_minutes, sla_status, ticket_value, closing_summary, created_at, audit_checklist';

    if (isUnitManager && currentManager) {
      leadsRes = await (supabase as any).from('leads').select(leadsColumns).eq('manager_id', currentManager.id).order('created_at', { ascending: false });
      unitsRes = await (supabase as any).from('units').select('*').eq('id', currentManager.unit_id).order('name');
    } else {
      leadsRes = await (supabase as any).from('leads').select(leadsColumns).order('created_at', { ascending: false });
      unitsRes = await (supabase as any).from('units').select('*').order('name');
    }

    const aiRes = await (supabase as any).from('ai_settings').select('*').maybeSingle();
    const intRes = await (supabase as any).from('integration_settings').select('*').maybeSingle();
    const insightsRes = await (supabase as any).from('chatwoot_insights').select('*').eq('type', 'account').maybeSingle();

    if (leadsRes.data) {
      const validLeads = (leadsRes.data as Lead[]).filter(l => !(l.audit_checklist as any)?.is_deleted);
      setLeads(validLeads);
    }
    setManagers(allManagers);
    if (unitsRes.data) setUnits(unitsRes.data as Unit[]);
    if (aiRes.data) setAiSettings(aiRes.data as AiSettings);
    if (intRes.data) setIntegrationSettings(intRes.data as IntegrationSettings);
    
    setIsLoading(false);
  };

  const addManager = async (manager: Omit<Manager, 'id' | 'created_at'>) => {
    const newManager = { ...manager, id: crypto.randomUUID(), created_at: new Date().toISOString() } as Manager;
    setManagers(prev => [...prev, newManager]);
    await (supabase as any).from('managers').insert([newManager]);
  };

  const updateManager = async (id: string, updates: Partial<Manager>) => {
    setManagers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    await (supabase as any).from('managers').update(updates).eq('id', id);
  };

  const deleteManager = async (id: string) => {
    setManagers(prev => prev.filter(m => m.id !== id));
    await (supabase as any).from('leads').update({ manager_id: null }).eq('manager_id', id);
    await (supabase as any).from('managers').delete().eq('id', id);
  };

  const addUnit = async (name: string, chatwoot_inbox_id?: number) => {
    const id = crypto.randomUUID();
    const newUnit = { id, name, chatwoot_inbox_id } as Unit;
    setUnits(prev => [...prev, newUnit]);
    await (supabase as any).from('units').insert([newUnit]);
  };

  const updateUnit = async (id: string, updates: Partial<Unit>) => {
    setUnits(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    await (supabase as any).from('units').update(updates).eq('id', id);
  };

  const deleteUnit = async (id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    
    // Find all leads for this unit to cascade delete chat_messages
    const { data: unitLeads } = await (supabase as any).from('leads').select('id').eq('unit_id', id);
    if (unitLeads && unitLeads.length > 0) {
      const leadIds = unitLeads.map((l: any) => l.id);
      await (supabase as any).from('chat_messages').delete().in('lead_id', leadIds);
      await (supabase as any).from('leads').delete().in('id', leadIds);
    }
    
    await (supabase as any).from('managers').delete().eq('unit_id', id);
    await (supabase as any).from('units').delete().eq('id', id);
  };

  const addLead = async (lead: Omit<Lead, 'id' | 'created_at' | 'last_message_at'>) => {
    const newLead = {
      ...lead,
      id: crypto.randomUUID(),
      last_message_at: new Date().toISOString()
    };
    await (supabase as any).from('leads').insert([newLead]);
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    console.log('Sending update to Supabase:', updates);
    
    // OPTIMISTIC UPDATE: Atualiza a UI na hora
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    
    const { data, error } = await (supabase as any).from('leads').update(updates).eq('id', id).select();
    console.log('Supabase update response:', { data, error });
    if (error) {
      console.error('Error updating lead:', error);
      alert('Erro ao salvar no banco: ' + error.message);
      return;
    }
  };

  const saveLeadAudit = async (id: string, score: number | null, summary: string, checklist: Record<string, boolean>) => {
    
    const etapa_scores: Record<string, number> = {};
    const auditStepsConfig = [
      { id: 'e1', items: ['1a', '1b'] },
      { id: 'e2', items: ['2a', '2b', '2c'] },
      { id: 'e3', items: ['3a', '3b', '3c'] },
      { id: 'e4', items: ['4a', '4b'] },
    ];
    
    auditStepsConfig.forEach(step => {
      const done = step.items.filter(i => checklist[i]).length;
      etapa_scores[step.id] = Math.round((done / step.items.length) * 100);
    });

    // OPTIMISTIC UPDATE: Atualiza a UI na hora, sem depender do Realtime ou Cache
    setLeads(prev => prev.map(l => l.id === id ? { 
      ...l, 
      score, 
      closing_summary: summary, 
      audit_checklist: checklist,
      etapa_scores 
    } as any : l));

    const { error } = await (supabase as any).from('leads').update({
      score: score,
      closing_summary: summary,
      audit_checklist: checklist,
      etapa_scores: etapa_scores
    }).eq('id', id);
    
    if (error) {
      console.error('Error saving lead audit via RPC:', error);
      alert('Erro crítico ao salvar auditoria: ' + error.message);
      return;
    }

    // Apenas insere na timeline de chat se o RPC foi salvo com sucesso no banco.
    await (supabase as any).from('chat_messages').insert([{
      lead_id: id,
      content: score !== null ? `Auditado e pontuado: ${score}%` : `Vistoria pausada: ${summary}`,
      sender_type: 'system',
    }]);
  };

  const deleteLead = async (id: string) => {
    await deleteLeads([id]);
  };
  const deleteLeads = async (ids: string[]) => {
    // 1. Apply "ignorar" label on Chatwoot for each lead with a conversation_id
    //    so the webhook ignores any future messages from those conversations.
    try {
      const leadsToLabel = leads.filter(l => ids.includes(l.id) && (l as any).chatwoot_conversation_id);
      
      await Promise.allSettled(leadsToLabel.map(l =>
        supabase.functions.invoke('chatwoot-action', {
          body: {
            action: 'add_labels',
            conversation_id: (l as any).chatwoot_conversation_id,
            labels: ['ignorar']
          }
        })
      ));
    } catch (e) {
      console.warn('[deleteLeads] Failed to apply Chatwoot label:', e);
    }

    // 2. Optimistic update + "soft delete" from DB using audit_checklist
    setLeads(prev => prev.filter(l => !ids.includes(l.id)));
    // We update audit_checklist to contain is_deleted: true.
    // Since we can't easily jsonb_set with Supabase JS update without overwriting,
    // we fetch current checklist and merge it for each lead to be safe.
    
    for (const id of ids) {
      const lead = leads.find(l => l.id === id);
      if (lead) {
        const currentChecklist = lead.audit_checklist as Record<string, any> || {};
        await (supabase as any).from('leads').update({
          audit_checklist: { ...currentChecklist, is_deleted: true }
        }).eq('id', id);
      }
    }
  };


  const moveLeadStage = async (id: string, stage: FunnelStage) => {
    // OPTIMISTIC UPDATE: atualiza a interface instantaneamente para o card não pular de volta
    setLeads(prev => prev.map(l => l.id === id ? { ...l, funnel_stage: stage } as Lead : l));

    await (supabase as any).from('leads').update({ funnel_stage: stage }).eq('id', id);
    const STAGE_LABELS: Record<string, string> = {
      lead_new: 'Novo Lead', quote: 'Em Orçamento', negotiation: 'Em Atendimento', closed_won: 'Encerrado', closed_lost: 'Perdido', parking_lot: 'Pausado (S/ Contexto)'
    };
    await (supabase as any).from('chat_messages').insert([{
      lead_id: id,
      content: `Movido para: ${STAGE_LABELS[stage] || stage}`,
      sender_type: 'system',
    }]);
  };

  const updateAiSettings = async (updates: Partial<AiSettings>) => {
    // Optimistic Update
    setAiSettings(prev => {
      if (prev) return { ...prev, ...updates };
      // Se não havia nada, criamos um mock pra UI responder imediatamente
      return { id: crypto.randomUUID(), ...updates } as AiSettings;
    });

    if (!aiSettings?.id) {
      // Create if doesn't exist
      const { data, error } = await (supabase as any).from('ai_settings').insert([updates]).select().single();
      if (!error && data) setAiSettings(data);
      return;
    }
    await (supabase as any).from('ai_settings').update(updates).eq('id', aiSettings.id);
  };

  const updateIntegrationSettings = async (updates: Partial<IntegrationSettings>) => {
    if (!integrationSettings?.id) {
      // Create if doesn't exist
      await (supabase as any).from('integration_settings').insert([updates]);
      return;
    }
    await (supabase as any).from('integration_settings').update(updates).eq('id', integrationSettings.id);
  };

  // Deriva businessHours do integrationSettings (com fallback seguro)
  const businessHours = useMemo<BusinessHoursConfig>(() => {
    const bh = (integrationSettings as any)?.business_hours;
    if (!bh) return DEFAULT_BUSINESS_HOURS;
    // Já no novo formato { schedule }
    if (bh.schedule && typeof bh.schedule === 'object') {
      return {
        schedule: bh.schedule,
        timezone: bh.timezone || DEFAULT_BUSINESS_HOURS.timezone,
      };
    }
    // Formato legado { days: number[], start, end, timezone }
    const days: number[] = Array.isArray(bh.days) ? bh.days : [1, 2, 3, 4, 5];
    const start: string = bh.start || '08:00';
    const end: string = bh.end || '18:00';
    const schedule: Record<number, { start: string; end: string }> = {};
    days.forEach((d) => { schedule[d] = { start, end }; });
    return {
      schedule,
      timezone: bh.timezone || DEFAULT_BUSINESS_HOURS.timezone,
    };
  }, [integrationSettings]);

  return (
    <AppDataContext.Provider value={{
      leads, managers, units, aiSettings, integrationSettings, chatwootInsights,
      addManager, updateManager, deleteManager,
      addUnit, updateUnit, deleteUnit,
      addLead,
      updateLead,
      saveLeadAudit,
      deleteLead,
      deleteLeads,
      moveLeadStage,
      isTvMode, setIsTvMode, updateAiSettings, updateIntegrationSettings,
      businessHours, isLoading
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within AppDataProvider');
  return context;
};
