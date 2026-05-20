import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, CheckCircle2, XCircle, AlertCircle, TrendingUp, 
  Clock, Search, Plus, Trash2, Settings2, SlidersHorizontal, 
  RefreshCw, Users, MapPin, UserCheck, ChevronRight, Check
} from 'lucide-react';
import { Header } from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Unit {
  id: string;
  name: string;
  google_place_id?: string;
}

interface Manager {
  id: string;
  full_name: string;
  phone: string;
  unit_id: string;
  chatwoot_inbox_id?: number;
}

interface WhatsAppCycle {
  id: string;
  manager_name: string;
  unit_name: string;
  customer_phone: string;
  started_at: string;
  max_response_time_breached: boolean;
  steps: {
    number: number;
    is_compliant: boolean;
    reason_failed?: string;
  }[];
}

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'audit' | 'management'>('audit');
  const [managementSubTab, setManagementSubTab] = useState<'managers' | 'units'>('managers');
  const [showConfig, setShowConfig] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  // Supabase Configurations (Configuração Oculta)
  const [sbUrl, setSbUrl] = useState(localStorage.getItem('stealth_supabase_url') || 'https://qtjitszradxsmnilnqtj.supabase.co');
  const [sbKey, setSbKey] = useState(localStorage.getItem('stealth_supabase_anon_key') || '');
  const [cwToken, setCwToken] = useState(localStorage.getItem('stealth_chatwoot_token') || '');

  // Mock data for initial loading and fallback
  const [units, setUnits] = useState<Unit[]>([
    { id: '1', name: 'Dom Pedro', google_place_id: 'ch_dom_pedro' },
    { id: '2', name: 'Jabaquara', google_place_id: 'ch_jabaquara' },
    { id: '3', name: 'Kennedy', google_place_id: 'ch_kennedy' }
  ]);

  const [managers, setManagers] = useState<Manager[]>([
    { id: '1', full_name: 'Renato Silva', phone: '(11) 99888-7766', unit_id: '1', chatwoot_inbox_id: 101 },
    { id: '2', full_name: 'Marcos Souza', phone: '(11) 98765-4321', unit_id: '2', chatwoot_inbox_id: 102 },
    { id: '3', full_name: 'Amanda Costa', phone: '(11) 97654-3210', unit_id: '3', chatwoot_inbox_id: 103 }
  ]);

  const [cycles, setCycles] = useState<WhatsAppCycle[]>([
    {
      id: 'c1',
      manager_name: 'Renato Silva',
      unit_name: 'Dom Pedro',
      customer_phone: '+55 11 96543-2109',
      started_at: 'Hoje, 14:30',
      max_response_time_breached: false,
      steps: [
        { number: 1, is_compliant: true },
        { number: 2, is_compliant: true },
        { number: 3, is_compliant: true },
        { number: 4, is_compliant: true }
      ]
    },
    {
      id: 'c2',
      manager_name: 'Marcos Souza',
      unit_name: 'Jabaquara',
      customer_phone: '+55 11 97777-8888',
      started_at: 'Hoje, 13:45',
      max_response_time_breached: true,
      steps: [
        { number: 1, is_compliant: true },
        { number: 2, is_compliant: false, reason_failed: 'Vídeo do defeito não enviado' },
        { number: 3, is_compliant: false, reason_failed: 'Checklist pulado antes de aprovação' },
        { number: 4, is_compliant: true }
      ]
    },
    {
      id: 'c3',
      manager_name: 'Amanda Costa',
      unit_name: 'Kennedy',
      customer_phone: '+55 11 95555-4444',
      started_at: 'Hoje, 11:30',
      max_response_time_breached: false,
      steps: [
        { number: 1, is_compliant: true },
        { number: 2, is_compliant: true },
        { number: 3, is_compliant: true },
        { number: 4, is_compliant: false, reason_failed: 'Não solicitou avaliação no Google' }
      ]
    }
  ]);

  // CRUD States
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitPlaceId, setNewUnitPlaceId] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerPhone, setNewManagerPhone] = useState('');
  const [newManagerUnitId, setNewManagerUnitId] = useState('');
  const [newManagerInboxId, setNewManagerInboxId] = useState('');

  // Handle stealth settings save
  const handleSaveConfig = () => {
    localStorage.setItem('stealth_supabase_url', sbUrl);
    localStorage.setItem('stealth_supabase_anon_key', sbKey);
    localStorage.setItem('stealth_chatwoot_token', cwToken);
    toast({
      title: "Configurações Salvas",
      description: "Integração recarregada silenciosamente.",
    });
    setShowConfig(false);
  };

  // Add a Unit
  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;

    const newUnit: Unit = {
      id: String(units.length + 1),
      name: newUnitName,
      google_place_id: newUnitPlaceId || undefined
    };

    setUnits([...units, newUnit]);
    setNewUnitName('');
    setNewUnitPlaceId('');
    toast({
      title: "Unidade Adicionada",
      description: `A oficina ${newUnit.name} foi cadastrada com sucesso.`,
    });
  };

  // Add a Manager
  const handleAddManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newManagerName.trim() || !newManagerUnitId) {
      toast({
        title: "Erro de Cadastro",
        description: "Preencha o Nome e selecione uma Unidade.",
        variant: "destructive"
      });
      return;
    }

    const newManager: Manager = {
      id: String(managers.length + 1),
      full_name: newManagerName,
      phone: newManagerPhone,
      unit_id: newManagerUnitId,
      chatwoot_inbox_id: newManagerInboxId ? Number(newManagerInboxId) : undefined
    };

    setManagers([...managers, newManager]);
    setNewManagerName('');
    setNewManagerPhone('');
    setNewManagerUnitId('');
    setNewManagerInboxId('');
    toast({
      title: "Gerente Cadastrado",
      description: `${newManager.full_name} foi vinculado à sua unidade com sucesso.`,
    });
  };

  // Statistics calculation
  const totalCycles = cycles.length;
  const compliantCycles = cycles.filter(c => c.steps.every(s => s.is_compliant) && !c.max_response_time_breached).length;
  const compliancePercentage = totalCycles > 0 ? Math.round((compliantCycles / totalCycles) * 100) : 100;
  const furosCount = cycles.reduce((acc, c) => {
    const failedSteps = c.steps.filter(s => !s.is_compliant).length;
    const responseBreach = c.max_response_time_breached ? 1 : 0;
    return acc + failedSteps + responseBreach;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans antialiased text-slate-800">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Navigation Tabs */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-200/80 pb-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-4 px-2 text-sm font-medium transition-all relative ${
                activeTab === 'audit' 
                  ? 'text-blue-600 font-semibold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Motor de Playbook
              {activeTab === 'audit' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('management')}
              className={`pb-4 px-2 text-sm font-medium transition-all relative ${
                activeTab === 'management' 
                  ? 'text-blue-600 font-semibold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Gestão de Equipes
              {activeTab === 'management' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowConfig(true)}
              className="h-8 w-8 text-slate-500 hover:text-slate-800 border-slate-200 bg-white"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tab CONTENT: AUDIT DASHBOARD */}
        {activeTab === 'audit' && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Cards grid (Inspired by ConciliaMec layout) */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Compliance Card */}
              <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Compliance Geral</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">{compliancePercentage}%</h2>
                  <p className="text-xs text-slate-400 mt-1">Meta definida de 100% de processo</p>
                </div>
              </Card>

              {/* Furos Card */}
              <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Furos Detectados</span>
                  <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">{furosCount}</h2>
                  <p className="text-xs text-slate-400 mt-1">Divergências nas etapas e tempos</p>
                </div>
              </Card>

              {/* Sincronização / Resumo */}
              <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Sincronização</span>
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 text-blue-600 animate-spin-slow" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Chatwoot Conectado</h2>
                  <p className="text-xs text-slate-400 mt-1">Última leitura de mensagens às 14:30</p>
                </div>
              </Card>
            </div>

            {/* Filter and Table Section (Inspired by Motor de Conciliação) */}
            <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Motor de Monitoramento</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Auditoria automática de conversas do WhatsApp</p>
                </div>

                <div className="flex gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Pesquisar cliente..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-lg border-slate-200 focus-visible:ring-blue-500"
                    />
                  </div>

                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">Todas as Unidades</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table / List of audited entries */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-6">Cliente / Contato</th>
                      <th className="py-4 px-6">Gerente / Unidade</th>
                      <th className="py-4 px-6 text-center">Etapa 1</th>
                      <th className="py-4 px-6 text-center">Etapa 2</th>
                      <th className="py-4 px-6 text-center">Etapa 3</th>
                      <th className="py-4 px-6 text-center">Etapa 4</th>
                      <th className="py-4 px-6">Tempo Resposta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {cycles
                      .filter(c => {
                        const matchesSearch = c.customer_phone.includes(searchQuery) || c.manager_name.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchesUnit = selectedUnit === 'all' || units.find(u => u.name === c.unit_name)?.id === selectedUnit;
                        return matchesSearch && matchesUnit;
                      })
                      .map((cycle) => (
                        <tr key={cycle.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-900">{cycle.customer_phone}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{cycle.started_at}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-slate-900">{cycle.manager_name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {cycle.unit_name}
                            </div>
                          </td>
                          {cycle.steps.map((step) => (
                            <td key={step.number} className="py-4 px-6 text-center">
                              <div className="flex flex-col items-center group relative cursor-pointer">
                                {step.is_compliant ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-rose-500" />
                                )}
                                {step.reason_failed && (
                                  <span className="absolute bottom-6 scale-0 transition-all rounded bg-slate-800 p-2 text-xs text-white group-hover:scale-100 whitespace-nowrap z-10 shadow-lg">
                                    {step.reason_failed}
                                  </span>
                                )}
                              </div>
                            </td>
                          ))}
                          <td className="py-4 px-6">
                            {cycle.max_response_time_breached ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
                                <Clock className="h-3 w-3" />
                                Estourado (&gt;20m)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                <Clock className="h-3 w-3" />
                                OK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Google Reviews Traceability Section */}
            <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Rastreabilidade Google Reviews</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Rastreamento de solicitações de avaliações enviadas vs reais</p>
                </div>
                <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
                  Alerta: Discrepância Detectada
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-500">Solicitações Enviadas (Etapa 4)</span>
                    <span className="text-sm font-semibold text-slate-800">10 enviadas</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-500">Avaliações Recebidas no GMB</span>
                    <span className="text-sm font-semibold text-slate-800">3 recebidas</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Atrito / Furos</span>
                    <span>7 falhas de conversão</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-2 border border-slate-100">
                  <p className="font-semibold text-slate-800">O que isso significa?</p>
                  <p>Comparamos automaticamente as mensagens de encerramento rastreáveis que o gerente disparou na Etapa 4 contra o webhook de novas avaliações reais recebidas no perfil do Google Meu Negócio.</p>
                  <p>Qualquer discrepância indica que o cliente não seguiu o link enviado ou houve atrito no convite.</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab CONTENT: MANAGEMENT PORTAL */}
        {activeTab === 'management' && (
          <div className="grid md:grid-cols-3 gap-8 animate-fade-in">
            {/* Sidebar selection */}
            <div className="md:col-span-1 space-y-3">
              <button
                onClick={() => setManagementSubTab('managers')}
                className={`w-full text-left p-4 rounded-xl text-sm font-medium transition-all border ${
                  managementSubTab === 'managers'
                    ? 'bg-blue-50/50 border-blue-100 text-blue-600 font-semibold'
                    : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4" />
                  Gerentes e Funcionários
                </div>
              </button>
              <button
                onClick={() => setManagementSubTab('units')}
                className={`w-full text-left p-4 rounded-xl text-sm font-medium transition-all border ${
                  managementSubTab === 'units'
                    ? 'bg-blue-50/50 border-blue-100 text-blue-600 font-semibold'
                    : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4" />
                  Unidades e Oficinas
                </div>
              </button>
            </div>

            {/* Forms and Lists content */}
            <div className="md:col-span-2 space-y-6">
              {managementSubTab === 'managers' ? (
                <>
                  {/* Register Manager Form */}
                  <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Cadastrar Gerente</h3>
                    <form onSubmit={handleAddManager} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500">Nome Completo</label>
                          <Input
                            placeholder="Ex: Renato Silva"
                            value={newManagerName}
                            onChange={(e) => setNewManagerName(e.target.value)}
                            className="h-10 text-xs border-slate-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500">WhatsApp / Telefone</label>
                          <Input
                            placeholder="Ex: (11) 99999-8888"
                            value={newManagerPhone}
                            onChange={(e) => setNewManagerPhone(e.target.value)}
                            className="h-10 text-xs border-slate-200"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500">Unidade Vinculada</label>
                          <select
                            value={newManagerUnitId}
                            onChange={(e) => setNewManagerUnitId(e.target.value)}
                            className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:border-blue-500"
                          >
                            <option value="">Selecione...</option>
                            {units.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500">Inbox ID Chatwoot (Silencioso)</label>
                          <Input
                            placeholder="Ex: 101"
                            value={newManagerInboxId}
                            onChange={(e) => setNewManagerInboxId(e.target.value)}
                            className="h-10 text-xs border-slate-200"
                          />
                        </div>
                      </div>

                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full h-10 rounded-lg font-medium text-xs transition-all shadow-sm">
                        Cadastrar e Vincular Gerente
                      </Button>
                    </form>
                  </Card>

                  {/* Managers list */}
                  <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Equipe Cadastrada</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {managers.map(m => {
                        const unitName = units.find(u => u.id === m.unit_id)?.name || 'Sem Unidade';
                        return (
                          <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                                {m.full_name[0]}
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900 text-sm">{m.full_name}</h4>
                                <span className="text-xs text-slate-400">{m.phone} • {unitName}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </>
              ) : (
                <>
                  {/* Register Unit Form */}
                  <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Adicionar Nova Unidade</h3>
                    <form onSubmit={handleAddUnit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500">Nome da Oficina / Unidade</label>
                          <Input
                            placeholder="Ex: Diadema, SBC, Jabaquara"
                            value={newUnitName}
                            onChange={(e) => setNewUnitName(e.target.value)}
                            className="h-10 text-xs border-slate-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500">Google Place ID (Opcional)</label>
                          <Input
                            placeholder="Place ID do Google Meu Negócio"
                            value={newUnitPlaceId}
                            onChange={(e) => setNewUnitPlaceId(e.target.value)}
                            className="h-10 text-xs border-slate-200"
                          />
                        </div>
                      </div>

                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full h-10 rounded-lg font-medium text-xs transition-all shadow-sm">
                        Cadastrar Oficina
                      </Button>
                    </form>
                  </Card>

                  {/* Units list */}
                  <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unidades Cadastradas</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {units.map(u => (
                        <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-sm">
                              <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 text-sm">{u.name}</h4>
                              <span className="text-xs text-slate-400">Place ID: {u.google_place_id || 'Não configurado'}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        )}

        {/* Configurations Modal (Stealth Layer) */}
        {showConfig && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xl w-full max-w-md space-y-6 relative">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Configurações de Conexão</h3>
                <p className="text-xs text-slate-400 mt-0.5">Configure silenciosamente a API do Chatwoot e chaves do Supabase.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Supabase API URL</label>
                  <Input
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    className="h-10 text-xs border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Supabase Anon Key</label>
                  <Input
                    type="password"
                    placeholder="Chave pública do Supabase"
                    value={sbKey}
                    onChange={(e) => setSbKey(e.target.value)}
                    className="h-10 text-xs border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Chatwoot Access Token (Stealth)</label>
                  <Input
                    type="password"
                    placeholder="Access Token da API Oficial"
                    value={cwToken}
                    onChange={(e) => setCwToken(e.target.value)}
                    className="h-10 text-xs border-slate-200"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button variant="ghost" onClick={() => setShowConfig(false)} className="h-10 rounded-lg text-xs font-medium">
                  Cancelar
                </Button>
                <Button onClick={handleSaveConfig} className="bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-lg font-medium text-xs px-5 shadow-sm">
                  Salvar
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
