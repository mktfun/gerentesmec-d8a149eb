import React, { createContext, useContext, useState } from 'react';
import { Manager, Lead, mockManagers, mockLeads, FunnelStage } from '@/data/mockData';

interface AppDataContextType {
  managers: Manager[];
  leads: Lead[];
  addManager: (m: Manager) => void;
  updateManager: (id: string, m: Partial<Manager>) => void;
  deleteManager: (id: string) => void;
  addLead: (l: Lead) => void;
  updateLead: (id: string, l: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  moveLeadStage: (id: string, stage: FunnelStage) => void;
  isTvMode: boolean;
  setIsTvMode: (val: boolean) => void;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
};

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [managers, setManagers] = useState<Manager[]>(mockManagers);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [isTvMode, setIsTvMode] = useState(false);

  const addManager = (m: Manager) => setManagers(prev => [...prev, m]);
  const updateManager = (id: string, update: Partial<Manager>) => {
    setManagers(prev => prev.map(m => m.id === id ? { ...m, ...update } : m));
  };
  const deleteManager = (id: string) => {
    setManagers(prev => prev.filter(m => m.id !== id));
  };

  const addLead = (l: Lead) => setLeads(prev => [...prev, l]);
  const updateLead = (id: string, update: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...update } : l));
  };
  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  };
  const moveLeadStage = (id: string, stage: FunnelStage) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, funnel_stage: stage } : l));
  };

  return (
    <AppDataContext.Provider value={{
      managers, leads,
      addManager, updateManager, deleteManager,
      addLead, updateLead, deleteLead, moveLeadStage,
      isTvMode, setIsTvMode
    }}>
      {children}
    </AppDataContext.Provider>
  );
};
