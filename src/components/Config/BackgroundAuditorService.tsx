import { useBackgroundAuditor } from '@/hooks/useBackgroundAuditor';

// Um componente invisível que mantém o loop vivo globalmente
export const BackgroundAuditorService = () => {
  useBackgroundAuditor();
  return null;
};
