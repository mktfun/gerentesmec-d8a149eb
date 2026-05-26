import React from 'react';
import { Outlet } from 'react-router-dom';
import { Wrench, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppData } from '@/context/AppDataContext';

const ManagerLayout: React.FC = () => {
  const { user } = useAuth();
  const { managers } = useAppData();

  const currentManager = managers.find(m => m.auth_user_id === user?.id);
  const displayName = currentManager?.name || user?.user_metadata?.name || 'Gerente';
  const initials = displayName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      {/* Compact Header */}
      <header className="h-14 sticky top-0 z-20 flex items-center justify-between px-4 border-b border-border bg-background/90 backdrop-blur-xl shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-black text-sm text-foreground tracking-tight">GerentesMec</span>
        </div>

        {/* Right: Avatar + Logout */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-1">
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-[10px] font-black text-primary">{initials}</span>
            </div>
            <span className="text-xs font-semibold text-foreground hidden sm:block truncate max-w-[120px]">
              {displayName}
            </span>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-rose-500/80 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Page content: max-width centered, scroll managed per-page */}
      <main className="flex-1 w-full max-w-2xl mx-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default ManagerLayout;
