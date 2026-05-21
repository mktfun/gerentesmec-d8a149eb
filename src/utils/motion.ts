/**
 * motion.ts
 * 
 * Variantes de animação estáveis para Framer Motion.
 * 
 * Por que `whileInView + once: true` em vez de `initial/animate`?
 * Com `initial/animate`, toda vez que o componente pai re-renderiza
 * (ex: Realtime do Supabase atualiza leads), o Framer Motion reseta
 * os props e reproduz a animação de entrada — causando o "flash/glitch".
 * 
 * Com `whileInView + viewport: { once: true }`, a animação dispara
 * apenas uma vez quando o elemento entra na tela pela primeira vez.
 */

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-20px' },
  transition: { type: 'spring' as const, stiffness: 280, damping: 26, delay },
});

/** Para elementos que saem e entram via AnimatePresence (key-based) */
export const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, delay },
});

/** Slide-in lateral (painéis, drawers) */
export const slideInRight = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
  transition: { type: 'spring' as const, stiffness: 300, damping: 28 },
};
