import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { mockLeads, mockManagers, mockUnits } from '@/data/mockData';
import AuditPanel from '@/components/Crm/AuditPanel';

const Crm = () => {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  
  const selectedLead = mockLeads.find(l => l.id === selectedLeadId) || null;

  return (
    <div className="h-full flex gap-6">
      {/* Left Column: Leads List */}
      <div className={`flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 ${selectedLeadId ? 'lg:w-1/3 flex-none' : 'w-full'}`}>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Inbox de Auditoria</h2>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar cliente, telefone ou gerente..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {mockLeads.map((lead) => {
            const manager = mockManagers.find(m => m.id === lead.manager_id);
            const unit = mockUnits.find(u => u.id === manager?.unit_id);
            const isDanger = lead.wait_time_minutes >= 20;
            const isSelected = selectedLeadId === lead.id;

            return (
              <div 
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-all duration-200 group flex items-start gap-4 ${
                  isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                      {lead.customer_name}
                    </h3>
                    {isDanger && (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        SLA Estourado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{lead.customer_phone}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-600 font-medium">{manager?.name}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">{unit?.name}</span>
                    <span className="text-slate-400">•</span>
                    <span className={`flex items-center gap-1 ${isDanger ? 'text-rose-500 font-medium' : 'text-slate-400'}`}>
                      <Clock className="w-3 h-3" />
                      {lead.wait_time_minutes} min
                    </span>
                  </div>
                </div>
                <div className="h-full flex items-center pt-2">
                  <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'}`} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right Column: Audit Panel (Drill-down) */}
      <AnimatePresence mode="wait">
        {selectedLead && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-w-[500px]"
          >
            <AuditPanel lead={selectedLead} onClose={() => setSelectedLeadId(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Crm;
