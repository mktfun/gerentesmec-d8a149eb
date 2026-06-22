import React, { useMemo } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Lead, Unit } from '@/context/AppDataContext';

interface Props {
  leads: Lead[];
  units: Unit[];
}

export default function TvRadarView({ leads, units }: Props) {
  // Pega os piores leads (com score e audit_reasons)
  const radarLeads = useMemo(() => {
    return leads
      .filter(l => l.score !== null && l.audit_checklist?.audit_reasons?.length > 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 6); // Pega as piores 6 para caber na TV em grid de 3 ou 2
  }, [leads]);

  if (radarLeads.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-12">
        <div className="w-32 h-32 rounded-full bg-emerald-500/20 flex items-center justify-center mb-8">
          <span className="text-6xl">🏆</span>
        </div>
        <h1 className="text-6xl font-black mb-4">Radar Limpo!</h1>
        <p className="text-3xl text-emerald-400">Nenhum vacilo crítico auditado hoje na rede.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-12 flex flex-col">
      <div className="flex items-center gap-6 mb-12">
        <div className="bg-rose-500/20 p-4 rounded-2xl border border-rose-500/30">
          <AlertTriangle className="w-12 h-12 text-rose-500 animate-pulse" />
        </div>
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tight text-rose-50">RADAR DE VACILOS</h1>
          <p className="text-2xl text-rose-500/80 font-bold tracking-widest uppercase">Piores Atendimentos da Rede</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 2xl:grid-cols-3 gap-8 overflow-hidden">
        {radarLeads.map(lead => {
          const unit = units.find(u => u.id === lead.unit_id);
          const managerPhone = unit?.manager_phone || '5511999999999';
          const reason = lead.audit_checklist?.audit_reasons?.[0];
          
          const waText = encodeURIComponent(`Olá! Vi no painel um alerta sobre o lead ${lead.name || 'Cliente'} (Placa: ${lead.plate || 'N/D'}). A IA apontou: ${reason?.title}. O que aconteceu?`);
          const waLink = `https://wa.me/${managerPhone.replace(/\D/g, '')}?text=${waText}`;

          return (
            <div key={lead.id} className="bg-black/50 border border-zinc-800 rounded-[2rem] overflow-hidden flex flex-col relative h-full">
              {/* Header Vermelho */}
              <div className="bg-gradient-to-r from-rose-950/80 to-black/80 px-8 py-6 border-b border-rose-900/50 flex justify-between items-start">
                <div>
                  <h2 className="text-4xl font-black text-rose-100 uppercase leading-none tracking-tighter mb-2">
                    🚨 {unit?.name || 'Unidade'}
                  </h2>
                  <div className="flex items-center gap-2 text-rose-400/80 text-xl font-medium">
                    <Clock className="w-5 h-5" />
                    <span>{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR })}</span>
                  </div>
                </div>
                <div className="bg-rose-500 text-white font-black text-4xl px-4 py-2 rounded-xl">
                  {Math.round(lead.score)}
                </div>
              </div>

              {/* Corpo */}
              <div className="p-8 flex-1 flex flex-col gap-6">
                <p className="text-3xl font-bold text-white leading-tight">
                  {reason?.title || "Lead perdido por demora no atendimento."}
                </p>

                {/* Caixa de Citação */}
                {reason?.evidence && (
                  <div className="bg-zinc-900 border-l-8 border-rose-500 p-6 rounded-r-xl mt-auto">
                    <p className="text-2xl text-zinc-300 italic font-medium leading-relaxed">
                      "{reason.evidence}"
                    </p>
                  </div>
                )}
              </div>

              {/* Rodapé com Veredito e QR Code */}
              <div className="bg-zinc-950 p-8 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex-1 pr-8">
                  <span className="inline-block bg-rose-500/10 text-rose-400 text-xl font-bold px-4 py-2 rounded-lg border border-rose-500/20 mb-3">
                    Veredito da IA
                  </span>
                  <p className="text-2xl text-zinc-400 font-medium line-clamp-2">
                    {lead.audit_checklist?.closing_summary || "Omissão de informações críticas e tratamento inadequado."}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3 shrink-0 bg-white p-3 rounded-2xl">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${waLink}`} alt="QR Code" className="w-[100px] h-[100px]" />
                  <span className="text-black text-sm font-bold uppercase tracking-wider">Cobrar Agora</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
