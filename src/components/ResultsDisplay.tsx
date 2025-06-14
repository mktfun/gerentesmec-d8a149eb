import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Home, DollarSign, PiggyBank, FileText, Download, Target, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimulationData } from '@/pages/Index';
import { formatCurrency } from '@/utils/formatters';

interface ResultsDisplayProps {
  data: SimulationData | null;
  isLoading: boolean;
}

export const ResultsDisplay = ({ data, isLoading }: ResultsDisplayProps) => {
  if (isLoading) {
    return (
      <Card className="glass-card p-8 apple-shadow-lg">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-apple-blue-200 border-t-apple-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">Processando Simulação</h3>
            <p className="text-slate-500">Calculando os melhores cenários...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="glass-card p-8 apple-shadow-lg">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 bg-apple-blue-100 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-apple-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">Aguardando Simulação</h3>
            <p className="text-slate-500">Preencha os dados ao lado para ver os resultados</p>
          </div>
        </div>
      </Card>
    );
  }

  const exportSimulation = () => {
    const simulationReport = {
      timestamp: new Date().toISOString(),
      creditValue: data.creditValue,
      installments: data.installments,
      contemplationTime: data.contemplationTime,
      monthlyPayment: data.monthlyPayment,
      totalPaid: data.totalPaid,
      scenarios: data.scenarios
    };

    localStorage.setItem('lastSimulation', JSON.stringify(simulationReport));
    
    // Create downloadable report
    const reportContent = `
RELATÓRIO DE SIMULAÇÃO - CONSÓRCIO FLASH SIM
============================================

DADOS BÁSICOS:
- Valor do Crédito: ${formatCurrency(data.creditValue)}
- Parcelas: ${data.installments}
- Tempo de Contemplação: ${data.contemplationTime} meses
- Valor da Parcela: ${formatCurrency(data.monthlyPayment)}
- Total Pago: ${formatCurrency(data.totalPaid)}

CENÁRIOS:

1. ${data.scenarios.quotaSale.title}
   - Retorno Total: ${formatCurrency(data.scenarios.quotaSale.totalReturn)}
   - Lucro: ${formatCurrency(data.scenarios.quotaSale.profit)}
   - Rentabilidade: ${data.scenarios.quotaSale.profitPercentage.toFixed(2)}%
   - Ágio: ${(data.scenarios.quotaSale.agio * 100).toFixed(0)}%

2. ${data.scenarios.propertyAcquisition.title}
   - Valor do Imóvel: ${formatCurrency(data.scenarios.propertyAcquisition.propertyValue)}
   - Renda Mensal: ${formatCurrency(data.scenarios.propertyAcquisition.monthlyRental)}
   - Parcela Pós-Contemplação: ${formatCurrency(data.scenarios.propertyAcquisition.postContemplationPayment)}
   - Retorno Líquido: ${formatCurrency(data.scenarios.propertyAcquisition.netMonthlyReturn)}

3. ${data.scenarios.appliedCredit.title}
   - Valor Aplicado: ${formatCurrency(data.scenarios.appliedCredit.appliedValue)}
   - Taxa de Retorno: ${data.scenarios.appliedCredit.investmentReturn.toFixed(2)}% a.a.
   - Valor Final: ${formatCurrency(data.scenarios.appliedCredit.finalValue)}
   - Lucro Total: ${formatCurrency(data.scenarios.appliedCredit.totalProfit)}

Relatório gerado em: ${new Date().toLocaleString('pt-BR')}
`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulacao-consorcio-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hasBid = data.bidValue > 0;
  const hasReducedPayment = data.reducedPaymentEnabled;
  const hasEmbeddedBid = data.embeddedBidValue > 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="glass-card p-6 apple-shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Resumo da Simulação</h3>
              <p className="text-sm text-slate-500">Dados principais calculados</p>
            </div>
          </div>
          <Button
            onClick={exportSimulation}
            variant="outline"
            size="sm"
            className="glass-button border-slate-200 hover:border-apple-blue-300 hover:bg-apple-blue-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-800 font-medium mb-1">Valor do Crédito</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(data.creditValue)}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-800 font-medium mb-1">
              Parcela {hasReducedPayment ? 'Reduzida' : 'Inicial'}
            </p>
            <p className="text-2xl font-bold text-apple-blue-600">{formatCurrency(data.monthlyPayment)}</p>
            {hasReducedPayment && (
              <p className="text-xs text-slate-600 mt-1">{data.reducedPaymentPercentage}% da parcela</p>
            )}
          </div>
        </div>

        {hasBid && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <p className="text-sm text-purple-900 font-medium mb-1">Valor do Lance Total</p>
              <p className="text-xl font-bold text-purple-900">{formatCurrency(data.bidValue)}</p>
              {hasEmbeddedBid && (
                <p className="text-xs text-purple-700 mt-1">
                  Embutido: {formatCurrency(data.embeddedBidValue)}
                </p>
              )}
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <p className="text-sm text-orange-900 font-medium mb-1">Parcela Pós-Contemplação</p>
              <p className="text-xl font-bold text-orange-900">{formatCurrency(data.postContemplationPayment)}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <p className="text-sm text-blue-900 font-medium mb-1">Prazo Final</p>
              <p className="text-xl font-bold text-blue-900">{data.finalTerm} meses</p>
            </div>
          </div>
        )}

        {hasEmbeddedBid && (
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg mb-4">
            <p className="text-sm text-indigo-900 font-medium mb-1">Crédito Disponível</p>
            <p className="text-2xl font-bold text-indigo-900">{formatCurrency(data.availableCredit)}</p>
            <p className="text-xs text-indigo-700 mt-1">Após desconto do lance embutido</p>
          </div>
        )}

        <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
          <p className="text-sm text-green-900 font-medium mb-1">Total Investido</p>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(data.totalInvested)}</p>
          <p className="text-xs text-green-700 mt-1">Valor pago até a contemplação</p>
        </div>
      </Card>

      {/* Scenarios */}
      <Card className="glass-card apple-shadow-lg">
        <Tabs defaultValue="sale" className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="sale" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <DollarSign className="w-4 h-4" />
              Venda da Cota
            </TabsTrigger>
            <TabsTrigger value="property" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Home className="w-4 h-4" />
              Imóvel
            </TabsTrigger>
            <TabsTrigger value="investment" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <PiggyBank className="w-4 h-4" />
              Investimento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sale" className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Cenário 1
              </Badge>
              <h3 className="text-xl font-bold text-slate-900">{data.scenarios.quotaSale.title}</h3>
              {hasBid && (
                <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                  <Target className="w-3 h-3 mr-1" />
                  Com Lance
                </Badge>
              )}
              {hasReducedPayment && (
                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                  <Percent className="w-3 h-3 mr-1" />
                  Parcela Reduzida
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <p className="text-sm text-green-900 font-medium mb-1">Retorno Total</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(data.scenarios.quotaSale.totalReturn)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-1">Lucro Líquido</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(data.scenarios.quotaSale.profit)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <p className="text-sm text-purple-900 font-medium mb-1">Rentabilidade</p>
                <p className="text-2xl font-bold text-purple-900">{data.scenarios.quotaSale.profitPercentage.toFixed(2)}%</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                <p className="text-sm text-orange-900 font-medium mb-1">Ágio de Venda</p>
                <p className="text-2xl font-bold text-orange-900">{data.scenarios.quotaSale.agio.toFixed(0)}%</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="property" className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Cenário 2
              </Badge>
              <h3 className="text-xl font-bold text-slate-900">{data.scenarios.propertyAcquisition.title}</h3>
              {hasBid && (
                <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                  <Target className="w-3 h-3 mr-1" />
                  Com Lance
                </Badge>
              )}
              {hasReducedPayment && (
                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                  <Percent className="w-3 h-3 mr-1" />
                  Parcela Reduzida
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-1">Valor do Imóvel</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(data.scenarios.propertyAcquisition.propertyValue)}</p>
                <p className="text-xs text-blue-700 mt-1">{hasEmbeddedBid ? 'Crédito Disponível Corrigido' : 'Crédito Corrigido'}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <p className="text-sm text-green-900 font-medium mb-1">Valor da Locação</p>
                <p className="text-xl font-bold text-green-900">{formatCurrency(data.scenarios.propertyAcquisition.monthlyRental)}</p>
                <p className="text-xs text-green-700 mt-1">1% ao mês</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <p className="text-sm text-orange-900 font-medium mb-1">Parcela Pós-Contemplação</p>
                <p className="text-xl font-bold text-orange-900">{formatCurrency(data.scenarios.propertyAcquisition.postContemplationPayment)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <p className="text-sm text-purple-900 font-medium mb-1">Retorno Mensal Líquido</p>
                <p className="text-xl font-bold text-purple-900">{formatCurrency(data.scenarios.propertyAcquisition.netMonthlyReturn)}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="investment" className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Cenário 3
              </Badge>
              <h3 className="text-xl font-bold text-slate-900">{data.scenarios.appliedCredit.title}</h3>
              {hasBid && (
                <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                  <Target className="w-3 h-3 mr-1" />
                  Com Lance
                </Badge>
              )}
              {hasReducedPayment && (
                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                  <Percent className="w-3 h-3 mr-1" />
                  Parcela Reduzida
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-1">Valor Aplicado</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(data.scenarios.appliedCredit.appliedValue)}</p>
                <p className="text-xs text-blue-700 mt-1">{hasEmbeddedBid ? 'Crédito Disponível Corrigido' : 'Crédito Corrigido'}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <p className="text-sm text-green-900 font-medium mb-1">Taxa de Retorno</p>
                <p className="text-xl font-bold text-green-900">{data.scenarios.appliedCredit.investmentReturn.toFixed(2)}% a.a.</p>
                <p className="text-xs text-green-700 mt-1">Por {data.scenarios.appliedCredit.monthsToApply} meses</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
                <p className="text-sm text-orange-900 font-medium mb-1">Valor Final</p>
                <p className="text-xl font-bold text-orange-900">{formatCurrency(data.scenarios.appliedCredit.finalValue)}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <p className="text-sm text-purple-900 font-medium mb-1">Lucro Total</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(data.scenarios.appliedCredit.totalProfit)}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
