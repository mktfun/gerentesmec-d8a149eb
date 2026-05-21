import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type Lead = Database['public']['Tables']['leads']['Row'];
export type Manager = Database['public']['Tables']['managers']['Row'];
export type Unit = Database['public']['Tables']['units']['Row'];
export type AiSettings = Database['public']['Tables']['ai_settings']['Row'];
export type IntegrationSettings = Database['public']['Tables']['integration_settings']['Row'];

export type FunnelStage = Lead['funnel_stage'];

interface AppDataContextType {
  leads: Lead[];
  managers: Manager[];
  units: Unit[];
  aiSettings: AiSettings | null;
  integrationSettings: IntegrationSettings | null;
  addManager: (manager: Omit<Manager, 'id' | 'created_at'>) => Promise<void>;
  updateManager: (id: string, updates: Partial<Manager>) => Promise<void>;
  deleteManager: (id: string) => Promise<void>;
  addUnit: (name: string, chatwoot_inbox_id?: number) => Promise<void>;
  updateUnit: (id: string, updates: Partial<Unit>) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'last_message_at'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  moveLeadStage: (id: string, stage: FunnelStage) => Promise<void>;
  isTvMode: boolean;
  setIsTvMode: (val: boolean) => void;
  updateAiSettings: (updates: Partial<AiSettings>) => Promise<void>;
  updateIntegrationSettings: (updates: Partial<IntegrationSettings>) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings | null>(null);
  const [isTvMode, setIsTvMode] = useState(false);

  useEffect(() => {
    fetchInitialData();

    // Subscribe to realtime changes
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLeads(prev => [...prev, payload.new as Lead]);
        } else if (payload.eventType === 'UPDATE') {
          setLeads(prev => prev.map(l => l.id === payload.new.id ? payload.new as Lead : l));
        } else if (payload.eventType === 'DELETE') {
          setLeads(prev => prev.filter(l => l.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'managers' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setManagers(prev => [...prev, payload.new as Manager]);
        } else if (payload.eventType === 'UPDATE') {
          setManagers(prev => prev.map(m => m.id === payload.new.id ? payload.new as Manager : m));
        } else if (payload.eventType === 'DELETE') {
          setManagers(prev => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setUnits(prev => [...prev, payload.new as Unit]);
        } else if (payload.eventType === 'UPDATE') {
          setUnits(prev => prev.map(u => u.id === payload.new.id ? payload.new as Unit : u));
        } else if (payload.eventType === 'DELETE') {
          setUnits(prev => prev.filter(u => u.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_settings' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setAiSettings(payload.new as AiSettings);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'integration_settings' }, (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          setIntegrationSettings(payload.new as IntegrationSettings);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInitialData = async () => {
    const leadsRes = await (supabase as any).from('leads').select('*');
    const managersRes = await (supabase as any).from('managers').select('*');
    const unitsRes = await (supabase as any).from('units').select('*');
    const aiRes = await (supabase as any).from('ai_settings').select('*').maybeSingle();
    const intRes = await (supabase as any).from('integration_settings').select('*').maybeSingle();

    if (leadsRes.data) setLeads(leadsRes.data as Lead[]);
    if (managersRes.data) setManagers(managersRes.data as Manager[]);
    if (unitsRes.data) setUnits(unitsRes.data as Unit[]);
    if (aiRes.data) setAiSettings(aiRes.data as AiSettings);
    if (intRes.data) setIntegrationSettings(intRes.data as IntegrationSettings);
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
    await (supabase as any).from('leads').update(updates).eq('id', id);
  };

  const moveLeadStage = async (id: string, stage: FunnelStage) => {
    await (supabase as any).from('leads').update({ funnel_stage: stage }).eq('id', id);
  };

  const updateAiSettings = async (updates: Partial<AiSettings>) => {
    if (!aiSettings?.id) return;
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

  return (
    <AppDataContext.Provider value={{
      leads, managers, units, aiSettings, integrationSettings,
      addManager, updateManager, deleteManager,
      addUnit, updateUnit, deleteUnit,
      addLead, updateLead, moveLeadStage,
      isTvMode, setIsTvMode, updateAiSettings, updateIntegrationSettings
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
