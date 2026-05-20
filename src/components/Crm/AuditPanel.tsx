import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2, Circle, UploadCloud, Paperclip } from 'lucide-react';
import { Lead } from '@/data/mockData';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

interface AuditPanelProps {
  lead: Lead;
  onClose: () => void;
}

const auditStepsConfig = [
  {
    id: 'step1',
    title: '1. Cordialidade e Registro',
    items: [
      { id: '1a', text: 'Atendimento foi cordial?' },
      { id: '1b', text: 'Registrou acordo no WhatsApp?' },
    ],
    weight: 25
  },
  {
    id: 'step2',
    title: '2. Orçamento e Consequências',
    items: [
      { id: '2a', text: 'Enviou link do Orçamento?' },
      { id: '2b', text: 'Enviou vídeo do defeito?' },
      { id: '2c', text: 'Explicou os efeitos em texto?' },
    ],
    weight: 25
  },
  {
    id: 'step3',
    title: '3. Checklist Mecânico (Up-sell)',
    items: [
      { id: '3a', text: 'Fez o checklist complementar?' },
      { id: '3b', text: 'Enviou vídeo do up-sell?' },
      { id: '3c', text: 'Explicou o texto?' },
    ],
    weight: 25
  },
  {
    id: 'step4',
    title: '4. Encerramento e Review',
    items: [
      { id: '4a', text: 'Agradeceu pelo serviço?' },
      { id: '4b', text: 'Pediu avaliação no Google?' },
    ],
    weight: 25
  }
];

const AuditPanel: React.FC<AuditPanelProps> = ({ lead, onClose }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');

  // Auto-fill mock if closed
  useEffect(() => {
    if (lead.score !== null) {
      // simulate checking items
      setCheckedItems({
        '1a': true, '1b': true,
        '2a': true, '2b': true, '2c': true,
        '3a': true, '3b': true, '3c': false,
        '4a': true, '4b': true,
      });
    } else {
      setCheckedItems({});
    }
  }, [lead.id, lead.score]);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Calculate Fractional Score
  let score = 0;
  auditStepsConfig.forEach(step => {
    let checkedCount = 0;
    step.items.forEach(item => {
      if (checkedItems[item.id]) checkedCount++;
    });
    const stepScore = (checkedCount / step.items.length) * step.weight;
    score += stepScore;
  });

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Dossiê: {lead.customer_name}</h3>
          <p className="text-xs text-slate-500">{lead.customer_phone}</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Score Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-6">
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="none" />
            <motion.circle 
              cx="50" cy="50" r="40" 
              stroke="currentColor" 
              strokeWidth="8" 
              fill="none" 
              strokeLinecap="round"
              className={`${score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-blue-500' : 'text-rose-500'}`}
              initial={{ strokeDasharray: '0 251' }}
              animate={{ strokeDasharray: `${(score / 100) * 251} 251` }}
              transition={{ duration: 0.8 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-slate-800">
              {Math.round(score)}<span className="text-xs text-slate-500 font-medium">%</span>
            </span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-700">Qualidade de Atendimento</p>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            A nota é fracionada baseada nos itens exigidos. Marque o checklist de acordo com a transcrição.
          </p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* Accordion Checklist */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Auditoria (Checklist)</h4>
          <Accordion type="multiple" defaultValue={['step1', 'step2']} className="space-y-3">
            {auditStepsConfig.map((step) => {
              const checkedCount = step.items.filter(i => checkedItems[i.id]).length;
              const isFull = checkedCount === step.items.length;

              return (
                <AccordionItem value={step.id} key={step.id} className="border border-slate-100 rounded-xl px-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-sm">
                      {isFull ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300" />
                      )}
                      <span className="font-semibold text-slate-700">{step.title}</span>
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {checkedCount}/{step.items.length}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4">
                    <div className="space-y-3 pl-8">
                      {step.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 group">
                          <Checkbox 
                            id={item.id} 
                            checked={checkedItems[item.id] || false}
                            onCheckedChange={() => toggleItem(item.id)}
                            className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                          <label 
                            htmlFor={item.id}
                            className={`text-sm cursor-pointer transition-colors ${
                              checkedItems[item.id] ? 'text-slate-900 font-medium' : 'text-slate-600 group-hover:text-slate-800'
                            }`}
                          >
                            {item.text}
                          </label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>

        {/* Evidence Upload Area */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dossiê e Evidências</h4>
          <div className="space-y-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Digite anotações ou justificativas para a nota..."
              className="w-full h-24 p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
            
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Anexar Provas</p>
              <p className="text-xs text-slate-500 mt-1">Arraste imagens ou cole links (Ctrl+V)</p>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all hover:shadow-md flex justify-center items-center gap-2">
          Salvar Avaliação
        </button>
      </div>
    </div>
  );
};

export default AuditPanel;
