import { MessageSquare, Sparkles } from 'lucide-react';

export const Header = () => {
  return (
    <header 
      className="backdrop-blur-xl bg-white/70 border-b border-slate-100 sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Mecânica Popular</h1>
              <p className="text-xs text-slate-500">Playbook de Monitoramento de Atendimento</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">v1.2 Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
