import React from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

export interface LumaBarItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  path?: string;
  onClick?: () => void;
}

interface LumaBarProps {
  items: LumaBarItem[];
  className?: string;
}

const LumaBar: React.FC<LumaBarProps> = ({ items, className = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Encontra o índice ativo com base na URL atual
  let activeIndex = items.findIndex((item) => item.path && location.pathname === item.path);
  // Se estiver numa subrota que não tem exact match, tenta fazer match parcial (opcional),
  // por enquanto vamos deixar 0 se não achar.
  if (activeIndex === -1) {
    // Tenta encontrar rotas "parent", por ex: /historico-auditorias/123 -> match /historico-auditorias
    activeIndex = items.findIndex((item) => item.path && item.path !== '/' && location.pathname.startsWith(item.path));
  }
  // Fallback pra home se nada der match
  if (activeIndex === -1) activeIndex = 0;

  const handleItemClick = (item: LumaBarItem, index: number) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <div className={`fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92vw] sm:w-auto max-w-[420px] sm:max-w-none ${className}`}>
      <div className="relative flex items-center justify-evenly sm:justify-center gap-1 sm:gap-4 md:gap-6 bg-white/40 dark:bg-black/40 backdrop-blur-3xl rounded-[2rem] sm:rounded-full px-2 sm:px-6 py-2 sm:py-3 shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden">
        
        {/* Active Indicator Glow */}
        <motion.div
          layoutId="active-indicator"
          className="absolute w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-400 to-primary rounded-full blur-[20px] -z-10"
          animate={{
            left: `calc(${activeIndex * (100 / items.length)}% + ${100 / items.length / 2}%)`,
            translateX: "-50%",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />

        {items.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <motion.div key={item.id} className="relative flex flex-col items-center justify-center group w-14 sm:w-16 shrink-0 h-14 sm:h-16">
              {/* Button */}
              <motion.button
                onClick={() => handleItemClick(item, index)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                animate={{ scale: isActive ? 1.15 : 1 }}
                className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 transition-colors relative z-10 
                  ${isActive 
                    ? 'text-primary-foreground dark:text-white drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]' 
                    : 'text-foreground/60 hover:text-foreground'
                  }`}
              >
                <div className="scale-90 sm:scale-100">{item.icon}</div>
              </motion.button>

              {/* Tooltip */}
              <span className="absolute bottom-full mb-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-popover text-popover-foreground shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {item.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LumaBar;
