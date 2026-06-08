import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Home, LogOut, Sun, Moon, ClipboardCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/context/ThemeContext';

const ManagerLayout: React.FC = () => {
  const { user } = useAuth();
  const { managers } = useAppData();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const currentManager = managers.find(m => m.auth_user_id === user?.id);
  const displayName = currentManager?.name || user?.user_metadata?.name || 'Gerente';

  return (
    <div className={`min-h-screen flex flex-col font-instrument ${isDark ? 'bg-[#212529] text-white' : 'bg-[#f5f6f7] text-[#212529]'}`}>
      {/* Page content: max-width centered, padding bottom to account for bottom nav */}
      <main className="flex-1 w-full max-w-2xl mx-auto overflow-x-hidden pb-28">
        <Outlet />
      </main>

      {/* Floating Bottom Navigation (Pill) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className={`flex items-center gap-6 px-8 py-4 rounded-full shadow-2xl transition-all duration-300 ${isDark ? 'bg-white text-[#212529]' : 'bg-[#212529] text-white'}`}>
          <button 
            onClick={() => navigate('/')}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}
          >
            <Home className="w-6 h-6" />
          </button>

          <button 
            onClick={() => navigate('/checklist')}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}
          >
            <ClipboardCheck className="w-6 h-6" />
          </button>

          <button 
            onClick={toggle}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}
          >
            {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>

          <button
            onClick={() => supabase.auth.signOut()}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-rose-500/10 text-rose-600' : 'hover:bg-rose-500/20 text-rose-400'}`}
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagerLayout;
