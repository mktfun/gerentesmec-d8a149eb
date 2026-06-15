import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Clock, MessageSquare, Target, 
  CheckCircle2, TrendingUp, Zap, Server, ChevronRight
} from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }
});

const Presentation = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 pt-20 pb-32 text-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15)_0%,transparent_60%)] pointer-events-none" />
        
        <motion.div {...fadeUp(0.1)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 mb-8 backdrop-blur-md">
          <Zap className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Plataforma de Gestão Automática</span>
        </motion.div>
        
        <motion.h1 {...fadeUp(0.2)} className="text-5xl md:text-7xl font-black tracking-tighter max-w-4xl leading-[1.1] mb-8">
          A Evolução do <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
            Atendimento Automotivo
          </span>
        </motion.h1>
        
        <motion.p {...fadeUp(0.3)} className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed mb-12">
          Deixe o IA trabalhar por você. Nossa plataforma monitora o WhatsApp da sua oficina em tempo real, organizando orçamentos e garantindo que nenhum cliente fique esperando.
        </motion.p>
      </section>

      {/* Como Funciona - Grid */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <motion.div {...fadeUp(0)} className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Como funciona?</h2>
          <p className="text-muted-foreground text-lg">Um ecosia invisível que trabalha nos bastidores 24/7.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1 */}
          <motion.div {...fadeUp(0.1)} className="p-10 rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-xl relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(99,102,241,0.1)] transition-all duration-500">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
              <MessageSquare className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-black mb-4">Captação Automática</h3>
            <p className="text-muted-foreground leading-relaxed">
              O IA é integrado diretamente ao Chatwoot/WhatsApp. Quando um cliente entra em contato, a plataforma automaticamente reconhece o atendimento e cria um cartão de orçamento no Funil (CRM), sem necessidade de digitação manual.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div {...fadeUp(0.2)} className="p-10 rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-xl relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(52,211,153,0.1)] transition-all duration-500">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
              <Clock className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black mb-4">Controle de TMR e SLAs</h3>
            <p className="text-muted-foreground leading-relaxed">
              O tempo é o fator que mais converte vendas. A plataforma cronometra silenciosamente quanto tempo o cliente está aguardando uma resposta. Se o limite (SLA) for ultrapassado, alertas vermelhos disparam no painel do gerente.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div {...fadeUp(0.3)} className="p-10 rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-xl relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(244,63,94,0.1)] transition-all duration-500">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-2xl font-black mb-4">Auditoria Contínua</h3>
            <p className="text-muted-foreground leading-relaxed">
              Diga adeus à checagem por amostragem. O IA avalia 100% dos orçamentos finalizados lendo o histórico da conversa e gerando um "Dossiê de Qualidade". Ele verifica automaticamente se o vendedor foi educado, identificou o defeito e ofereceu o agendamento.
            </p>
          </motion.div>

          {/* Card 4 */}
          <motion.div {...fadeUp(0.4)} className="p-10 rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-xl relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(234,179,8,0.1)] transition-all duration-500">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black mb-4">Ranking e Visibilidade</h3>
            <p className="text-muted-foreground leading-relaxed">
              As notas geradas nas auditorias alimentam um Score Global em tempo real. Você consegue visualizar em uma única tela quais gerentes e unidades estão performando melhor, identificando gargalos e premiando os melhores atendimentos.
            </p>
          </motion.div>

        </div>
      </section>

      {/* Feature Highlight Section */}
      <section className="relative py-32 overflow-hidden border-t border-border bg-black/[0.01] dark:bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            <motion.div {...fadeUp(0)} className="flex-1 space-y-8">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.1]">
                Um Raio-X <br /> do seu negócio.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Toda conversa com o cliente contém dados preciosos. Nós transformamos esses dados em painéis gerenciais fáceis de ler.
              </p>
              <ul className="space-y-4">
                {[
                  'Identificação instantânea de clientes ignorados',
                  'Garantia de padronização no atendimento',
                  'Visualização de funil por status de negociação',
                  'Exportação de relatórios para reuniões de performance'
                ].map((item, i) => (
                  <motion.li key={i} {...fadeUp(0.2 + i*0.1)} className="flex items-center gap-3 text-foreground font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div {...fadeUp(0.3)} className="flex-1 w-full relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur-3xl rounded-full" />
              <div className="relative rounded-2xl border border-border bg-card p-6 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                
                <div className="space-y-4">
                  {/* Mock UI Row */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 font-bold">JD</div>
                      <div>
                        <div className="font-bold text-sm">João da Silva</div>
                        <div className="text-xs text-muted-foreground">Troca de Óleo - Honda Civic</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-500 font-black text-lg">95%</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Score</div>
                    </div>
                  </div>
                  
                  {/* Mock UI Row 2 */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 font-bold">MA</div>
                      <div>
                        <div className="font-bold text-sm">Maria Alves</div>
                        <div className="text-xs text-muted-foreground">Revisão Completa</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-rose-500 font-black text-lg flex items-center gap-1">
                        <Clock className="w-4 h-4" /> 45m
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Aguardando</div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 text-center px-6">
        <motion.div {...fadeUp(0)} className="max-w-2xl mx-auto space-y-8">
          <Target className="w-16 h-16 mx-auto text-indigo-500 opacity-50" />
          <h2 className="text-4xl font-black tracking-tight">Pronto para assumir o controle?</h2>
          <p className="text-lg text-muted-foreground">Explore o Dashboard agora mesmo e veja os números da sua rede ganharem vida em tempo real.</p>
        </motion.div>
      </section>

    </div>
  );
};

export default Presentation;
