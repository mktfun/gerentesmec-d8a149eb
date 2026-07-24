import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Key, Trash2, User, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ijomsruroyeaapurnbqu.supabase.co";
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqb21zcnVyb3llYWFwdXJuYnF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjc5Mzc5NywiZXhwIjoyMDk4MzY5Nzk3fQ.u2RHcTbkqDcNt8PWu4tvXxXMpbHz-Csm6yI4YF7S8HU";

// Admin client para gerenciar usuários (apenas para uso restrito em configs/admin)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { 
    autoRefreshToken: false, 
    persistSession: false,
    detectSessionInUrl: false,
    storageKey: 'supabase-admin-auth-token'
  }
});

interface Auditor {
  id: string;
  email: string;
  created_at: string;
  app_metadata: { role?: string };
  user_metadata: { name?: string };
}

export function AuditorsPanel() {
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Form state
  const [selectedId, setSelectedId] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAuditors();
  }, []);

  const fetchAuditors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      
      const auditorUsers = data.users.filter(u => u.app_metadata?.role === 'auditor');
      setAuditors(auditorUsers as Auditor[]);
    } catch (err: any) {
      toast.error('Erro ao buscar auditores: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setEmail('');
    setName('');
    setPassword('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: Auditor) => {
    setModalMode('edit');
    setSelectedId(user.id);
    setEmail(user.email);
    setName(user.user_metadata?.name || '');
    setPassword('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === 'create') {
        const { error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name },
          app_metadata: { role: 'auditor' }
        });
        if (error) throw error;
        toast.success('Auditor criado com sucesso!');
      } else {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(selectedId, {
          password: password ? password : undefined,
          user_metadata: { name }
        });
        if (error) throw error;
        toast.success('Senha atualizada com sucesso!');
      }
      setIsModalOpen(false);
      fetchAuditors();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o acesso do auditor ${name}?`)) return;
    
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) throw error;
      toast.success('Auditor excluído com sucesso!');
      fetchAuditors();
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-6 glass">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            Contas de Auditores
          </h2>
          <p className="text-sm text-white/50 mt-1">Gerencie logins exclusivos para a tela de Auditoria</p>
        </div>
        
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]"
        >
          <Plus className="w-4 h-4" />
          Novo Auditor
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-white/30" />
        </div>
      ) : auditors.length === 0 ? (
        <div className="text-center p-8 bg-black/20 rounded-xl border border-white/5">
          <p className="text-white/40 font-medium">Nenhum auditor cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {auditors.map(aud => (
            <div key={aud.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
              <div>
                <p className="font-bold text-white">{aud.user_metadata?.name || 'Sem nome'}</p>
                <p className="text-sm text-white/50">{aud.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEdit(aud)}
                  className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors"
                  title="Alterar Senha"
                >
                  <Key className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(aud.id, aud.user_metadata?.name || aud.email)}
                  className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-400 hover:text-rose-500 transition-colors"
                  title="Excluir Acesso"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-[#111118] border border-white/10 rounded-2xl w-full max-w-md relative p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {modalMode === 'create' ? 'Novo Auditor' : 'Alterar Senha'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              {modalMode === 'create' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-white/50 uppercase block mb-1">Nome</label>
                    <input 
                      required type="text" value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/50 uppercase block mb-1">Email</label>
                    <input 
                      required type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="text-xs font-bold text-white/50 uppercase block mb-1">
                  {modalMode === 'create' ? 'Senha' : 'Nova Senha'}
                </label>
                <input 
                  required={modalMode === 'create'} type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500"
                  placeholder={modalMode === 'edit' ? 'Deixe em branco para manter a atual' : 'Mínimo 6 caracteres'}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-white/70 hover:bg-white/5">
                  Cancelar
                </button>
                <button disabled={saving} type="submit" className="flex-1 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
