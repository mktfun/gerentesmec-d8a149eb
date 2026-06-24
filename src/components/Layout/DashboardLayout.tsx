import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, Users, Sun, Moon, Wrench, Settings, BarChart3, Tv, BookOpen, LogOut, ClipboardCheck, ChevronLeft, ChevronRight, History
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAppData } from '@/context/AppDataContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { calculateDangerLeads } from '@/utils/metrics';
import { supabase } from '@/integrations/supabase/client';
import LumaBar from '../Navigation/LumaBar';

const navItems = [
  { to: '/',         label: 'Dashboard',      icon: LayoutDashboard, end: true },
  { to: '/crm',      label: 'CRM / Auditoria', icon: MessageSquare },
  { to: '/relatorios',label: 'Relatórios',     icon: BarChart3 },
  { to: '/gerentes', label: 'Gerentes',        icon: Users },
  { to: '/config',   label: 'Configurações',   icon: Settings },
];

const DashboardLayout: React.FC = () => {
  const { isDark, toggle } = useTheme();
  const { user } = useAuth();
  const { isTvMode, setIsTvMode, leads, businessHours, managers } = useAppData();
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });


  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };
  
  const location = useLocation();
  const isHome = location.pathname === '/';

  React.useEffect(() => {
    if (isHome) {
      setIsCollapsed(true);
    }
  }, [isHome]);

  const isUnitManager = user?.user_metadata?.role === 'unit_manager' || managers.some(m => m.auth_user_id === user?.id);

  const dangerCount = React.useMemo(() => {
    return leads ? calculateDangerLeads(leads, businessHours).length : 0;
  }, [leads, businessHours]);

  const enterTvMode = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    setIsTvMode(true);
  };

  return (
    <div className={`min-h-screen flex text-foreground ${isTvMode ? 'bg-background overflow-hidden' : 'bg-background'}`}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      {!isTvMode && (
        <aside className={`${isCollapsed ? 'w-[72px]' : 'w-[220px]'} shrink-0 fixed inset-y-0 left-0 z-20 hidden md:flex flex-col
          bg-sidebar border-r border-sidebar-border transition-all duration-300`}>

        {/* Logo */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-2.5 px-5'} border-b border-sidebar-border transition-all`}>
          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4 text-primary" />
          </div>
          {!isCollapsed && (
            <span className="font-black text-base text-sidebar-foreground tracking-tight whitespace-nowrap">
              GerentesMec
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-1 overflow-x-hidden">
          {!isCollapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/30 whitespace-nowrap">
              Menu
            </p>
          )}
          {navItems.map(({ to, label, icon: Icon, end }) => {
            if (isUnitManager && (to === '/config' || to === '/gerentes')) return null;
            return (
              <NavLink
                key={to}
                to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-semibold
                 transition-all duration-200 focus-visible:outline-primary relative group
                 ${isActive
                   ? isCollapsed ? 'bg-primary/15 text-primary' : 'bg-primary/15 text-primary border-l-2 border-primary pl-[10px]'
                   : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                 }`
              }
              title={isCollapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="flex-1 text-left whitespace-nowrap">{label}</span>}
              {to === '/crm' && dangerCount > 0 && (
                <span className={`flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-[10px] font-black text-rose-500 shrink-0 ${isCollapsed ? 'absolute -top-1 -right-1 min-w-4 h-4 rounded-full' : 'min-w-5 h-5 px-1.5 rounded-md'}`}>
                  {dangerCount}
                </span>
              )}
            </NavLink>
            );
          })}
          <NavLink
            to="/auditoria"
            className={({ isActive }) => `flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-xl text-sm font-semibold transition-all duration-300 group relative
              ${isActive 
                ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]' 
                : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent'}`}
            title={isCollapsed ? 'Auditoria Presencial' : undefined}
          >
            <ClipboardCheck className="w-4 h-4 transition-transform group-hover:scale-110 shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Auditoria Presencial</span>}
          </NavLink>
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <NavLink
            to="/apresentacao"
            className={({ isActive }) =>
              `w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-semibold transition-colors
               ${isActive ? 'bg-primary/15 text-primary' : 'text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent'}`
            }
            title={isCollapsed ? 'Como Funciona' : undefined}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Como Funciona</span>}
          </NavLink>

          <button onClick={async () => await supabase.auth.signOut()} className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-semibold text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/10 transition-colors`} title={isCollapsed ? 'Sair do IA' : undefined}>
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Sair do IA</span>}
          </button>
          
          <button onClick={toggleSidebar} className={`w-full flex items-center justify-center py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors mt-2`}>
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
      )}

      {/* ── Main ──────────────────────────────────────────────── */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ${isTvMode ? 'h-screen w-full' : (isCollapsed ? 'md:ml-[72px]' : 'md:ml-[220px]') + ' min-h-screen pb-24 md:pb-0'}`}>

        {/* Topbar */}
        {!isTvMode && (
          <header className="h-auto min-h-16 py-3 md:py-0 sticky top-0 z-50 flex flex-col md:flex-row md:items-center justify-between px-4 md:px-8 gap-4 md:gap-0
            bg-background/80 backdrop-blur-xl border-b border-border">
          <div>
            <h2 className="text-lg md:text-xl font-black text-foreground">
              Olá, {isUnitManager ? (user?.user_metadata?.name || 'Gerente') : 'Administrador'} 👋
            </h2>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {!isUnitManager && (
              <div className="flex items-center gap-2 mr-2">
                <NavLink to="/tv/executivo" className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-colors text-xs font-bold border border-indigo-500/20 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5" />
                  TV Executiva
                </NavLink>
                <NavLink to="/tv/operacional" className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5" />
                  TV Operacional
                </NavLink>
              </div>
            )}
            <button onClick={toggle} className="w-8 h-8 mr-2 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="h-6 w-px bg-border mr-2" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
              bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Ao vivo</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center
              font-black text-sm text-white ring-2 ring-primary/30">
              DS
            </div>
            </div>
          </header>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>

      {/* LumaBar for Mobile (Dashboard) */}
      {!isTvMode && (
        <LumaBar
          className="md:hidden"
          items={[
            { id: 'home', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/' },
            { id: 'crm', icon: <MessageSquare className="w-5 h-5" />, label: 'CRM', path: '/crm' },
            { id: 'auditoria', icon: <ClipboardCheck className="w-5 h-5" />, label: 'Nova Inspeção', path: '/auditoria' },
            { id: 'historico-auditorias', icon: <History className="w-5 h-5" />, label: 'Histórico', path: '/historico-auditorias' },
            { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Config', path: '/config' },
          ].filter(item => {
            // Se for gerente, esconde Config (e no DashboardLayout não acessam Gerentes mesmo no nav)
            if (isUnitManager && item.id === 'settings') return false;
            return true;
          })}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
