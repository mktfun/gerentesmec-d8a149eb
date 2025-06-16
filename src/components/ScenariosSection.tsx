
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, DollarSign, Home } from 'lucide-react';
import { SimulationData } from '@/pages/Index';
import { formatPercentage } from '@/utils/financialMetrics';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';

interface ScenariosSectionProps {
  data: SimulationData;
  isLoading: boolean;
}

export const ScenariosSection = ({ data, isLoading }: ScenariosSectionProps) => {
  const [quotaSaleAgio, setQuotaSaleAgio] = useState(15);
  const [investmentReturn, setInvestmentReturn] = useState(12);

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">Execute uma simulação para ver os cenários de análise</p>
      </Card>
    );
  }

  // Recalcular cenário 1 com ágio dinâmico
  const quotaSaleProfit = data.totalInvested * (quotaSaleAgio / 100);
  const quotaSaleValue = data.totalInvested + quotaSaleProfit;
  const quotaSaleProfitPercentage = (quotaSaleProfit / data.totalInvested) * 100;

  // Recalcular cenário 3 FIXADO EM TAXA ANUAL
  const appliedValue = data.availableCredit * (data.creditType === 'property' ? 1.06 : 1.05);
  const annualReturn = investmentReturn / 100;
  const yearsToApply = data.finalTerm / 12;
  const finalValue = appliedValue * Math.pow(1 + annualReturn, yearsToApply);
  const totalProfit = finalValue - appliedValue;

  // Dados para o Waterfall Chart APRIMORADO (Cenário 2)
  const waterfallData = data.scenarios.propertyAcquisition ? [
    {
      name: 'Renda\nMensal',
      value: data.scenarios.propertyAcquisition.monthlyRental,
      type: 'positive',
      cumulative: data.scenarios.propertyAcquisition.monthlyRental,
      displayValue: data.scenarios.propertyAcquisition.monthlyRental
    },
    {
      name: 'Parcela\nConsórcio',
      value: -data.scenarios.propertyAcquisition.postContemplationPayment,
      type: 'negative',
      cumulative: data.scenarios.propertyAcquisition.monthlyRental - data.scenarios.propertyAcquisition.postContemplationPayment,
      displayValue: data.scenarios.propertyAcquisition.postContemplationPayment
    },
    {
      name: 'Saldo\nLíquido',
      value: data.scenarios.propertyAcquisition.netMonthlyReturn,
      type: data.scenarios.propertyAcquisition.netMonthlyReturn >= 0 ? 'result-positive' : 'result-negative',
      cumulative: data.scenarios.propertyAcquisition.netMonthlyReturn,
      displayValue: Math.abs(data.scenarios.propertyAcquisition.netMonthlyReturn)
    }
  ] : [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(value));
  };

  const CustomWaterfallTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-slate-300 rounded-lg shadow-lg">
          <p className="font-bold text-slate-900 mb-2">{label.replace('\n', ' ')}</p>
          <p className={`text-lg font-semibold ${
            data.type === 'positive' ? 'text-green-600' : 
            data.type === 'negative' ? 'text-red-600' : 
            data.type === 'result-positive' ? 'text-blue-600' : 'text-red-600'
          }`}>
            {data.type === 'negative' ? '-' : '+'}
            {formatCurrency(data.displayValue)}
          </p>
          {data.type.includes('result') && (
            <p className="text-xs text-slate-600 mt-1">
              {data.type === 'result-positive' ? 'Lucro mensal' : 'Déficit mensal'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white backdrop-blur-sm border border-slate-300 shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Análise de Cenários</h2>
          <p className="text-slate-700 font-medium">Compare as opções de investimento</p>
        </div>
      </div>

      <Tabs defaultValue="quotaSale" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100">
          <TabsTrigger value="quotaSale" className="flex items-center gap-2 text-slate-700 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <DollarSign className="w-4 h-4" />
            Venda da Cota
          </TabsTrigger>
          <TabsTrigger value="property" className="flex items-center gap-2 text-slate-700 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Home className="w-4 h-4" />
            {data.creditType === 'property' ? 'Imóvel' : 'Comparativo'}
          </TabsTrigger>
          <TabsTrigger value="investment" className="flex items-center gap-2 text-slate-700 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4" />
            Investimento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotaSale">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <h3 className="text-xl font-bold text-green-900 mb-4">💰 Venda da Cota na Contemplação</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quotaSaleAgio" className="text-sm font-semibold text-green-800">
                    Ágio de Venda (%)
                  </Label>
                  <Input
                    id="quotaSaleAgio"
                    type="number"
                    value={quotaSaleAgio}
                    onChange={(e) => setQuotaSaleAgio(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="50"
                    step="0.1"
                    className="border-green-300 focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>
                
                <div className="bg-white/80 p-4 rounded-lg border border-green-200">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-700 font-medium">Total Investido:</span>
                      <span className="font-bold text-green-900">{formatCurrency(data.totalInvested)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700 font-medium">Lucro com Ágio:</span>
                      <span className="font-bold text-green-900">{formatCurrency(quotaSaleProfit)}</span>
                    </div>
                    <div className="border-t border-green-200 pt-2">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold text-green-800">Valor Total:</span>
                        <span className="font-bold text-green-900">{formatCurrency(quotaSaleValue)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 p-4 rounded-lg border border-green-200">
                <h4 className="font-bold text-green-900 mb-3">Resumo do Investimento</h4>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {formatPercentage(quotaSaleProfitPercentage)}
                    </div>
                    <div className="text-sm text-green-700 font-medium">Rentabilidade Total</div>
                  </div>
                  <div className="text-center pt-2 border-t border-green-200">
                    <div className="text-sm text-green-700">
                      Tempo de investimento: <span className="font-semibold">{data.contemplationTime} meses</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="property">
          {data.scenarios.propertyAcquisition ? (
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-4">🏠 Aquisição de Imóvel</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/80 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-4">Dados do Imóvel</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">Valor do Imóvel:</span>
                      <span className="font-bold">{formatCurrency(data.scenarios.propertyAcquisition.propertyValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">Renda Mensal (1%):</span>
                      <span className="font-bold text-green-600">{formatCurrency(data.scenarios.propertyAcquisition.monthlyRental)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">Parcela Consórcio:</span>
                      <span className="font-bold text-red-600">{formatCurrency(data.scenarios.propertyAcquisition.postContemplationPayment)}</span>
                    </div>
                    <div className="border-t border-blue-200 pt-2">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold text-blue-800">Saldo Líquido:</span>
                        <span className={`font-bold ${data.scenarios.propertyAcquisition.netMonthlyReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(data.scenarios.propertyAcquisition.netMonthlyReturn)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/80 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-4">Fluxo de Caixa Mensal</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11, fill: '#1e40af', fontWeight: 600 }}
                        axisLine={{ stroke: '#3b82f6', strokeWidth: 2 }}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#1e40af', fontWeight: 600 }}
                        tickFormatter={(value) => `R$ ${(Math.abs(value)/1000).toFixed(0)}k`}
                        axisLine={{ stroke: '#3b82f6', strokeWidth: 2 }}
                      />
                      <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" strokeWidth={2} />
                      <Tooltip content={<CustomWaterfallTooltip />} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {waterfallData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.type === 'positive' ? '#10b981' : 
                              entry.type === 'negative' ? '#ef4444' : 
                              entry.type === 'result-positive' ? '#3b82f6' : '#dc2626'
                            } 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          ) : data.scenarios.financingComparison ? (
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <h3 className="text-xl font-bold text-orange-900 mb-4">🚗 Comparativo: Consórcio vs. Financiamento</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/80 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-bold text-orange-900 mb-4">Custos Comparativos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-orange-700 font-medium">Custo Total Consórcio:</span>
                      <span className="font-bold">{formatCurrency(data.scenarios.financingComparison.consortiumTotalCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-700 font-medium">Custo Total Financiamento:</span>
                      <span className="font-bold">{formatCurrency(data.scenarios.financingComparison.financingTotalCost)}</span>
                    </div>
                    <div className="border-t border-orange-200 pt-2">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold text-orange-800">Economia:</span>
                        <span className="font-bold text-green-600">{formatCurrency(data.scenarios.financingComparison.savings)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/80 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-bold text-orange-900 mb-3">Vantagem do Consórcio</h4>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatPercentage(data.scenarios.financingComparison.savingsPercentage)}
                    </div>
                    <div className="text-sm text-orange-700 font-medium">Economia Total</div>
                  </div>
                </div>
              </div>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="investment">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <h3 className="text-xl font-bold text-purple-900 mb-4">📈 Crédito Aplicado em Investimentos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="investmentReturn" className="text-sm font-semibold text-purple-800">
                    Taxa de Retorno Anual (%)
                  </Label>
                  <Input
                    id="investmentReturn"
                    type="number"
                    value={investmentReturn}
                    onChange={(e) => setInvestmentReturn(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="50"
                    step="0.1"
                    className="border-purple-300 focus:border-purple-500 focus:ring-purple-500/20"
                  />
                </div>
                
                <div className="bg-white/80 p-4 rounded-lg border border-purple-200">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-purple-700 font-medium">Valor Aplicado:</span>
                      <span className="font-bold text-purple-900">{formatCurrency(appliedValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700 font-medium">Período:</span>
                      <span className="font-bold text-purple-900">{yearsToApply.toFixed(1)} anos</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700 font-medium">Valor Final:</span>
                      <span className="font-bold text-purple-900">{formatCurrency(finalValue)}</span>
                    </div>
                    <div className="border-t border-purple-200 pt-2">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold text-purple-800">Lucro Total:</span>
                        <span className="font-bold text-green-600">{formatCurrency(totalProfit)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 p-4 rounded-lg border border-purple-200">
                <h4 className="font-bold text-purple-900 mb-3">Projeção de Rendimento</h4>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {formatPercentage((totalProfit / appliedValue) * 100)}
                    </div>
                    <div className="text-sm text-purple-700 font-medium">Rentabilidade Total</div>
                  </div>
                  <div className="text-center pt-2 border-t border-purple-200">
                    <div className="text-sm text-purple-700">
                      Rendimento anual: <span className="font-semibold">{formatPercentage(investmentReturn)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
