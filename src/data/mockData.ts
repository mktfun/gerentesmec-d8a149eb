// ─── Types ────────────────────────────────────────────────────
export type Unit = {
  id: string;
  name: string;
  chatwoot_inbox_name: string; // Exatamente o nome do inbox no Chatwoot
  score: number;
  manager_id: string;
};

export type Manager = {
  id: string;
  name: string;
  unit_id: string;
  score: number;
  phone?: string;
};

export type FunnelStage = 'new' | 'quote' | 'negotiation' | 'closed_won' | 'closed_lost';
export type SlaStatus = 'ok' | 'warning' | 'danger';

export type Lead = {
  id: string;
  customer_name: string;
  customer_vehicle: string;
  customer_phone: string;
  manager_id: string;
  unit_id: string;
  funnel_stage: FunnelStage;
  wait_time_minutes: number;
  last_message_at: string;
  score: number | null;
  sla_status: SlaStatus;
};

// ─── Managers (1 per unit) ────────────────────────────────────
export const mockManagers: Manager[] = [
  { id: 'm1', name: 'Renato Silva',  unit_id: 'u1', score: 62.5, phone: '(11) 99001-0001' },
  { id: 'm2', name: 'Jorge Bereta',  unit_id: 'u2', score: 91.6, phone: '(11) 99001-0002' },
  { id: 'm3', name: 'Amanda Costa',  unit_id: 'u3', score: 75.0, phone: '(11) 99001-0003' },
];

// ─── Units (1:1 with managers, name = Chatwoot inbox name) ────
export const mockUnits: Unit[] = [
  { id: 'u1', name: 'Dom Pedro',  chatwoot_inbox_name: 'Dom Pedro',  score: 62.5, manager_id: 'm1' },
  { id: 'u2', name: 'Jabaquara',  chatwoot_inbox_name: 'Jabaquara',  score: 91.6, manager_id: 'm2' },
  { id: 'u3', name: 'Kennedy',    chatwoot_inbox_name: 'Kennedy',    score: 75.0, manager_id: 'm3' },
];

// ─── Leads (multiple per unit, across funnel stages) ──────────
export const mockLeads: Lead[] = [
  // Dom Pedro — Renato Silva
  {
    id: 'l1', customer_name: 'Paulo', customer_vehicle: 'BMW X1',
    customer_phone: '+55 11 9999-8888', manager_id: 'm1', unit_id: 'u1',
    funnel_stage: 'new', wait_time_minutes: 25, sla_status: 'danger',
    last_message_at: new Date(Date.now() - 25 * 60000).toISOString(), score: null,
  },
  {
    id: 'l2', customer_name: 'Juliana', customer_vehicle: 'Corolla',
    customer_phone: '+55 11 9444-3333', manager_id: 'm1', unit_id: 'u1',
    funnel_stage: 'quote', wait_time_minutes: 12, sla_status: 'warning',
    last_message_at: new Date(Date.now() - 12 * 60000).toISOString(), score: null,
  },
  {
    id: 'l3', customer_name: 'Carlos', customer_vehicle: 'Gol G7',
    customer_phone: '+55 11 9333-2222', manager_id: 'm1', unit_id: 'u1',
    funnel_stage: 'closed_lost', wait_time_minutes: 0, sla_status: 'ok',
    last_message_at: new Date(Date.now() - 300 * 60000).toISOString(), score: 50,
  },
  // Jabaquara — Jorge Bereta
  {
    id: 'l4', customer_name: 'Ana', customer_vehicle: 'Civic',
    customer_phone: '+55 11 9777-6666', manager_id: 'm2', unit_id: 'u2',
    funnel_stage: 'closed_won', wait_time_minutes: 0, sla_status: 'ok',
    last_message_at: new Date(Date.now() - 120 * 60000).toISOString(), score: 91.6,
  },
  {
    id: 'l5', customer_name: 'Roberto', customer_vehicle: 'Hilux',
    customer_phone: '+55 11 9555-4444', manager_id: 'm2', unit_id: 'u2',
    funnel_stage: 'negotiation', wait_time_minutes: 8, sla_status: 'ok',
    last_message_at: new Date(Date.now() - 8 * 60000).toISOString(), score: null,
  },
  {
    id: 'l6', customer_name: 'Marina', customer_vehicle: 'HRV',
    customer_phone: '+55 11 9666-5555', manager_id: 'm2', unit_id: 'u2',
    funnel_stage: 'new', wait_time_minutes: 4, sla_status: 'ok',
    last_message_at: new Date(Date.now() - 4 * 60000).toISOString(), score: null,
  },
  // Kennedy — Amanda Costa
  {
    id: 'l7', customer_name: 'Diego', customer_vehicle: 'Onix',
    customer_phone: '+55 11 9111-0000', manager_id: 'm3', unit_id: 'u3',
    funnel_stage: 'quote', wait_time_minutes: 6, sla_status: 'ok',
    last_message_at: new Date(Date.now() - 6 * 60000).toISOString(), score: null,
  },
  {
    id: 'l8', customer_name: 'Fernanda', customer_vehicle: 'Argo',
    customer_phone: '+55 11 9222-1111', manager_id: 'm3', unit_id: 'u3',
    funnel_stage: 'negotiation', wait_time_minutes: 22, sla_status: 'danger',
    last_message_at: new Date(Date.now() - 22 * 60000).toISOString(), score: null,
  },
  {
    id: 'l9', customer_name: 'Lucas', customer_vehicle: 'Creta',
    customer_phone: '+55 11 9333-2200', manager_id: 'm3', unit_id: 'u3',
    funnel_stage: 'closed_won', wait_time_minutes: 0, sla_status: 'ok',
    last_message_at: new Date(Date.now() - 180 * 60000).toISOString(), score: 75.0,
  },
];

// ─── Chart: 7-day score evolution (multi-line per unit) ───────
export const mockChartDataMultiline = [
  { day: 'Seg', dom_pedro: 55, jabaquara: 85, kennedy: 70 },
  { day: 'Ter', dom_pedro: 58, jabaquara: 88, kennedy: 68 },
  { day: 'Qua', dom_pedro: 60, jabaquara: 90, kennedy: 72 },
  { day: 'Qui', dom_pedro: 57, jabaquara: 87, kennedy: 74 },
  { day: 'Sex', dom_pedro: 63, jabaquara: 92, kennedy: 76 },
  { day: 'Sáb', dom_pedro: 61, jabaquara: 94, kennedy: 75 },
  { day: 'Dom', dom_pedro: 62, jabaquara: 91, kennedy: 75 },
];

// ─── Radar: step compliance per unit ──────────────────────────
export const mockRadarData = [
  { step: 'Cordialidade', dom_pedro: 85, jabaquara: 98, kennedy: 90 },
  { step: 'Orçamento',    dom_pedro: 70, jabaquara: 95, kennedy: 80 },
  { step: 'Up-sell',      dom_pedro: 28, jabaquara: 88, kennedy: 65 },
  { step: 'Review',       dom_pedro: 55, jabaquara: 90, kennedy: 70 },
];

// ─── Unit bar chart ───────────────────────────────────────────
export const mockUnitBarData = [
  { name: 'Jabaquara', score: 91.6 },
  { name: 'Kennedy',   score: 75.0 },
  { name: 'Dom Pedro', score: 62.5 },
];
