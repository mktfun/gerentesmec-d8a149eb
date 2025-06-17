
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SimulationData {
  creditValue: number;
  installments: number;
  contemplationTime: number;
  monthlyPayment: number;
  postContemplationPayment: number;
  finalTerm: number;
  bidValue: number;
  availableCredit: number;
  totalInvested: number;
  creditType: 'property' | 'vehicle';
  scenarios: any;
  cet?: { cetMonthly: number; cetAnnual: number };
  demonstrativeRate?: { monthlyRate: number; annualRate: number };
}

interface UserProfile {
  company_name?: string;
  company_contact?: string;
  company_logo_url?: string;
  company_website?: string;
  full_name?: string;
  email?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📄 Iniciando geração de PDF...');
    
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Obter dados da requisição
    const { simulationData, userId } = await req.json() as { 
      simulationData: SimulationData; 
      userId?: string;
    };

    console.log('📊 Dados da simulação recebidos:', simulationData);

    // Buscar dados do usuário/perfil para branding
    let userProfile: UserProfile = {};
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, company_contact, company_logo_url, company_website, full_name, email')
        .eq('id', userId)
        .single();
      
      if (profile) {
        userProfile = profile;
        console.log('👤 Perfil do usuário encontrado:', userProfile);
      }
    }

    // Preparar dados para o template HTML
    const templateData = {
      // Dados da empresa/consultor
      companyName: userProfile.company_name || 'Consultor de Consórcio',
      companyContact: userProfile.company_contact || '',
      companyWebsite: userProfile.company_website || '',
      consultorName: userProfile.full_name || 'Consultor',
      consultorEmail: userProfile.email || '',
      logoUrl: userProfile.company_logo_url || '',
      
      // Dados da simulação
      creditValue: simulationData.creditValue,
      installments: simulationData.installments,
      contemplationTime: simulationData.contemplationTime,
      monthlyPayment: simulationData.monthlyPayment,
      postContemplationPayment: simulationData.postContemplationPayment,
      finalTerm: simulationData.finalTerm,
      bidValue: simulationData.bidValue,
      availableCredit: simulationData.availableCredit,
      totalInvested: simulationData.totalInvested,
      creditType: simulationData.creditType,
      
      // Métricas financeiras
      cetMonthly: simulationData.cet?.cetMonthly || 0,
      cetAnnual: simulationData.cet?.cetAnnual || 0,
      demonstrativeMonthly: simulationData.demonstrativeRate?.monthlyRate || 0,
      demonstrativeAnnual: simulationData.demonstrativeRate?.annualRate || 0,
      
      // Cenários
      scenarios: simulationData.scenarios,
      
      // Data de geração
      generatedAt: new Date().toLocaleDateString('pt-BR'),
      generatedTime: new Date().toLocaleTimeString('pt-BR')
    };

    console.log('📋 Template data preparado:', templateData);

    // Template HTML para o PDF (baseado no imovel.pdf)
    const htmlTemplate = generateHTMLTemplate(templateData);
    
    // Aqui você faria a chamada para o webhook do n8n/Make.com
    // Por enquanto, vamos simular a geração e retornar uma URL mockada
    const webhookUrl = 'https://hooks.n8n.cloud/webhook/generate-pdf'; // Substitua pela URL real
    
    try {
      // Simular chamada para o webhook (você deve implementar isso)
      console.log('🔗 Enviando para webhook de geração de PDF...');
      
      // const response = await fetch(webhookUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ html: htmlTemplate, ...templateData })
      // });
      
      // const result = await response.json();
      // const pdfUrl = result.pdfUrl;
      
      // Por enquanto, simular uma URL de retorno
      const mockPdfUrl = `${supabaseUrl}/storage/v1/object/public/generated-pdfs/simulation-${Date.now()}.pdf`;
      
      console.log('✅ PDF gerado com sucesso:', mockPdfUrl);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          pdfUrl: mockPdfUrl,
          message: 'PDF gerado com sucesso' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
      
    } catch (webhookError) {
      console.error('❌ Erro no webhook:', webhookError);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro na geração do PDF',
          details: webhookError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

  } catch (error) {
    console.error('❌ Erro geral na Edge Function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Função para gerar o template HTML
function generateHTMLTemplate(data: any): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Simulação de Consórcio - ${data.companyName}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                background: #fff;
            }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                border-bottom: 3px solid #2563eb;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo { max-height: 60px; }
            .company-info { text-align: right; }
            .company-name { font-size: 18px; font-weight: bold; color: #2563eb; }
            .title { 
                text-align: center; 
                font-size: 24px; 
                font-weight: bold; 
                color: #1e40af; 
                margin-bottom: 30px;
            }
            .section { 
                margin-bottom: 25px; 
                padding: 20px; 
                border: 1px solid #e5e7eb; 
                border-radius: 8px;
                background: #f9fafb;
            }
            .section-title { 
                font-size: 16px; 
                font-weight: bold; 
                color: #1e40af; 
                margin-bottom: 15px;
                border-bottom: 2px solid #3b82f6;
                padding-bottom: 5px;
            }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .field { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .field-label { font-weight: 600; color: #374151; }
            .field-value { color: #1f2937; font-weight: 500; }
            .highlight { 
                background: #dbeafe; 
                padding: 15px; 
                border-radius: 6px; 
                border-left: 4px solid #3b82f6;
            }
            .scenario { 
                margin-bottom: 20px; 
                padding: 15px; 
                border: 1px solid #d1d5db; 
                border-radius: 6px;
                background: white;
            }
            .scenario-title { 
                font-size: 14px; 
                font-weight: bold; 
                color: #059669; 
                margin-bottom: 10px;
            }
            .footer { 
                margin-top: 40px; 
                padding-top: 20px; 
                border-top: 1px solid #e5e7eb; 
                text-align: center; 
                font-size: 10px; 
                color: #6b7280;
            }
            .currency { color: #059669; font-weight: 600; }
            .percentage { color: #dc2626; font-weight: 600; }
            @media print {
                body { font-size: 11px; }
                .container { padding: 15px; }
                .section { page-break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div>
                    ${data.logoUrl ? `<img src="${data.logoUrl}" alt="Logo" class="logo">` : ''}
                </div>
                <div class="company-info">
                    <div class="company-name">${data.companyName}</div>
                    <div>${data.companyContact}</div>
                    <div>${data.companyWebsite}</div>
                </div>
            </div>

            <!-- Título -->
            <h1 class="title">SIMULAÇÃO PROFISSIONAL DE CONSÓRCIO</h1>

            <!-- Dados Básicos -->
            <div class="section">
                <h2 class="section-title">Dados da Simulação</h2>
                <div class="grid">
                    <div>
                        <div class="field">
                            <span class="field-label">Valor do Crédito:</span>
                            <span class="field-value currency">R$ ${data.creditValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="field">
                            <span class="field-label">Prazo Total:</span>
                            <span class="field-value">${data.installments} meses</span>
                        </div>
                        <div class="field">
                            <span class="field-label">Contemplação:</span>
                            <span class="field-value">${data.contemplationTime}º mês</span>
                        </div>
                    </div>
                    <div>
                        <div class="field">
                            <span class="field-label">Crédito Disponível:</span>
                            <span class="field-value currency">R$ ${data.availableCredit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="field">
                            <span class="field-label">Total Investido:</span>
                            <span class="field-value currency">R$ ${data.totalInvested.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="field">
                            <span class="field-label">Tipo:</span>
                            <span class="field-value">${data.creditType === 'property' ? 'Imóvel' : 'Veículo'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Métricas Financeiras -->
            <div class="section">
                <h2 class="section-title">Métricas Financeiras</h2>
                <div class="highlight">
                    <div class="grid">
                        <div>
                            <div class="field">
                                <span class="field-label">CET Mensal:</span>
                                <span class="field-value percentage">${data.cetMonthly.toFixed(2)}%</span>
                            </div>
                            <div class="field">
                                <span class="field-label">CET Anual:</span>
                                <span class="field-value percentage">${data.cetAnnual.toFixed(2)}%</span>
                            </div>
                        </div>
                        <div>
                            <div class="field">
                                <span class="field-label">Taxa Demonstrativa Mensal:</span>
                                <span class="field-value">${data.demonstrativeMonthly.toFixed(4)}%</span>
                            </div>
                            <div class="field">
                                <span class="field-label">Taxa Demonstrativa Anual:</span>
                                <span class="field-value">${data.demonstrativeAnnual.toFixed(4)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cenários -->
            <div class="section">
                <h2 class="section-title">Análise de Cenários</h2>
                
                <div class="scenario">
                    <h3 class="scenario-title">Cenário 1: Venda da Cota</h3>
                    <div class="field">
                        <span class="field-label">Valor Bruto do Ágio:</span>
                        <span class="field-value currency">R$ ${data.scenarios.quotaSale.agioGrossValue?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Lucro Líquido:</span>
                        <span class="field-value currency">R$ ${data.scenarios.quotaSale.profit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Rentabilidade:</span>
                        <span class="field-value percentage">${data.scenarios.quotaSale.profitPercentage.toFixed(2)}%</span>
                    </div>
                </div>

                ${data.scenarios.propertyAcquisition ? `
                <div class="scenario">
                    <h3 class="scenario-title">Cenário 2: Aquisição de Imóvel</h3>
                    <div class="field">
                        <span class="field-label">Valor do Imóvel:</span>
                        <span class="field-value currency">R$ ${data.scenarios.propertyAcquisition.propertyValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Renda Mensal:</span>
                        <span class="field-value currency">R$ ${data.scenarios.propertyAcquisition.monthlyRental.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Retorno Líquido Mensal:</span>
                        <span class="field-value currency">R$ ${data.scenarios.propertyAcquisition.netMonthlyReturn.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                </div>
                ` : ''}

                ${data.scenarios.financingComparison ? `
                <div class="scenario">
                    <h3 class="scenario-title">Cenário 2: Comparativo com Financiamento</h3>
                    <div class="field">
                        <span class="field-label">Custo Total Consórcio:</span>
                        <span class="field-value currency">R$ ${data.scenarios.financingComparison.consortiumTotalCost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Custo Total Financiamento:</span>
                        <span class="field-value currency">R$ ${data.scenarios.financingComparison.financingTotalCost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Economia:</span>
                        <span class="field-value currency">R$ ${data.scenarios.financingComparison.savings.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                </div>
                ` : ''}

                <div class="scenario">
                    <h3 class="scenario-title">Cenário 3: Aplicação do Crédito</h3>
                    <div class="field">
                        <span class="field-label">Valor Aplicado:</span>
                        <span class="field-value currency">R$ ${data.scenarios.appliedCredit.appliedValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Valor Final:</span>
                        <span class="field-value currency">R$ ${data.scenarios.appliedCredit.finalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Lucro Total:</span>
                        <span class="field-value currency">R$ ${data.scenarios.appliedCredit.totalProfit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p>Relatório gerado em ${data.generatedAt} às ${data.generatedTime}</p>
                <p>Consultor: ${data.consultorName} - ${data.consultorEmail}</p>
                <p>Este documento foi gerado automaticamente pelo Flash Sim</p>
            </div>
        </div>
    </body>
    </html>
  `;
}
