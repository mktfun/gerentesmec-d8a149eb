import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Sun,
  Moon,
  Wrench,
} from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';

const navItems = [
  { to: '/',        label: 'Dashboard',     icon: LayoutDashboard, end: true },
  { to: '/crm',     label: 'CRM / Auditoria', icon: MessageSquare },
  { to: '/gerentes',label: 'Gerentes',       icon: Users },
];

const DashboardLayout: React.FC = () => {
  const { isDark, toggle } = useDarkMode();

  return (
    <div className="min-h-screen flex bg-background text-foreground font-[Plus_Jakarta_Sans,Inter,system-ui]">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-[220px] shrink-0 fixed inset-y-0 left-0 z-20 flex flex-col
        bg-[#0d0d14] dark:bg-[#0d0d14] border-r border-white/[0.06]">

        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="font-black text-base text-white tracking-tight">GerentesMec</span>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">Menu</p>

          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                 transition-all duration-200 group focus-visible:outline-indigo-500
                 ${isActive
                   ? 'bg-indigo-500/15 text-indigo-300 border-l-2 border-indigo-500 pl-[10px]'
                   : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer — Dark/Light Toggle */}
        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
              text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-200 focus-visible:outline-indigo-500"
          >
            <motion.div
              key={isDark ? 'moon' : 'sun'}
              initial={{ rotate: -30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.div>
            {isDark ? 'Modo Claro' : 'Modo Escuro'}
          </button>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────────────────────── */}
      <main className="flex-1 ml-[220px] flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="h-16 sticky top-0 z-10 flex items-center justify-between px-8
          bg-background/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-bold text-foreground">Olá, Daniel 👋</h2>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Pulse live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
              bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400">Ao vivo</span>
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center
              font-black text-sm text-white ring-2 ring-indigo-500/30">
              D
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
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
