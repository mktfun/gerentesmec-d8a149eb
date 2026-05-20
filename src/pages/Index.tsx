import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, AlertTriangle, TrendingUp, Medal } from 'lucide-react';
import { mockChartData, mockManagers, mockUnits } from '@/data/mockData';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, subtitle, icon: Icon, alert = false, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-shadow"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${alert ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <div>
      <h3 className="text-3xl font-black text-slate-800 mb-1">{value}</h3>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className={`text-xs mt-2 font-medium ${alert ? 'text-rose-500' : 'text-emerald-500'}`}>
        {subtitle}
      </p>
    </div>
  </motion.div>
);

const Index = () => {
  const sortedManagers = [...mockManagers].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Média Global da Rede" 
          value="78.5%" 
          subtitle="+2.5% desde a última semana" 
          icon={TrendingUp} 
          delay={0.1}
        />
        <StatCard 
          title="Atendimentos Hoje" 
          value="142" 
          subtitle="4 auditorias pendentes" 
          icon={Users} 
          delay={0.2}
        />
        <StatCard 
          title="Leads em Alerta (>20m)" 
          value="3" 
          subtitle="Ação imediata necessária" 
          icon={AlertTriangle} 
          alert 
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Evolução do Score Global</h3>
            <p className="text-sm text-slate-500">Média de pontuação das auditorias nos últimos 7 dias</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Ranking */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col"
        >
          <div className="mb-6 flex items-center gap-2">
            <Medal className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-slate-800">Ranking de Gerentes</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5">
            {sortedManagers.map((manager, idx) => (
              <div key={manager.id} className="group">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-400 w-4">{idx + 1}º</span>
                    <div>
                      <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                        {manager.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {mockUnits.find(u => u.id === manager.unit_id)?.name}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-800">{manager.score}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${manager.score}%` }}
                    transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                    className={`h-full rounded-full ${
                      manager.score >= 80 ? 'bg-emerald-500' : manager.score >= 60 ? 'bg-blue-500' : 'bg-rose-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
