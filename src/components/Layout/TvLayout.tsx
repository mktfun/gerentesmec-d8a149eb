import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const TvLayout = () => {
  // Anti-Logout / Keep-Alive para navegadores de TV
  // Navegadores de Smart TVs podem matar os timers internos do Supabase (autoRefreshToken)
  // Forçamos uma checagem de sessão periódica para manter a TV sempre logada.
  useEffect(() => {
    const keepAlive = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (data.session) {
          // Se estiver próximo de expirar, o getSession ou refreshSession renova
          await supabase.auth.refreshSession();
        }
      } catch (err) {
        console.warn('TV Keep-Alive erro:', err);
      }
    };

    // Roda a cada 4 minutos (240000ms)
    const intervalId = setInterval(keepAlive, 240000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden selection:bg-indigo-500/30">
      <Outlet />
    </div>
  );
};

export default TvLayout;
