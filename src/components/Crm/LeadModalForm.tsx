import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Car, DollarSign, MapPin } from 'lucide-react';
import { useAppData, Lead, FunnelStage } from '@/context/AppDataContext';

interface Props {
  lead?: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

const LeadModalForm: React.FC<Props> = ({ lead, isOpen, onClose }) => {
  const { addLead, updateLead, units, managers } = useAppData();

  const [name, setName] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [phone, setPhone] = useState('');
  const [unitId, setUnitId] = useState('');
  const [ticket, setTicket] = useState('');
  const [stage, setStage] = useState<FunnelStage>('lead_new');

  useEffect(() => {
    if (lead) {
      setName(lead.customer_name);
      setVehicle(lead.customer_vehicle);
      setPhone(lead.customer_phone);
      setUnitId(lead.unit_id);
      setTicket(lead.ticket_value ? String(lead.ticket_value) : '');
      setStage(lead.funnel_stage);
    } else {
      setName('');
      setVehicle('');
      setPhone('');
      setUnitId(units[0]?.id || '');
      setTicket('');
      setStage('lead_new');
    }
  }, [lead, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const unit = units.find(u => u.id === unitId);
    if (!unit) return;

    const tVal = ticket ? parseFloat(ticket) : null;
    const manager = managers.find(m => m.unit_id === unitId);
    const managerId = manager ? manager.id : null;

    if (lead) {
      updateLead(lead.id, {
        customer_name: name,
        customer_vehicle: vehicle,
        customer_phone: phone,
        unit_id: unitId,
        manager_id: managerId,
        ticket_value: tVal,
        funnel_stage: stage,
      });
    } else {
      addLead({
        customer_name: name,
        customer_vehicle: vehicle,
        customer_phone: phone,
        unit_id: unitId,
        manager_id: managerId,
        ticket_value: tVal,
        funnel_stage: stage,
        wait_time_minutes: 0,
        score: null,
        sla_status: 'ok',
        closing_summary: null
      });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-card border border-border 
              rounded-3xl shadow-2xl overflow-hidden glass"
          >
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-black text-foreground">
                {lead ? 'Editar Atendimento' : 'Novo Atendimento'}
              </h2>
              <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Nome do Cliente</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <input required type="text" value={name} onChange={e => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-indigo-500/50"
                      placeholder="Ex: Paulo" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Veículo</label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <input required type="text" value={vehicle} onChange={e => setVehicle(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-indigo-500/50"
                      placeholder="BMW X1" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Valor do Orçamento</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
                    <input type="number" value={ticket} onChange={e => setTicket(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-emerald-500/50"
                      placeholder="0.00" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Unidade Responsável</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <select value={unitId} onChange={e => setUnitId(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-indigo-500/50 appearance-none">
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Etapa no Funil</label>
                <select value={stage} onChange={e => setStage(e.target.value as FunnelStage)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-indigo-500/50 appearance-none">
                  <option value="lead_new">Novo Lead</option>
                  <option value="quote">Em Orçamento</option>
                  <option value="negotiation">Em Negociação</option>
                  <option value="closed_won">Encerrado (Ganho)</option>
                  <option value="closed_lost">Encerrado (Perdido)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-indigo-500 text-white
                    hover:bg-indigo-600 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LeadModalForm;
