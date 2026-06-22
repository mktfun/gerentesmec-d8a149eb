import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Camera, AlertTriangle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  units: any[];
}

export default function TvOperationsView({ units }: Props) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [recentAnomalies, setRecentAnomalies] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      // Pega as últimas 30 checklists
      const { data } = await supabase
        .from('daily_store_checklists')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (!data) return;

      // Monta leaderboard de SLAs
      const lb = units.map(unit => {
        const lastChecklist = data.find(c => c.unit_id === unit.id);
        const now = new Date();
        const lastDate = lastChecklist ? new Date(lastChecklist.created_at) : null;
        
        let status = 'ok';
        let hoursSince = 999;
        
        if (lastDate) {
          hoursSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
          if (hoursSince > 48) status = 'critical';
          else if (hoursSince > 24) status = 'warning';
        } else {
          status = 'critical';
        }

        return {
          ...unit,
          lastChecklist,
          status,
          hoursSince,
          score: lastChecklist ? Math.round(lastChecklist.score || 0) : 0
        };
      }).sort((a, b) => b.score - a.score); // Ordena pela melhor nota primeiro
      
      setLeaderboard(lb);

      // Puxa as piores fotos (Anomalias)
      // O array de items tem { status: "not_ok", item_id, notes, evidences: ["url..."] }
      const anomalies: any[] = [];
      data.forEach(checklist => {
        if (checklist.items && Array.isArray(checklist.items)) {
          checklist.items.forEach(item => {
            if (item.status === 'not_ok' && item.evidences && item.evidences.length > 0) {
              const unit = units.find(u => u.id === checklist.unit_id);
              anomalies.push({
                id: Math.random().toString(),
                unitName: unit?.name || 'Desconhecida',
                phone: unit?.manager_phone || '5511999999999',
                photoUrl: item.evidences[0].includes('http') 
                  ? item.evidences[0] 
                  : `https://qtjitszradxsmnilnqtj.supabase.co/storage/v1/object/public/audits/${item.evidences[0]}`,
                itemName: item.item_name || 'Infraestrutura',
                notes: item.notes || 'Sem observações'
              });
            }
          });
        }
      });

      // Pega as últimas 4
      setRecentAnomalies(anomalies.slice(0, 4));
    }
    fetchData();
  }, [units]);

  return (
    <div className="h-full w-full flex bg-[#121214]">
      {/* Coluna Esquerda: Leaderboard & SLA */}
      <div className="w-[600px] border-r border-zinc-800 p-12 flex flex-col">
        <div className="flex items-center gap-4 mb-12">
          <AlertCircle className="w-12 h-12 text-indigo-500" />
          <h2 className="text-4xl font-black uppercase tracking-tight text-white">Conformidade</h2>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          {leaderboard.map((lb, idx) => (
            <div key={lb.id} className="bg-black/50 p-6 rounded-2xl border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-black text-white/30">#{idx + 1}</span>
                <h3 className="text-3xl font-bold text-white">{lb.name}</h3>
              </div>

              {lb.status === 'critical' ? (
                <div className="bg-rose-500/20 px-6 py-2 rounded-full border border-rose-500/30 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-rose-500 animate-pulse" />
                  <span className="text-rose-500 font-bold text-xl">SLA Estourado</span>
                </div>
              ) : lb.status === 'warning' ? (
                <div className="bg-amber-500/20 px-6 py-2 rounded-full border border-amber-500/30">
                  <span className="text-amber-500 font-bold text-xl">Atenção {'>'}24h</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-48 h-4 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${lb.score >= 90 ? 'bg-emerald-500' : lb.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${lb.score}%` }}
                    />
                  </div>
                  <span className="text-3xl font-black text-white w-20 text-right">{lb.score}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Coluna Direita: Parede de Imagens */}
      <div className="flex-1 p-12 flex flex-col">
        <div className="flex items-center gap-4 mb-8">
          <Camera className="w-10 h-10 text-white/40" />
          <h2 className="text-3xl font-bold text-white/40 uppercase tracking-widest">Mural "Não Conforme"</h2>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
          {recentAnomalies.length > 0 ? (
            recentAnomalies.map(ano => {
              const waText = encodeURIComponent(`Fala gerente, estou vendo aqui na tela a foto do ${ano.itemName} reprovado hoje. Qual a previsão de limpar/consertar isso?`);
              const waLink = `https://wa.me/${ano.phone.replace(/\D/g, '')}?text=${waText}`;

              return (
                <div key={ano.id} className="relative rounded-3xl overflow-hidden group border border-zinc-800 bg-zinc-900">
                  <img 
                    src={ano.photoUrl} 
                    alt={ano.itemName} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  
                  {/* Tarja Preta */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-8 pt-16 flex justify-between items-end">
                    <div className="flex-1 pr-6">
                      <h4 className="text-3xl font-black text-white mb-2">{ano.itemName} <span className="text-rose-500">• {ano.unitName}</span></h4>
                      <div className="bg-rose-500/20 border border-rose-500/30 p-3 rounded-lg inline-block">
                        <p className="text-xl text-rose-200">📝 {ano.notes}</p>
                      </div>
                    </div>
                    
                    {/* QR Code de Cobrança */}
                    <div className="bg-white p-3 rounded-xl shrink-0 flex flex-col items-center gap-2">
                      <QRCode value={waLink} size={80} level="M" />
                      <span className="text-black text-[10px] font-black uppercase">Cobrar</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
             <div className="col-span-2 flex flex-col items-center justify-center text-white/30 bg-zinc-900/50 rounded-[3rem] border border-zinc-800">
               <Camera className="w-24 h-24 mb-6 opacity-20" />
               <p className="text-4xl font-black">Nenhuma não-conformidade física registrada.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
