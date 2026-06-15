import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, X, Save, Sparkles, AlertTriangle, Eye, Activity, Database, Check } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { Switch } from '@/components/ui/switch';
import { AiRouterConfig } from '@/components/Config/AiRouterConfig';
import { useBackgroundAuditor } from '@/context/BackgroundAuditorContext';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvancedAiPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const { aiSettings, updateAiSettings } = useAppData();

  const [systemPrompt, setSystemPrompt] = useState('');
  const [autoScoring, setAutoScoring] = useState(false);
  const [autoPipeline, setAutoPipeline] = useState(false);
  const [visionEnabled, setVisionEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [criterAuditoria, setCriterAuditoria] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  
  const [pendingCount, setPendingCount] = useState(0);
  const [isProcessingQueue, setIsProcessingQueue] = React.useState(false);
  const [queueOk, setQueueOk] = React.useState(false);

  const backgroundAuditor = useBackgroundAuditor();

  const [saving, setSaving] = React.useState(false);

  useEffect(() => {
    if (aiSettings && isOpen) {
      setSystemPrompt(aiSettings.system_prompt || '');
      const feats = aiSettings.features || {};
      setAutoScoring(!!feats.auto_scoring);
      setAutoPipeline(!!feats.auto_pipeline);
      setVisionEnabled(!!feats.vision);
      setAudioEnabled(!!feats.audio);
      setCriterAuditoria(aiSettings.evaluation_criterAuditoria ? JSON.stringify(aiSettings.evaluation_criterAuditoria, null, 2) : '{\n  "peso_cordAuditorialidade": 25,\n  "peso_orcamento": 25,\n  "peso_checklist": 25,\n  "peso_fechamento": 25\n}');
    }
  }, [aiSettings, isOpen]);

  useEffect(() => {
    let int: ReturnType<typeof setInterval>;
    if (isOpen) {
      const fetchQueue = async () => {
        try {
          const { count } = await supabase.from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('ai_audited', false)
            .eq('sender_type', 'user');
          setPendingCount(count || 0);
        } catch (err) {}
      };
      fetchQueue();
      int = setInterval(fetchQueue, 5000); // Heartbeat/Polling a cada 5s
    }
    return () => clearInterval(int);
  }, [isOpen]);

  const processQueue = async () => {
    if (pendingCount === 0 || isProcessingQueue) return;
    setIsProcessingQueue(true);
    try {
      const { data } = await supabase.from('chat_messages')
        .select('*')
        .eq('ai_audited', false)
        .eq('sender_type', 'user')
        .order('created_at', { ascending: true })
        .limit(50);
        
      if (data && data.length > 0) {
        // Agrupa por lead_id
        const groups: Record<string, any[]> = {};
        data.forEach(m => {
          if (!groups[m.lead_id]) groups[m.lead_id] = [];
          groups[m.lead_id].push(m);
        });

        for (const [leadId, msgs] of Object.entries(groups)) {
          const bundledContent = msgs.map(m => {
            const time = new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            return `[${time}] ${m.sender_type}: ${m.content}`;
          }).join('\n\n');

          const messageIds = msgs.map(m => m.id);

          await supabase.functions.invoke('ai-autonomous-evaluator', {
             body: { 
               message_content: bundledContent,
               lead_id: leadId,
               message_ids: messageIds,
               medAuditoria_url: msgs[0].medAuditoria_url,
               medAuditoria_type: msgs[0].medAuditoria_type,
               sender_type: msgs[msgs.length - 1].sender_type
             }
          });
        }
        setQueueOk(true);
        setTimeout(() => setQueueOk(false), 3000);
      }
    } catch (err: any) {
      alert('Erro ao processar fila: ' + err.message);
    } finally {
      setIsProcessingQueue(false);
      // Força um fetch imedAuditoriato após processar
      const { count } = await supabase.from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('ai_audited', false)
        .eq('sender_type', 'user');
      setPendingCount(count || 0);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    let parsedCriterAuditoria = {};
    try {
      if (criterAuditoria.trim()) parsedCriterAuditoria = JSON.parse(criterAuditoria);
    } catch {
      alert('O JSON de Critérios está inválido.');
      setIsSaving(false);
      return;
    }

    try {
      await updateAiSettings({
        system_prompt: systemPrompt,
        evaluation_criterAuditoria: parsedCriterAuditoria,
        features: {
          auto_scoring: autoScoring,
          auto_pipeline: autoPipeline,
          vision: visionEnabled,
          audio: audioEnabled
        }
      });
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2000);
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop Blur */}
          <motion.div
            initAuditorial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initAuditorial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl h-full bg-card/80 backdrop-blur-3xl border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                    IA de AuditorAuditoria <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500 dark:text-rose-400 text-[10px] uppercase tracking-widest font-bold">DANGER ZONE</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">Cost-Efficient Autonomous Routing & Scoring</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Cost-Efficiency Notice */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex gap-4">
                <Database className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-500">Semantic Caching Ativado</h4>
                  <p className="text-xs text-emerald-500/70 mt-1">
                    Esta arquitetura utiliza <code className="bg-emerald-500/10 px-1 rounded">pgvector</code> para memorização semântica. Mensagens trivAuditoriais ou repetidas não consomem tokens. O histórico é comprimido progressivamente (Memoization).
                  </p>
                </div>
              </div>

              {/* ── AI Router & DAuditoriagnóstico ───────────────────────────── */}
              <AiRouterConfig />

              {/* Toggles */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> Automação de Cérebro
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-foreground">Auto-Scoring</p>
                      <p className="text-xs text-muted-foreground">AvalAuditoria cordAuditorialidade e preenche checklists automático.</p>
                    </div>
                    <Switch checked={autoScoring} onCheckedChange={setAutoScoring} />
                  </div>
                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-foreground">Auto-Pipeline</p>
                      <p className="text-xs text-muted-foreground">Move cards no funil com base no contexto da conversa.</p>
                    </div>
                    <Switch checked={autoPipeline} onCheckedChange={setAutoPipeline} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" /> Processamento Multimodal
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-foreground">Computer Vision</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Analisa fotos de orçamentos e veículos (custo extra de tokens).</p>
                    </div>
                    <Switch checked={visionEnabled} onCheckedChange={setVisionEnabled} />
                  </div>
                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-foreground">Audio Analysis</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Transcreve e avalAuditoria o tom de voz dos áudios envAuditoriados.</p>
                    </div>
                    <Switch checked={audioEnabled} onCheckedChange={setAudioEnabled} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> Fila de AvalAuditoriação Auditoria (Heartbeat)
                </h3>
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-foreground flex items-center gap-2">
                      Mensagens Pendentes 
                      {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 max-w-[300px]">
                      Se o servidor Auditoria local cair, as avalAuditoriações acumulam aqui. O IA verifica periodicamente.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black text-indigo-500">{pendingCount}</span>
                    <button 
                      onClick={processQueue} 
                      disabled={pendingCount === 0 || isProcessingQueue}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.2)] flex items-center gap-2 transition-all"
                    >
                      {isProcessingQueue ? <Cpu className="w-3.5 h-3.5 animate-spin" /> : queueOk ? <Check className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                      {isProcessingQueue ? 'Processando Lotes...' : queueOk ? 'Lotes Concluídos!' : 'Forçar Lote Manual (Fim de Expediente)'}
                    </button>
                  </div>
                </div>
                
                {/* Historical Background Auditor */}
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-indigo-500 flex items-center gap-2">
                        Auditor de Fundo (Slow Mode)
                        {backgroundAuditor.status === 'processing' && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                        {backgroundAuditor.status === 'cooldown' && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                        {backgroundAuditor.status === 'paused_error' && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                      </p>
                      <p className="text-[10px] text-indigo-500/70 leading-tight mt-0.5 max-w-[300px]">
                        Limpa mensagens pendentes do histórico de forma cadencAuditoriada para não sobrecarregar a Auditoria local nem estourar rate limits.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select 
                        value={backgroundAuditor.cooldown} 
                        onChange={e => backgroundAuditor.setCooldown(parseInt(e.target.value, 10))}
                        className="bg-transparent text-xs border border-indigo-500/30 text-indigo-500 rounded-lg p-1.5 outline-none cursor-pointer"
                        disabled={backgroundAuditor.enabled}
                      >
                        <option value="5">A cada 5s</option>
                        <option value="15">A cada 15s</option>
                        <option value="30">A cada 30s</option>
                        <option value="60">A cada 1m</option>
                      </select>
                      <Switch 
                        checked={backgroundAuditor.enabled} 
                        onCheckedChange={backgroundAuditor.setEnabled} 
                      />
                    </div>
                  </div>
                  
                  {backgroundAuditor.enabled && (
                    <div className="flex flex-col gap-1 pt-2 border-t border-indigo-500/10">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1">
                        STATUS: 
                        {backgroundAuditor.status === 'idle' && 'AGUARDANDO MENSAGENS...'}
                        {backgroundAuditor.status === 'processing' && 'ENVAuditoriaNDO PARA A Auditoria...'}
                        {backgroundAuditor.status === 'cooldown' && `DESCANSO DE ${backgroundAuditor.cooldown} SEGUNDOS...`}
                        {backgroundAuditor.status === 'paused_error' && 'PAUSADO: ERRO DA Auditoria (TENTANDO EM 2 MIN)'}
                      </p>
                      {backgroundAuditor.lastError && (
                        <p className="text-[10px] text-rose-500 truncate max-w-full">
                          Último erro: {backgroundAuditor.lastError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>


              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Core Prompts
                </h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">System Prompt Master</label>
                  <p className="text-xs text-muted-foreground">O comportamento fundamental da Auditoria. Este prompt instrui como o LLM deve se comportar ao ler um histórico de mensagens.</p>
                  <textarea 
                    value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                    placeholder="Você é um gerente de qualidade sênior avalAuditoriando conversas..."
                    className="w-full h-32 bg-muted border border-border rounded-xl p-4 text-xs font-mono text-indigo-500 dark:text-indigo-300 focus:border-indigo-500 outline-none resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">JSON de Critérios de AvalAuditoriação (Checklist Dinâmico)</label>
                  <p className="text-xs text-muted-foreground">Defina os pesos de cada etapa para a função <code className="bg-black/10 dark:bg-white/10 px-1 rounded">save_lead_audit</code>.</p>
                  <textarea 
                    value={criterAuditoria} onChange={e => setCriterAuditoria(e.target.value)}
                    className="w-full h-32 bg-muted border border-border rounded-xl p-4 text-xs font-mono text-emerald-500 dark:text-emerald-300 focus:border-emerald-500 outline-none resize-none"
                  />
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-black/5 dark:bg-black/20 backdrop-blur-xl shrink-0 flex items-center justify-between">
              <p className="text-xs text-muted-foreground max-w-[60%]">
                <AlertTriangle className="w-3 h-3 inline mr-1 text-amber-500" />
                Alterações aqui impactam o roteamento de LLMs. Certifique-se de salvar antes de fechar.
              </p>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black text-white bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:opacity-50"
              >
                {isSaving ? <Cpu className="w-4 h-4 animate-spin" /> : saveOk ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Aplicando...' : saveOk ? 'Aplicado!' : 'Aplicar Modificações'}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};


