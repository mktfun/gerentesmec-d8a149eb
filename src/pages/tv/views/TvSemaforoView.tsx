import React, { useMemo } from 'react';
import { Trophy, Skull, Target } from 'lucide-react';
import { avgScore } from '@/utils/scoreUtils';

interface Props {
  leads: any[];
  units: any[];
}

export default function TvSemaforoView({ leads, units }: Props) {
  // Calcular ranking das lojas baseado no score
  const ranking = useMemo(() => {
    const scored = units.map(unit => {
      const unitLeads = leads.filter(l => l.unit_id === unit.id && l.score !== null);
      const score = avgScore(unitLeads);
      return {
        ...unit,
        score: score !== null ? Math.round(score) : 0,
        leadsCount: unitLeads.length
      };
    }).filter(u => u.leadsCount > 0).sort((a, b) => b.score - a.score);
    return scored;
  }, [leads, units]);

  const bestUnit = ranking.length > 0 ? ranking[0] : null;
  const worstLead = useMemo(() => {
    return leads
      .filter(l => l.score !== null && l.audit_checklist?.audit_reasons?.length > 0)
      .sort((a, b) => a.score - b.score)[0];
  }, [leads]);

  return (
    <div className="h-full w-full flex">
      {/* Lado Esquerdo: Semáforo */}
      <div className="flex-1 p-16 flex flex-col justify-center border-r border-zinc-800">
        <div className="flex items-center gap-6 mb-16">
          <Target className="w-16 h-16 text-indigo-500" />
          <h1 className="text-6xl font-black uppercase tracking-tighter">Ranking de Atendimento</h1>
        </div>

        <div className="flex flex-col gap-8">
          {ranking.slice(0, 7).map((unit, index) => {
            const isGreen = unit.score >= 80;
            const isYellow = unit.score >= 60 && unit.score < 80;
            const isRed = unit.score < 60;

            const icon = isGreen ? '🟢' : isYellow ? '🟡' : '🔴';
            const colorClass = isGreen ? 'text-emerald-400' : isYellow ? 'text-amber-400' : 'text-rose-400';
            const bgClass = isGreen ? 'bg-emerald-500/10 border-emerald-500/20' : isYellow ? 'bg-amber-500/10 border-amber-500/20' : 'bg-rose-500/10 border-rose-500/20';

            return (
              <div key={unit.id} className={`flex items-center justify-between p-8 rounded-3xl border ${bgClass}`}>
                <div className="flex items-center gap-8">
                  <span className="text-6xl">{icon}</span>
                  <div>
                    <h2 className="text-5xl font-black text-white">{unit.name}</h2>
                    <p className="text-2xl text-white/50 uppercase tracking-widest mt-2">
                      {isGreen ? 'Padrão Ouro' : isYellow ? 'Atenção Necessária' : 'Risco Crítico'} • {unit.leadsCount} Audits
                    </p>
                  </div>
                </div>
                <div className={`text-6xl font-black ${colorClass}`}>
                  {unit.score}/100
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lado Direito: O Extremo */}
      <div className="w-[600px] 2xl:w-[800px] p-16 flex flex-col gap-12 bg-black/50">
        <h2 className="text-4xl font-black uppercase tracking-widest text-white/30 mb-4">Os Extremos</h2>

        {/* Card Ouro */}
        <div className="flex-1 rounded-[3rem] bg-gradient-to-b from-amber-500/20 to-black border border-amber-500/30 p-10 flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <Trophy className="w-12 h-12 text-amber-500" />
            <h3 className="text-3xl font-black text-amber-500 uppercase">A Melhor Unidade</h3>
          </div>
          {bestUnit ? (
            <div className="flex-1 flex flex-col justify-center">
              <h4 className="text-6xl font-black text-white mb-4">{bestUnit.name}</h4>
              <p className="text-3xl text-amber-200/80 leading-relaxed">
                Atingiu o topo com <span className="text-amber-400 font-black">{bestUnit.score} pontos</span> de média. O atendimento de excelência está gerando resultados impressionantes.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/30 text-2xl">Sem dados suficientes</div>
          )}
        </div>

        {/* Card Trágico */}
        <div className="flex-1 rounded-[3rem] bg-gradient-to-b from-rose-950/40 to-black border border-rose-900/50 p-10 flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <Skull className="w-12 h-12 text-rose-500" />
            <h3 className="text-3xl font-black text-rose-500 uppercase">O Pior Atendimento</h3>
          </div>
          {worstLead ? (
            <div className="flex-1 flex flex-col justify-center">
              <h4 className="text-4xl font-black text-white mb-2">
                {units.find(u => u.id === worstLead.unit_id)?.name || 'Desconhecida'}
              </h4>
              <div className="inline-block bg-rose-500 text-white font-black text-2xl px-4 py-1 rounded-xl w-max mb-6">
                Score: {Math.round(worstLead.score)}
              </div>
              <div className="bg-rose-950/50 p-6 rounded-2xl border border-rose-900">
                <p className="text-2xl text-rose-200 italic">
                  "{worstLead.audit_checklist?.audit_reasons?.[0]?.evidence || 'Sem evidência registrada.'}"
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/30 text-2xl">Nenhum vacilo crítico encontrado.</div>
          )}
        </div>
      </div>
    </div>
  );
}
