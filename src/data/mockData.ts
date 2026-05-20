export type Unit = {
  id: string;
  name: string;
  score: number;
};

export type Manager = {
  id: string;
  name: string;
  unit_id: string;
  score: number;
};

export type LeadStatus = 'waiting_reply' | 'in_progress' | 'closed';

export type Lead = {
  id: string;
  customer_name: string;
  customer_phone: string;
  manager_id: string;
  status: LeadStatus;
  wait_time_minutes: number;
  last_message_at: string;
  score: number | null;
};

// Mock Units
export const mockUnits: Unit[] = [
  { id: 'u1', name: 'Dom Pedro', score: 62.5 },
  { id: 'u2', name: 'Jabaquara', score: 87.5 },
  { id: 'u3', name: 'Kennedy', score: 75.0 },
];

// Mock Managers
export const mockManagers: Manager[] = [
  { id: 'm1', name: 'Renato Silva', unit_id: 'u1', score: 50.0 },
  { id: 'm2', name: 'Jorge Bereta', unit_id: 'u2', score: 95.0 },
  { id: 'm3', name: 'Amanda Costa', unit_id: 'u3', score: 75.0 },
  { id: 'm4', name: 'Carlos Santos', unit_id: 'u2', score: 80.0 },
  { id: 'm5', name: 'Marcos Souza', unit_id: 'u1', score: 75.0 },
];

// Mock Leads
export const mockLeads: Lead[] = [
  {
    id: 'l1',
    customer_name: 'Paulo (BMW)',
    customer_phone: '+55 11 9999-8888',
    manager_id: 'm1',
    status: 'waiting_reply',
    wait_time_minutes: 25,
    last_message_at: new Date(Date.now() - 25 * 60000).toISOString(),
    score: null,
  },
  {
    id: 'l2',
    customer_name: 'Ana (Civic)',
    customer_phone: '+55 11 9777-6666',
    manager_id: 'm2',
    status: 'closed',
    wait_time_minutes: 2,
    last_message_at: new Date(Date.now() - 120 * 60000).toISOString(),
    score: 91.6, // (2/2) + (3/3) + (2/3) + (2/2) = 11/12
  },
  {
    id: 'l3',
    customer_name: 'Roberto (Hilux)',
    customer_phone: '+55 11 9555-4444',
    manager_id: 'm3',
    status: 'in_progress',
    wait_time_minutes: 10,
    last_message_at: new Date(Date.now() - 10 * 60000).toISOString(),
    score: null,
  },
  {
    id: 'l4',
    customer_name: 'Juliana (Corolla)',
    customer_phone: '+55 11 9444-3333',
    manager_id: 'm1',
    status: 'waiting_reply',
    wait_time_minutes: 5,
    last_message_at: new Date(Date.now() - 5 * 60000).toISOString(),
    score: null,
  },
];

// Data for Chart
export const mockChartData = [
  { day: 'Seg', score: 65 },
  { day: 'Ter', score: 68 },
  { day: 'Qua', score: 75 },
  { day: 'Qui', score: 72 },
  { day: 'Sex', score: 85 },
  { day: 'Sáb', score: 80 },
  { day: 'Dom', score: 82 },
];
