import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Index = () => {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'david123') {
      navigate('/vault');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
      <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-sm border border-slate-100 text-center">
        <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-5 h-5 text-slate-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Mecânica Popular</h1>
        <p className="text-sm text-slate-500 mb-8">Intranet Restrita</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <Input 
            type="password" 
            placeholder="Senha de Acesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-center"
          />
          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white">
            Acessar
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Index;
