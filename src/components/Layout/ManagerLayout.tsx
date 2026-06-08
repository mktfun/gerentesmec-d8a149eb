import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Home, LogOut, Sun, Moon, ClipboardCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/context/ThemeContext';
import LumaBar from '../Navigation/LumaBar';

const ManagerLayout: React.FC = () => {
  const { user } = useAuth();
  const { managers } = useAppData();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const currentManager = managers.find(m => m.auth_user_id === user?.id);
  const displayName = currentManager?.name || user?.user_metadata?.name || 'Gerente';

  const lumaItems = [
    { id: 'home', icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/' },
    { id: 'history', icon: <ClipboardCheck className="w-5 h-5" />, label: 'Vistorias', path: '/historico-auditorias' },
    { id: 'theme', icon: isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />, label: 'Tema', onClick: toggle },
    { id: 'logout', icon: <LogOut className="w-5 h-5" />, label: 'Sair', onClick: () => supabase.auth.signOut() }
  ];

  return (
    <div className={`min-h-screen flex flex-col font-instrument ${isDark ? 'bg-[#212529] text-white' : 'bg-[#f5f6f7] text-[#212529]'}`}>
      {/* Page content: max-width centered, padding bottom to account for bottom nav */}
      <main className="flex-1 w-full max-w-2xl mx-auto overflow-x-hidden pb-28">
        <Outlet />
      </main>

      {/* Floating Bottom Navigation (LumaBar) */}
      <LumaBar items={lumaItems} />
    </div>
  );
};

export default ManagerLayout;
