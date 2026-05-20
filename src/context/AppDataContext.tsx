import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type Lead = Database['public']['Tables']['leads']['Row'];
export type Manager = Database['public']['Tables']['managers']['Row'];
export type Unit = Database['public']['Tables']['units']['Row'];
export type AiSettings = Database['public']['Tables']['ai_settings']['Row'];

export type FunnelStage = Lead['funnel_stage'];

interface AppDataContextType {
  leads: Lead[];
  managers: Manager[];
  units: Unit[];
  aiSettings: AiSettings | null;
  addManager: (manager: Omit<Manager, 'id' | 'created_at'>) => Promise<void>;
  updateManager: (id: string, updates: Partial<Manager>) => Promise<void>;
  deleteManager: (id: string) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'last_message_at'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  moveLeadStage: (id: string, stage: FunnelStage) => Promise<void>;
  isTvMode: boolean;
  setIsTvMode: (val: boolean) => void;
  updateAiSettings: (updates: Partial<AiSettings>) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_settings' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setAiSettings(payload.new as AiSettings);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInitialData = async () => {
    const [leadsRes, managersRes, unitsRes, aiRes] = await Promise.all([
      supabase.from('leads').select('*'),
      supabase.from('managers').select('*'),
      supabase.from('units').select('*'),
      supabase.from('ai_settings').select('*').single()
    ]);

    if (leadsRes.data) setLeads(leadsRes.data);
    if (managersRes.data) setManagers(managersRes.data);
    if (unitsRes.data) setUnits(unitsRes.data);
    if (aiRes.data) setAiSettings(aiRes.data);
  };

  const addManager = async (manager: Omit<Manager, 'id' | 'created_at'>) => {
    await supabase.from('managers').insert([manager]);
  };

  const updateManager = async (id: string, updates: Partial<Manager>) => {
    await supabase.from('managers').update(updates).eq('id', id);
  };

  const deleteManager = async (id: string) => {
    await supabase.from('managers').delete().eq('id', id);
  };

  const addLead = async (lead: Omit<Lead, 'id' | 'created_at' | 'last_message_at'>) => {
    const newLead = {
      ...lead,
      id: crypto.randomUUID(),
      last_message_at: new Date().toISOString()
    };
    await supabase.from('leads').insert([newLead]);
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    await supabase.from('leads').update(updates).eq('id', id);
  };

  const moveLeadStage = async (id: string, stage: FunnelStage) => {
    await supabase.from('leads').update({ funnel_stage: stage }).eq('id', id);
  };

  const updateAiSettings = async (updates: Partial<AiSettings>) => {
    if (!aiSettings?.id) return;
    await supabase.from('ai_settings').update(updates).eq('id', aiSettings.id);
  };

  return (
    <AppDataContext.Provider value={{
      leads, managers, units, aiSettings,
      addManager, updateManager, deleteManager,
      addLead, updateLead, moveLeadStage,
      isTvMode, setIsTvMode, updateAiSettings
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
