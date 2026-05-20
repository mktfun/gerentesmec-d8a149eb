import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { Manager, mockUnits } from '@/data/mockData';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const mockHistory = [
  { week: 'S1', score: 65 }, { week: 'S2', score: 72 },
  { week: 'S3', score: 68 }, { week: 'S4', score: 80 },
];

interface Props {
  manager: Manager | null;
  onClose: () => void;
}

const ManagerModal: React.FC<Props> = ({ manager, onClose }) => {
  const unit = mockUnits.find(u => u.id === manager?.unit_id);

  return (
    <AnimatePresence>
      {manager && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed top-0 right-0 h-full w-full max-w-[420px] z-50
              bg-[#0f0f18] border-l border-white/[0.06] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 flex items-center justify-center
                  text-lg font-black text-indigo-300">
                  {manager.name[0]}
                </div>
                <div>
                  <p className="font-black text-foreground">{manager.name}</p>
                  <p className="text-xs text-muted-foreground">{unit?.name}</p>
                </div>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.10]
                  flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Score highlight */}
            <div className="px-6 py-5 border-b border-white/[0.06]">
              <p className="label-caps text-indigo-400/70 mb-2">Score Atual</p>
              <div className="flex items-end gap-3">
                <span className={`text-5xl font-black ${
                  manager.score >= 80 ? 'text-emerald-400' : manager.score >= 60 ? 'text-indigo-300' : 'text-rose-400'
                }`}>{manager.score}%</span>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400
                  bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full mb-1.5">
                  <TrendingUp className="w-3 h-3" />
                  +8% no mês
                </span>
              </div>
            </div>

            {/* History Chart */}
            <div className="px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Evolução (4 semanas)</p>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={mockHistory} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <XAxis dataKey="week" axisLine={false} tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} domain={[50, 100]}
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                    itemStyle={{ color: '#818cf8', fontWeight: 700 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5}
                    dot={{ fill: '#6366f1', r: 4, stroke: '#fff', strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1200}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Audits */}
            <div className="flex-1 px-6 py-5 overflow-y-auto">
              <p className="label-caps text-muted-foreground mb-3">Últimas Auditorias</p>
              <div className="space-y-2">
                {[
                  { date: 'Hoje, 14:22', client: 'Paulo (BMW)', score: 75 },
                  { date: 'Hoje, 11:04', client: 'Juliana (Corolla)', score: 100 },
                  { date: 'Ontem, 16:30', client: 'Rafael (Gol)', score: 50 },
                ].map((audit, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                    bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground/80 truncate">{audit.client}</p>
                      <p className="text-[10px] text-muted-foreground">{audit.date}</p>
                    </div>
                    <span className={`text-xs font-black ${
                      audit.score >= 75 ? 'text-emerald-400' : audit.score >= 50 ? 'text-amber-400' : 'text-rose-400'
                    }`}>{audit.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ManagerModal;
