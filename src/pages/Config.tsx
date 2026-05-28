import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Eye, EyeOff, Plus, Clock, Info, Cpu, X, RefreshCw, Copy, Check, AlertTriangle } from 'lucide-react';
import UnitMappingCard from '@/components/Config/UnitMappingCard';
import { InboxMappingPanel } from '@/components/Config/InboxMappingPanel';
import { AdvancedAiPanel } from '@/components/Config/AdvancedAiPanel';
import { useAppData } from '@/context/AppDataContext';
import { supabase } from '@/integrations/supabase/client';
import { avgScoreInt } from '@/utils/scoreUtils';

import { fadeUp } from '@/utils/motion';


const Config = () => {
  const { units, managers, leads, addUnit, updateUnit, deleteUnit, integrationSettings, updateIntegrationSettings, businessHours } = useAppData();
  const [apiUrl, setApiUrl] = useState('https://app.chatwoot.com');
  const [apiToken, setApiToken] = useState('');
  const [accountId, setAccountId] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);
  const [slaByUnit, setSlaByUnit] = useState<Record<string, number>>({});
  const [newUnitName, setNewUnitName] = useState('');
  const [addingUnit, setAddingUnit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [ignoredLabelsStr, setIgnoredLabelsStr] = useState('fornecedor, dono, ignorar, ignore, equipe, grupo, rh, socios');
  // Horário de Atendimento
  const [bhDays, setBhDays] = useState<number[]>(businessHours.days);
  const [bhStart, setBhStart] = useState(businessHours.start);
  const [bhEnd, setBhEnd] = useState(businessHours.end);
  const [bhSaveStatus, setBhSaveStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  // Ref para sincronizar integrationSettings apenas 1x (evita flash ao entrar na tela)
  const settingsInitialized = useRef(false);

  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://[SEU-PROJETO].supabase.co';
  const webhookUrl = `${supabaseUrl}/functions/v1/chatwoot-webhook`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    // Só sincroniza na primeira vez que os dados chegam — evita flash de re-render
    if (integrationSettings && !settingsInitialized.current) {
      settingsInitialized.current = true;
      if (integrationSettings.chatwoot_url) setApiUrl(integrationSettings.chatwoot_url);
      if (integrationSettings.chatwoot_token) setApiToken(integrationSettings.chatwoot_token);
      if (integrationSettings.chatwoot_webhook_secret) setWebhookSecret(integrationSettings.chatwoot_webhook_secret);
      if (integrationSettings.chatwoot_account_id) setAccountId(String(integrationSettings.chatwoot_account_id));
      if (integrationSettings.chatwoot_url && integrationSettings.chatwoot_token) {
        setConnected(true);
      }
      if (integrationSettings.ignored_labels) {
        setIgnoredLabelsStr(
          Array.isArray(integrationSettings.ignored_labels) 
            ? integrationSettings.ignored_labels.join(', ') 
            : integrationSettings.ignored_labels
        );
      }
      // Sincroniza horário do banco
      const bh = (integrationSettings as any).business_hours;
      if (bh) {
        if (Array.isArray(bh.days)) setBhDays(bh.days);
        if (bh.start) setBhStart(bh.start);
        if (bh.end) setBhEnd(bh.end);
      }
    }
  }, [integrationSettings]);

  // Initialize SLAs once units are loaded
  React.useEffect(() => {
    if (units.length > 0 && Object.keys(slaByUnit).length === 0) {
      setSlaByUnit(Object.fromEntries(units.map(u => [u.id, 20])));
    }
  }, [units]);

  const testConnection = async () => {
    if (!apiUrl || !apiToken) return;
    setTesting(true);
    setConnected(null);
    
    try {
      let baseUrl = apiUrl.trim().replace(/\/$/, '');
      if (!/^https?:\/\//i.test(baseUrl)) {
        baseUrl = `https://${baseUrl}`;
      }
      setApiUrl(baseUrl);

      const res = await supabase.functions.invoke('chatwoot-inboxes', {
        body: { chatwoot_url: baseUrl, chatwoot_token: apiToken, chatwoot_account_id: accountId ? Number(accountId) : undefined }
      });
      
      if (!res.error && !res.data?.error) {
        setConnected(true);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    } finally {
      setTesting(false);
    }
  };

  if (!integrationSettings) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-semibold">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 pb-32 max-w-5xl mx-auto">

      {/* Page header */}
      <motion.div {...fadeUp(0)} className="mb-8">
        <p className="label-caps text-primary/70 mb-1">Sistema</p>
        <h1 className="text-2xl font-black text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure a integração com o canal de mensagens e defina as regras por unidade.
        </p>
      </motion.div>

      <div className="space-y-6">

        {/* ── Integração de Canal ───────────────────────────── */}
        <motion.section {...fadeUp(0.05)}>
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Integração de Canal</h2>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">

            {/* Connection status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border ${
                connected === true ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                connected === false ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                'bg-muted/50 border-border text-muted-foreground'
              }`}
            >
              {connected === true ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {connected === true ? 'Conectado e validado com sucesso!' :
               connected === false ? 'Falha na conexão. Verifique URL e Token.' :
               'Conexão ainda não testada.'}
            </motion.div>

            {/* Webhook Instructions */}
            <div className="p-4 rounded-xl bg-card border border-border relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <RefreshCw className="w-24 h-24" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">1. Webhook do Chatwoot</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Copie a URL abaixo e cole no seu Chatwoot em <strong>Configurações &gt; Webhooks</strong>. 
                Marque os eventos: <code className="text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10 px-1 rounded">message_created</code> e <code className="text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10 px-1 rounded">conversation_created</code>.
              </p>
              
              <div className="mb-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1.5 block">
                  Segredo do Webhook (Assinatura)
                </label>
                <input
                  value={webhookSecret}
                  onChange={e => setWebhookSecret(e.target.value)}
                  placeholder="Ex: qGJePktjNUdsofr..."
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border
                    text-xs font-mono text-foreground placeholder:text-muted-foreground/30
                    focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Ao configurar o segredo, nosso servidor passará a validar a criptografia garantindo segurança 100%.</p>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <code className="flex-1 px-3 py-2.5 rounded-lg bg-muted border border-border text-xs font-mono text-foreground/80 overflow-x-auto whitespace-nowrap">
                  {webhookUrl}
                </code>
                <button
                  onClick={handleCopyWebhook}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-border text-xs font-bold text-foreground transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1.5 block">
                  Etiquetas Ignoradas (Separadas por vírgula)
                </label>
                <input
                  value={ignoredLabelsStr}
                  onChange={e => setIgnoredLabelsStr(e.target.value)}
                  placeholder="Ex: fornecedor, dono, ignorar"
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border
                    text-xs font-mono text-foreground placeholder:text-muted-foreground/30
                    focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Conversas no Chatwoot com essas etiquetas (labels) serão ignoradas pelo webhook.</p>
              </div>

              <div className="border-t border-border pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">Sincronização Histórica</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Puxe conversas passadas do Chatwoot para gerar o Dossiê e pontuar pela IA.</p>
                </div>
                <button 
                  onClick={async () => {
                    const btn = document.getElementById('sync-btn-text');
                    if(btn) btn.innerText = 'Sincronizando...';
                    try {
                      const res = await supabase.functions.invoke('chatwoot-sync');
                      if(res.error) throw res.error;
                      alert(res.data?.message || 'Sincronização concluída!');
                    } catch (e: any) {
                      alert('Erro na sincronização: ' + e.message);
                    } finally {
                      if(btn) btn.innerText = 'Puxar Histórico';
                    }
                  }} 
                  className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <span id="sync-btn-text">Puxar Histórico</span>
                </button>
              </div>
              <div className="border-t border-border pt-4 mt-4 flex items-center justify-between">
                {saveStatus === 'ok' && (
                  <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Salvo com sucesso!
                  </span>
                )}
                {saveStatus === 'err' && (
                  <span className="text-xs font-bold text-rose-500 dark:text-rose-400">Erro ao salvar. Tente novamente.</span>
                )}
                {(saveStatus === 'idle' || saveStatus === 'saving') && <span />}
                <button
                  disabled={saveStatus === 'saving'}
                  onClick={async () => {
                    setSaveStatus('saving');
                    try {
                      // Normaliza URL
                      let normalizedUrl = apiUrl.trim().replace(/\/$/, '');
                      if (normalizedUrl && !/^https?:\/\//i.test(normalizedUrl)) {
                        normalizedUrl = `https://${normalizedUrl}`;
                      }
                      setApiUrl(normalizedUrl);

                      // Parseia account_id com segurança
                      const trimmedId = accountId.trim();
                      const parsedAccountId = trimmedId ? parseInt(trimmedId, 10) : null;
                      const safeAccountId = parsedAccountId !== null && !isNaN(parsedAccountId) ? parsedAccountId : null;

                      await updateIntegrationSettings({
                        chatwoot_url: normalizedUrl,
                        chatwoot_token: apiToken,
                        chatwoot_webhook_secret: webhookSecret,
                        chatwoot_account_id: safeAccountId,
                        ignored_labels: ignoredLabelsStr.split(',').map(s => s.trim()).filter(Boolean)
                      });
                      setSaveStatus('ok');
                      setTimeout(() => setSaveStatus('idle'), 3000);
                    } catch (e) {
                      setSaveStatus('err');
                      setTimeout(() => setSaveStatus('idle'), 4000);
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-[0_0_20px_hsl(239_84%_67%_/_0.25)]"
                >
                  {saveStatus === 'saving' ? 'Salvando...' : 'Salvar Configurações de API'}
                </button>
              </div>
            </div>

            <div className="h-px bg-border w-full my-2" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2 mt-4">2. Conexão Reversa (API)</h3>

            {/* URL */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                URL do Servidor
              </label>
              <input
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                placeholder="https://app.chatwoot.com"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border
                  text-sm font-medium text-foreground placeholder:text-muted-foreground/50
                  focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Account ID */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                Account ID (Chatwoot)
              </label>
              <input
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                type="number"
                placeholder="Ex: 1"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border
                  text-sm font-medium text-foreground placeholder:text-muted-foreground/50
                  focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Token */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                Token de Acesso da API
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    value={apiToken}
                    onChange={e => setApiToken(e.target.value)}
                    type={showToken ? 'text' : 'password'}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl bg-muted border border-border
                      text-sm font-mono text-foreground placeholder:text-muted-foreground/30
                      focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <button onClick={() => setShowToken(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50
                      hover:text-muted-foreground transition-colors">
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button onClick={testConnection} disabled={testing}
                  className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold
                    bg-primary text-white hover:bg-primary/90 transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-[0_0_20px_hsl(239_84%_67%_/_0.25)] hover:shadow-[0_0_28px_hsl(239_84%_67%_/_0.35)]">
                  {testing ? 'Testando…' : 'Testar'}
                </button>
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border">
              <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                O token é usado internamente para leitura de conversas. Ele nunca aparece na interface 
                e a integração funciona de forma discreta em background.
              </p>
            </div>

            {/* Inbox Mapping Panel - Now loads dynamically from Edge Function */}
            {connected === true && (
              <InboxMappingPanel apiUrl={apiUrl} apiToken={apiToken} accountId={accountId} />
            )}
          </div>
        </motion.section>

        {/* ── Horário de Atendimento ─────────────────────────────── */}
        <motion.section {...fadeUp(0.065)}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Horário de Atendimento</h2>
          </div>

          <div className="rounded-2xl border border-border bg-black/5 dark:bg-white/[0.03] backdrop-blur-md p-6 space-y-5">
            {/* Dias */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
                Dias de Atendimento
              </label>
              <div className="flex gap-2 flex-wrap">
                {[{d:0,l:'Dom'},{d:1,l:'Seg'},{d:2,l:'Ter'},{d:3,l:'Qua'},{d:4,l:'Qui'},{d:5,l:'Sex'},{d:6,l:'Sáb'}].map(({ d, l }) => {
                  const active = bhDays.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => setBhDays(prev =>
                        prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()
                      )}
                      className={`w-11 h-11 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-150 active:scale-95 border ${
                        active
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-500 dark:text-indigo-300 shadow-[0_0_12px_hsl(239_84%_67%_/_0.2)]'
                          : 'bg-black/5 dark:bg-white/5 border-border text-muted-foreground/50 hover:border-indigo-500/30 hover:text-muted-foreground'
                      }`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horários */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  Abertura
                </label>
                <input
                  type="time"
                  value={bhStart}
                  onChange={e => setBhStart(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-medium text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  Fechamento
                </label>
                <input
                  type="time"
                  value={bhEnd}
                  onChange={e => setBhEnd(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-medium text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border">
              <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                O TMR e os alertas de SLA só contabilizarão o tempo <strong className="text-foreground">dentro deste horário</strong>.
                Mensagens fora do expediente não geram pressão de tempo.
              </p>
            </div>

            {/* Salvar */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              {bhSaveStatus === 'ok' && (
                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Horário salvo!
                </span>
              )}
              {bhSaveStatus === 'err' && (
                <span className="text-xs font-bold text-rose-500 dark:text-rose-400">Erro ao salvar. Tente novamente.</span>
              )}
              {(bhSaveStatus === 'idle' || bhSaveStatus === 'saving') && <span />}
              <button
                disabled={bhSaveStatus === 'saving'}
                onClick={async () => {
                  setBhSaveStatus('saving');
                  try {
                    await updateIntegrationSettings({
                      business_hours: { days: bhDays, start: bhStart, end: bhEnd, timezone: 'America/Sao_Paulo' }
                    } as any);
                    setBhSaveStatus('ok');
                    setTimeout(() => setBhSaveStatus('idle'), 3000);
                  } catch {
                    setBhSaveStatus('err');
                    setTimeout(() => setBhSaveStatus('idle'), 4000);
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-[0_0_20px_hsl(239_84%_67%_/_0.25)]"
              >
                {bhSaveStatus === 'saving' ? 'Salvando...' : 'Salvar Horário'}
              </button>
            </div>
          </div>
        </motion.section>



        {/* ── Unidades e Mapeamento de Canais ──────────────── */}
        <motion.section {...fadeUp(0.1)}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Unidades e Canais</h2>
            </div>
            <span className="text-xs text-muted-foreground">{units.length} unidades configuradas</span>
          </div>

          {/* How it works banner */}
          <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/15">
            <p className="text-xs font-bold text-primary mb-1">Como funciona o mapeamento visual</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Vincule cada unidade à sua respectiva Caixa de Entrada na seção de <strong>Integração de Canal</strong> acima. 
              Isso garantirá precisão de 100% no recebimento das conversas usando o ID oficial do Chatwoot.
              Cada unidade deve ter exatamente <strong className="text-foreground">1 gerente responsável</strong>.
            </p>
          </div>

          {/* Warning: Inbox ID duplicado entre unidades */}
          {(() => {
            const inboxIds = units.map(u => u.chatwoot_inbox_id).filter(Boolean);
            const duplicates = inboxIds.filter((id, idx) => inboxIds.indexOf(id) !== idx);
            const dupUnits = units.filter(u => duplicates.includes(u.chatwoot_inbox_id));
            if (dupUnits.length === 0) return null;
            return (
              <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-400 mb-1">Conflito de Inbox Detectado</p>
                  <p className="text-xs text-amber-400/80 leading-relaxed">
                    As unidades <strong className="text-amber-300">{dupUnits.map(u => u.name).join(' e ')}</strong> estão
                    usando o mesmo Inbox ID. Isso pode causar atribuição incorreta de conversas.
                    Verifique a configuração no Chatwoot.
                  </p>
                </div>
              </div>
            );
          })()}

          <div className="space-y-3">
            {units.map((unit, i) => {
              const manager = managers.find(m => m.unit_id === unit.id);
              const unitLeads = leads.filter(l => l.unit_id === unit.id);
              const unitScore = avgScoreInt(unitLeads) || 0;
              return (
                <motion.div key={unit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 280, damping: 26 }}
                >
                  <UnitMappingCard
                    unit={unit}
                    manager={manager}
                    slaMinutes={slaByUnit[unit.id] ?? 20}
                    unitScore={unitScore}
                    onSlaChange={mins => setSlaByUnit(prev => ({ ...prev, [unit.id]: mins }))}
                    onDelete={() => {
                      if (confirm(`Remover a unidade "${unit.name}"? Gerentes vinculados também serão removidos.`)) {
                        deleteUnit(unit.id);
                      }
                    }}
                    onUpdate={updateUnit}
                  />
                </motion.div>
              );
            })}
            {units.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
                Nenhuma unidade cadastrada ainda. Adicione abaixo ou conecte um canal para importar automaticamente.
              </div>
            )}
          </div>

          {addingUnit ? (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5">
              <input
                autoFocus
                value={newUnitName}
                onChange={e => setNewUnitName(e.target.value)}
                onKeyDown={async e => {
                  if (e.key === 'Enter' && newUnitName.trim()) {
                    await addUnit(newUnitName.trim());
                    setNewUnitName(''); setAddingUnit(false);
                  }
                  if (e.key === 'Escape') { setNewUnitName(''); setAddingUnit(false); }
                }}
                placeholder='Nome da unidade (deve bater com inbox.name do Chatwoot)'
                className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
              <button
                onClick={async () => {
                  if (!newUnitName.trim()) return;
                  await addUnit(newUnitName.trim());
                  setNewUnitName(''); setAddingUnit(false);
                }}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90"
              >Salvar</button>
              <button
                onClick={() => { setNewUnitName(''); setAddingUnit(false); }}
                className="p-2 rounded-xl text-muted-foreground hover:bg-muted"
              ><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={() => setAddingUnit(true)} className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl
              border-2 border-dashed border-border hover:border-primary/30 hover:bg-primary/5
              text-sm font-semibold text-muted-foreground hover:text-primary transition-all">
              <Plus className="w-4 h-4" />
              Adicionar unidade
            </button>
          )}
        </motion.section>
      </div>

      {/* Engenharia IA - Botão Oculto */}
      <div className="mt-20 flex justify-center opacity-10 hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={() => setIsAiPanelOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
        >
          <Cpu className="w-3.5 h-3.5" /> Acesso de Engenharia
        </button>
      </div>

      <AdvancedAiPanel isOpen={isAiPanelOpen} onClose={() => setIsAiPanelOpen(false)} />
    </div>
  );
};

export default Config;
