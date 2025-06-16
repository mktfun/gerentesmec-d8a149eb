
import { Calculator, Sparkles } from 'lucide-react';

export const Header = () => {
  return (
    <header 
      className="backdrop-blur-xl bg-white/70 border-b border-white/20 sticky top-0 z-50"
      data-state="false"
    >
      <div className="container mx-auto px-4 py-4 transition-all duration-300 ease-in-out">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-apple-blue-500 to-apple-blue-600 rounded-xl flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Flash Sim</h1>
              <p className="text-xs text-slate-500">by JJ & AMORIM</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-apple-blue-50 text-apple-blue-700 px-3 py-1.5 rounded-full text-sm">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">v1.0 Pro</span>
          </div>
        </div>
      </div>
    </header>
  );
};
