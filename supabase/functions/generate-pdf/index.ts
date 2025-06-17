
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
    console.log('📄 Iniciando geração de PDF (V2.0 ESTABILIZADA)...');
    
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Obter dados da requisição
    const { simulationData, userId } = await req.json() as { 
      simulationData: SimulationData; 
      userId?: string;
    };

    console.log('📊 Dados da simulação recebidos (V2.0):', simulationData);

    // Validação básica dos dados
    if (!simulationData || !simulationData.creditValue) {
      throw new Error('Dados de simulação inválidos ou ausentes');
    }

    // Buscar dados do usuário/perfil para branding
    let userProfile: UserProfile = {
      company_name: 'Consultor de Consórcio',
      company_contact: 'Contato não informado',
      company_website: 'Site não informado',
      full_name: 'Consultor Profissional',
      email: 'contato@consultor.com',
      company_logo_url: ''
    };

    if (userId) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('company_name, company_contact, company_logo_url, company_website, full_name, email')
          .eq('id', userId)
          .single();
        
        if (profile && !profileError) {
          userProfile = { ...userProfile, ...profile };
          console.log('👤 Perfil do usuário encontrado (V2.0):', userProfile);
        } else {
          console.log('⚠️ Perfil não encontrado, usando dados padrão');
        }
      } catch (profileError) {
        console.warn('⚠️ Erro ao buscar perfil, usando dados padrão:', profileError);
      }
    }

    // Preparar dados para o template HTML
    const templateData = {
      // Dados da empresa/consultor
      companyName: userProfile.company_name || 'Consultor de Consórcio',
      companyContact: userProfile.company_contact || 'Contato não informado',
      companyWebsite: userProfile.company_website || 'Site não informado',
      consultorName: userProfile.full_name || 'Consultor Profissional',
      consultorEmail: userProfile.email || 'contato@consultor.com',
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
      
      // Métricas financeiras estabilizadas
      cetMonthly: simulationData.cet?.cetMonthly || 0,
      cetAnnual: simulationData.cet?.cetAnnual || 0,
      demonstrativeMonthly: simulationData.demonstrativeRate?.monthlyRate || 0,
      demonstrativeAnnual: simulationData.demonstrativeRate?.annualRate || 0,
      
      // Cenários
      scenarios: simulationData.scenarios,
      
      // Data de geração
      generatedAt: new Date().toLocaleDateString('pt-BR'),
      generatedTime: new Date().toLocaleTimeString('pt-BR'),
      timestamp: Date.now()
    };

    console.log('📋 Template data preparado (V2.0):', templateData);

    // Template HTML aprimorado
    const htmlTemplate = generateHTMLTemplateV2(templateData);
    
    // Simular PDF enquanto o webhook não está configurado
    try {
      console.log('🔗 Simulando geração de PDF (V2.0)...');
      
      // TODO: Implementar webhook real para n8n/Make.com
      // const webhookUrl = 'https://hooks.n8n.cloud/webhook/generate-pdf-v2';
      // const response = await fetch(webhookUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ html: htmlTemplate, ...templateData })
      // });
      
      // Simular URL do PDF gerado
      const mockPdfUrl = `${supabaseUrl}/storage/v1/object/public/generated-pdfs/simulation-${templateData.timestamp}.pdf`;
      
      console.log('✅ PDF simulado gerado (V2.0):', mockPdfUrl);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          pdfUrl: mockPdfUrl,
          message: 'PDF simulado gerado com sucesso (V2.0)',
          templateGenerated: true,
          dataProcessed: Object.keys(templateData).length
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
      
    } catch (webhookError) {
      console.error('❌ Erro no processo de PDF:', webhookError);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro no processo de geração de PDF',
          details: webhookError.message,
          templateGenerated: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

  } catch (error) {
    console.error('❌ Erro geral na Edge Function (V2.0):', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message,
        version: 'V2.0'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Template HTML V2.0 - Aprimorado e estabilizado
function generateHTMLTemplateV2(data: any): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Simulação de Consórcio V2.0 - ${data.companyName}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                font-size: 12px;
                line-height: 1.5;
                color: #1f2937;
                background: #fff;
            }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                border-bottom: 3px solid #3b82f6;
                padding-bottom: 20px;
                margin-bottom: 30px;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                padding: 20px;
                border-radius: 8px;
            }
            .logo { max-height: 60px; border-radius: 4px; }
            .company-info { text-align: right; }
            .company-name { font-size: 20px; font-weight: bold; color: #3b82f6; margin-bottom: 4px; }
            .company-details { font-size: 11px; color: #64748b; }
            .title { 
                text-align: center; 
                font-size: 28px; 
                font-weight: bold; 
                color: #1e40af; 
                margin-bottom: 30px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .section { 
                margin-bottom: 25px; 
                padding: 20px; 
                border: 1px solid #e5e7eb; 
                border-radius: 8px;
                background: #f9fafb;
                page-break-inside: avoid;
            }
            .section-title { 
                font-size: 16px; 
                font-weight: bold; 
                color: #1e40af; 
                margin-bottom: 15px;
                border-bottom: 2px solid #3b82f6;
                padding-bottom: 8px;
                display: flex;
                align-items: center;
            }
            .section-icon { 
                width: 20px; 
                height: 20px; 
                margin-right: 8px; 
                background: #3b82f6;
                border-radius: 50%;
                display: inline-block;
            }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
            .field { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 10px;
                padding: 8px 0;
                border-bottom: 1px solid #f1f5f9;
            }
            .field:last-child { border-bottom: none; }
            .field-label { font-weight: 600; color: #374151; flex: 1; }
            .field-value { 
                color: #1f2937; 
                font-weight: 700; 
                text-align: right;
                flex: 1;
            }
            .highlight { 
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); 
                padding: 20px; 
                border-radius: 8px; 
                border-left: 5px solid #3b82f6;
                margin: 15px 0;
            }
            .scenario { 
                margin-bottom: 20px; 
                padding: 18px; 
                border: 1px solid #d1d5db; 
                border-radius: 8px;
                background: white;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .scenario-title { 
                font-size: 15px; 
                font-weight: bold; 
                color: #059669; 
                margin-bottom: 12px;
                display: flex;
                align-items: center;
            }
            .scenario-number {
                background: #059669;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                margin-right: 8px;
            }
            .footer { 
                margin-top: 40px; 
                padding-top: 20px; 
                border-top: 2px solid #e5e7eb; 
                text-align: center; 
                font-size: 10px; 
                color: #6b7280;
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
            }
            .currency { color: #059669; font-weight: 700; }
            .percentage { color: #dc2626; font-weight: 700; }
            .percentage.positive { color: #059669; }
            .metric-box {
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 6px;
                padding: 12px;
                text-align: center;
            }
            .metric-label {
                font-size: 10px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
            }
            .metric-value {
                font-size: 16px;
                font-weight: bold;
                color: #1f2937;
            }
            .version-badge {
                position: fixed;
                top: 10px;
                right: 10px;
                background: #3b82f6;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 9px;
                font-weight: bold;
            }
            @media print {
                body { font-size: 11px; }
                .container { padding: 15px; }
                .section { page-break-inside: avoid; }
                .version-badge { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="version-badge">V2.0</div>
        <div class="container">
            <!-- Header Aprimorado -->
            <div class="header">
                <div>
                    ${data.logoUrl ? `<img src="${data.logoUrl}" alt="Logo" class="logo">` : 
                    `<div style="width: 60px; height: 60px; background: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">${data.companyName.charAt(0)}</div>`}
                </div>
                <div class="company-info">
                    <div class="company-name">${data.companyName}</div>
                    <div class="company-details">${data.companyContact}</div>
                    <div class="company-details">${data.companyWebsite}</div>
                    <div class="company-details">Consultor: ${data.consultorName}</div>
                </div>
            </div>

            <!-- Título -->
            <h1 class="title">Simulação Profissional de Consórcio</h1>

            <!-- Dados Básicos -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon"></span>
                    Dados da Simulação
                </h2>
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
                <h2 class="section-title">
                    <span class="section-icon"></span>
                    Métricas Financeiras
                </h2>
                <div class="highlight">
                    <div class="grid-3">
                        <div class="metric-box">
                            <div class="metric-label">CET Mensal</div>
                            <div class="metric-value percentage">${data.cetMonthly.toFixed(4)}%</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-label">CET Anual</div>
                            <div class="metric-value percentage">${data.cetAnnual.toFixed(4)}%</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-label">Taxa Demonstrativa</div>
                            <div class="metric-value">${data.demonstrativeMonthly.toFixed(4)}% a.m.</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cenários V2.0 -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon"></span>
                    Análise de Cenários
                </h2>
                
                <div class="scenario">
                    <h3 class="scenario-title">
                        <span class="scenario-number">1</span>
                        Venda da Cota
                    </h3>
                    <div class="field">
                        <span class="field-label">Valor Bruto do Ágio:</span>
                        <span class="field-value currency">R$ ${data.scenarios?.quotaSale?.agioGrossValue?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Lucro Líquido:</span>
                        <span class="field-value currency">R$ ${data.scenarios?.quotaSale?.profit?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Rentabilidade:</span>
                        <span class="field-value percentage positive">${data.scenarios?.quotaSale?.profitPercentage?.toFixed(2) || '0.00'}%</span>
                    </div>
                </div>

                ${data.scenarios?.propertyAcquisition ? `
                <div class="scenario">
                    <h3 class="scenario-title">
                        <span class="scenario-number">2</span>
                        Aquisição de Imóvel
                    </h3>
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
                    <div class="field">
                        <span class="field-label">Ganho Anual:</span>
                        <span class="field-value currency">R$ ${data.scenarios.propertyAcquisition.annualGain?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}</span>
                    </div>
                </div>
                ` : ''}

                ${data.scenarios?.financingComparison ? `
                <div class="scenario">
                    <h3 class="scenario-title">
                        <span class="scenario-number">2</span>
                        Comparativo com Financiamento
                    </h3>
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
                    <h3 class="scenario-title">
                        <span class="scenario-number">3</span>
                        Aplicação do Crédito
                    </h3>
                    <div class="field">
                        <span class="field-label">Valor Aplicado:</span>
                        <span class="field-value currency">R$ ${data.scenarios?.appliedCredit?.appliedValue?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Valor Final:</span>
                        <span class="field-value currency">R$ ${data.scenarios?.appliedCredit?.finalValue?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Lucro Total:</span>
                        <span class="field-value currency">R$ ${data.scenarios?.appliedCredit?.totalProfit?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Ganho Mensal:</span>
                        <span class="field-value currency">R$ ${data.scenarios?.appliedCredit?.monthlyGain?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Ganho Anual:</span>
                        <span class="field-value currency">R$ ${data.scenarios?.appliedCredit?.annualGain?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}</span>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p><strong>Relatório gerado em ${data.generatedAt} às ${data.generatedTime}</strong></p>
                <p>Consultor: ${data.consultorName} - ${data.consultorEmail}</p>
                <p>Este documento foi gerado automaticamente pelo Flash Sim V2.0</p>
                <p style="margin-top: 10px; font-size: 9px; color: #9ca3af;">
                    Simulação baseada nos dados fornecidos. Os valores são estimativos e podem variar conforme as condições do mercado.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}
