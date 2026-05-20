import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Phone, MapPin } from 'lucide-react';
import { useAppData, Manager } from '@/context/AppDataContext';

interface Props {
  manager?: Manager | null;
  isOpen: boolean;
  onClose: () => void;
}

const ManagerModalForm: React.FC<Props> = ({ manager, isOpen, onClose }) => {
  const { addManager, updateManager, units } = useAppData();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [unitId, setUnitId] = useState('');

  useEffect(() => {
    if (manager) {
      setName(manager.name);
      setPhone(manager.avatar || '');
      setUnitId(manager.unit_id);
    } else {
      setName('');
      setPhone('');
      setUnitId(units[0]?.id || '');
    }
  }, [manager, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manager) {
      updateManager(manager.id, { name, unit_id: unitId, avatar: phone || null });
    } else {
      addManager({
        name,
        unit_id: unitId || null,
        avatar: phone || null
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
            className="relative w-full max-w-md bg-[#111118] border border-white/[0.08] 
              rounded-3xl shadow-2xl overflow-hidden glass"
          >
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-lg font-black text-foreground">
                {manager ? 'Editar Gerente' : 'Novo Gerente'}
              </h2>
              <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-muted-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input required type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-[#0a0a0f] border border-white/[0.06] rounded-xl
                      text-sm text-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
                    placeholder="Ex: Carlos Silva" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Telefone / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-[#0a0a0f] border border-white/[0.06] rounded-xl
                      text-sm text-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
                    placeholder="(11) 90000-0000" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Unidade Responsável</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <select value={unitId} onChange={e => setUnitId(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-[#0a0a0f] border border-white/[0.06] rounded-xl
                      text-sm text-foreground focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none">
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-white/5 transition-colors">
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

export default ManagerModalForm;
