import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Settings, LogOut, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-blue-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-10 shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-600">
            <Wrench className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tight">GerentesMec</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menu Principal</p>
          
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </NavLink>

          <NavLink 
            to="/crm" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <MessageSquare className="w-5 h-5" />
            CRM / Auditoria
          </NavLink>

          <NavLink 
            to="/gerentes" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200"
          >
            <Users className="w-5 h-5" />
            Gerentes
          </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200"
            onClick={() => navigate('/login')}
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Olá, Daniel</h2>
            <p className="text-xs text-slate-500 font-medium">Resumo operacional de hoje</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
              <Settings className="w-5 h-5 text-slate-600" />
            </button>
            <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              D
            </div>
          </div>
        </header>

        {/* Outlet for Pages */}
        <div className="flex-1 p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
