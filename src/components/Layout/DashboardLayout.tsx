import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, Users, Sun, Moon, Wrench, Settings,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const navItems = [
  { to: '/',         label: 'Dashboard',      icon: LayoutDashboard, end: true },
  { to: '/crm',      label: 'CRM / Auditoria', icon: MessageSquare },
  { to: '/gerentes', label: 'Gerentes',        icon: Users },
  { to: '/config',   label: 'Configurações',   icon: Settings },
];

const DashboardLayout: React.FC = () => {
  const { isDark, toggle } = useTheme();

  return (
    <div className="min-h-screen flex bg-background text-foreground">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-[220px] shrink-0 fixed inset-y-0 left-0 z-20 flex flex-col
        bg-sidebar border-r border-sidebar-border">

        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-primary" />
          </div>
          <span className="font-black text-base text-sidebar-foreground tracking-tight">
            GerentesMec
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/30">
            Menu
          </p>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                 transition-all duration-200 focus-visible:outline-primary
                 ${isActive
                   ? 'bg-primary/15 text-primary border-l-2 border-primary pl-[10px]'
                   : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
              text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent
              transition-all duration-200 focus-visible:outline-primary"
          >
            <motion.div
              key={isDark ? 'moon' : 'sun'}
              initial={{ rotate: -30, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.div>
            {isDark ? 'Modo Claro' : 'Modo Escuro'}
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────── */}
      <main className="flex-1 ml-[220px] flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="h-16 sticky top-0 z-10 flex items-center justify-between px-8
          bg-background/90 backdrop-blur-xl border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">Olá, Daniel 👋</h2>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
              bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Ao vivo</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center
              font-black text-sm text-white ring-2 ring-primary/30">
              D
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
