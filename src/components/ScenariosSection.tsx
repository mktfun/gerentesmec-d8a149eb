import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Home, Calculator, PiggyBank, Target, Percent, TrendingUp } from 'lucide-react';
import { SimulationData } from '@/pages/Index';
import { formatCurrency } from '@/utils/formatters';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ScenariosSectionProps {
  data: SimulationData | null;
  isLoading: boolean;
}

export const ScenariosSection = ({ data, isLoading }: ScenariosSectionProps) => {
  const [agioPercentage, setAgioPercentage] = useState(15);
  const [investmentReturn, setInvestmentReturn] = useState(12);

  // Reset interactive values when new simulation data arrives
  useEffect(() => {
    if (data) {
      setAgioPercentage(data.scenarios.quotaSale.agio);
      setInvestmentReturn(data.scenarios.appliedCredit.investmentReturn);
    }
  }, [data]);

  if (!data) return null;

  // Calculate dynamic values based on interactive inputs
  const calculateDynamicQuotaSale = () => {
    const profit = data.totalInvested * (agioPercentage / 100);
    const totalReturn = data.totalInvested + profit;
    const profitPercentage = (profit / data.totalInvested) * 100;
    
    return {
      profit,
      totalReturn,
      profitPercentage,
      agio: agioPercentage
    };
  };

  const calculateDynamicInvestment = () => {
    const annualRate = investmentReturn / 100;
    const appliedValue = data.availableCredit * (1 + (data.creditType === 'property' ? 0.06 : 0.05));
    const finalValue = appliedValue * Math.pow(1 + annualRate, data.finalTerm / 12);
    const totalProfit = finalValue - appliedValue;
    const monthlyGain = totalProfit / data.finalTerm;
    const annualGain = monthlyGain * 12;
    
    return {
      appliedValue,
      investmentReturn,
      finalValue,
      totalProfit,
      monthsToApply: data.finalTerm,
      monthlyGain,
      annualGain
    };
  };

  const dynamicQuotaSale = calculateDynamicQuotaSale();
  const dynamicInvestment = calculateDynamicInvestment();

  const hasBid = data.bidValue > 0;
  const hasReducedPayment = data.reducedPaymentEnabled;
  const isVehicle = data.creditType === 'vehicle';

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // Chart data configurations
  const quotaSalePieData = [
    { name: 'Valor Investido', value: data.totalInvested, fill: '#3B82F6' },
    { name: 'Lucro (Ágio)', value: dynamicQuotaSale.profit, fill: '#10B981' }
  ];

  const investmentPieData = [
    { name: 'Valor Aplicado', value: dynamicInvestment.appliedValue, fill: '#8B5CF6' },
    { name: 'Lucro Total', value: dynamicInvestment.totalProfit, fill: '#F59E0B' }
  ];

  const waterfallData = data.scenarios.propertyAcquisition ? [
    { 
      name: 'Renda Mensal', 
      valor: data.scenarios.propertyAcquisition.monthlyRental,
      fill: '#10B981'
    },
    { 
      name: 'Parcela', 
      valor: -data.scenarios.propertyAcquisition.postContemplationPayment,
      fill: '#EF4444'
    },
    {
      name: 'Saldo Líquido',
      valor: data.scenarios.propertyAcquisition.netMonthlyReturn,
      fill: '#8B5CF6'
    }
  ] : [];

  const generateLineChartData = () => {
    const points = [];
    const annualRate = investmentReturn / 100;
    
    const intervals = Math.min(24, Math.max(12, Math.floor(dynamicInvestment.monthsToApply / 12)));
    const step = Math.floor(dynamicInvestment.monthsToApply / intervals);
    
    for (let i = 0; i <= dynamicInvestment.monthsToApply; i += step) {
      const value = dynamicInvestment.appliedValue * Math.pow(1 + annualRate, i / 12);
      points.push({
        mes: i,
        valor: value
      });
    }
    return points;
  };

  const lineChartData = generateLineChartData();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Análise de Cenários</h2>
        <p className="text-lg text-slate-600">Explore as diferentes possibilidades de rentabilidade</p>
      </div>

      <Card className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl p-8">
        <Tabs defaultValue="sale" className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-slate-100 p-1 rounded-xl mb-8">
            <TabsTrigger value="sale" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
              <DollarSign className="w-4 h-4" />
              Venda da Cota
            </TabsTrigger>
            <TabsTrigger value="scenario2" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
              {isVehicle ? <Calculator className="w-4 h-4" /> : <Home className="w-4 h-4" />}
              {isVehicle ? 'Comparativo' : 'Imóvel'}
            </TabsTrigger>
            <TabsTrigger value="investment" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
              <TrendingUp className="w-4 h-4" />
              Investimento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sale" className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
              <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1 border-0">
                Cenário 1
              </Badge>
              <h3 className="text-2xl font-bold text-slate-900">{data.scenarios.quotaSale.title}</h3>
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

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
                  <Label className="text-base font-semibold text-slate-700 mb-3 block">Configurar Ágio de Venda</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={agioPercentage}
                      onChange={(e) => setAgioPercentage(Number(e.target.value))}
                      className="w-24 h-12 text-lg font-semibold text-center border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      min="0"
                      max="100"
                      step="1"
                    />
                    <span className="text-lg font-medium text-slate-600">%</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Ajuste o percentual de ágio para ver o impacto nos resultados</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <p className="text-sm text-green-800 font-medium mb-2">Retorno Total</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(dynamicQuotaSale.totalReturn)}</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-800 font-medium mb-2">Lucro Líquido</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(dynamicQuotaSale.profit)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <p className="text-sm text-purple-800 font-medium mb-2">Rentabilidade</p>
                    <p className="text-2xl font-bold text-purple-900">{formatPercentage(dynamicQuotaSale.profitPercentage)}</p>
                  </div>
                  <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                    <p className="text-sm text-orange-800 font-medium mb-2">Ágio Aplicado</p>
                    <p className="text-2xl font-bold text-orange-900">{formatPercentage(agioPercentage)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <h4 className="text-xl font-bold text-slate-900 mb-6 text-center">Composição do Retorno</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={quotaSalePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {quotaSalePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm font-medium text-slate-700">Investido</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm font-medium text-slate-700">Lucro</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">💡 Como funciona este cenário:</h4>
              <p className="text-blue-800 leading-relaxed">
                Neste cenário, você vende sua cota do consórcio no momento da contemplação. 
                O ágio representa o percentual adicional que você recebe sobre o valor investido, 
                sendo uma prática comum no mercado de consórcios contemplados.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="scenario2" className="space-y-8 animate-fade-in">
            {isVehicle && data.scenarios.financingComparison ? (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1 border-0">
                    Cenário 2
                  </Badge>
                  <h3 className="text-2xl font-bold text-slate-900">{data.scenarios.financingComparison.title}</h3>
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
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <p className="text-base text-blue-800 font-semibold mb-2">Custo Total do Consórcio</p>
                    <p className="text-3xl font-bold text-blue-900">{formatCurrency(data.scenarios.financingComparison.consortiumTotalCost)}</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                    <p className="text-base text-red-800 font-semibold mb-2">Custo Total do Financiamento</p>
                    <p className="text-3xl font-bold text-red-900">{formatCurrency(data.scenarios.financingComparison.financingTotalCost)}</p>
                    <p className="text-sm text-red-700 mt-1">Taxa: {formatPercentage(data.financingRate || 0)} a.m.</p>
                  </div>
                </div>
                
                <div className="p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300">
                  <div className="text-center">
                    <p className="text-lg text-green-800 font-semibold mb-3">💰 Economia com Consórcio</p>
                    <p className="text-4xl font-bold text-green-900 mb-2">{formatCurrency(data.scenarios.financingComparison.savings)}</p>
                    <p className="text-xl font-bold text-green-700">
                      {formatPercentage(data.scenarios.financingComparison.savingsPercentage)} de economia
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="text-lg font-semibold text-blue-900 mb-3">💡 Como funciona este cenário:</h4>
                  <p className="text-blue-800 leading-relaxed">
                    Comparação direta entre o custo total de adquirir o veículo através do consórcio 
                    versus um financiamento tradicional. O consórcio geralmente oferece economia significativa 
                    por não haver juros, apenas taxas administrativas.
                  </p>
                </div>
              </>
            ) : (
              data.scenarios.propertyAcquisition && (
                <>
                  <div className="flex items-center gap-2 mb-6">
                    <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1 border-0">
                      Cenário 2
                    </Badge>
                    <h3 className="text-2xl font-bold text-slate-900">{data.scenarios.propertyAcquisition.title}</h3>
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
                  
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                          <p className="text-base text-blue-800 font-semibold mb-2">Valor do Imóvel</p>
                          <p className="text-2xl font-bold text-blue-900">{formatCurrency(data.scenarios.propertyAcquisition.propertyValue)}</p>
                          <p className="text-sm text-blue-700 mt-1">Crédito Corrigido</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                          <p className="text-base text-green-800 font-semibold mb-2">Valor da Locação</p>
                          <p className="text-2xl font-bold text-green-900">{formatCurrency(data.scenarios.propertyAcquisition.monthlyRental)}</p>
                          <p className="text-sm text-green-700 mt-1">1% ao mês</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                          <p className="text-base text-orange-800 font-semibold mb-2">Parcela Pós-Contemplação</p>
                          <p className="text-2xl font-bold text-orange-900">{formatCurrency(data.scenarios.propertyAcquisition.postContemplationPayment)}</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                          <p className="text-base text-purple-800 font-semibold mb-2">Ganho Mensal (Aluguel)</p>
                          <p className="text-2xl font-bold text-purple-900">{formatCurrency(data.scenarios.propertyAcquisition.netMonthlyReturn)}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                        <p className="text-base text-indigo-800 font-semibold mb-2">Ganho Anual (Aluguel)</p>
                        <p className="text-3xl font-bold text-indigo-900">{formatCurrency(data.scenarios.propertyAcquisition.netMonthlyReturn * 12)}</p>
                        <p className="text-sm text-indigo-700 mt-1">Ganho mensal × 12 meses</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border shadow-sm">
                      <h4 className="text-xl font-bold text-slate-900 mb-6 text-center">Fluxo Mensal de Caixa</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tickFormatter={(value) => formatCurrency(Math.abs(value)).replace('R$ ', 'R$')} tick={{ fontSize: 11 }} />
                          <Tooltip 
                            formatter={(value, name) => [formatCurrency(Math.abs(Number(value))), name]} 
                            labelStyle={{ color: '#334155' }}
                            contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                          />
                          <Bar dataKey="valor" radius={[4, 4, 0, 0]} fill="#8B5CF6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-900 mb-3">💡 Como funciona este cenário:</h4>
                    <p className="text-blue-800 leading-relaxed">
                      Você usa o crédito contemplado para adquirir um imóvel e o coloca para locação. 
                      A renda do aluguel (1% do valor do imóvel) ajuda a pagar a parcela restante do consórcio, 
                      gerando um fluxo de caixa positivo mensal.
                    </p>
                  </div>
                </>
              )
            )}
          </TabsContent>

          <TabsContent value="investment" className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
              <Badge className="bg-purple-100 text-purple-800 text-sm px-3 py-1 border-0">
                Cenário 3
              </Badge>
              <h3 className="text-2xl font-bold text-slate-900">{data.scenarios.appliedCredit.title}</h3>
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

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
                  <Label className="text-base font-semibold text-slate-700 mb-3 block">Taxa de Retorno Anual</Label>
                  <div className="flex gap-4 items-center">
                    <Input
                      type="number"
                      value={investmentReturn}
                      onChange={(e) => setInvestmentReturn(Number(e.target.value))}
                      className="w-24 h-12 text-lg font-semibold text-center border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      min="0"
                      max="50"
                      step="0.1"
                    />
                    <span className="text-lg font-medium text-slate-600">% a.a.</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Ajuste a taxa de retorno anual para ver o impacto no investimento</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <p className="text-base text-blue-800 font-semibold mb-2">Valor Aplicado</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(dynamicInvestment.appliedValue)}</p>
                    <p className="text-sm text-blue-700 mt-1">Crédito Corrigido</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                    <p className="text-base text-green-800 font-semibold mb-2">Taxa de Retorno</p>
                    <p className="text-2xl font-bold text-green-900">{formatPercentage(investmentReturn)} a.a.</p>
                    <p className="text-sm text-green-700 mt-1">Por {dynamicInvestment.monthsToApply} meses</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-orange-200">
                    <p className="text-base text-orange-800 font-semibold mb-2">Valor Final</p>
                    <p className="text-2xl font-bold text-orange-900">{formatCurrency(dynamicInvestment.finalValue)}</p>
                  </div>
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <p className="text-base text-purple-800 font-semibold mb-2">Lucro Total</p>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(dynamicInvestment.totalProfit)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl border border-cyan-200">
                    <p className="text-base text-cyan-800 font-semibold mb-2">Ganho Médio Mensal</p>
                    <p className="text-2xl font-bold text-cyan-900">{formatCurrency(dynamicInvestment.monthlyGain)}</p>
                    <p className="text-sm text-cyan-700 mt-1">Lucro total ÷ {dynamicInvestment.monthsToApply} meses</p>
                  </div>
                  <div className="p-6 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl border border-teal-200">
                    <p className="text-base text-teal-800 font-semibold mb-2">Ganho Médio Anual</p>
                    <p className="text-2xl font-bold text-teal-900">{formatCurrency(dynamicInvestment.annualGain)}</p>
                    <p className="text-sm text-teal-700 mt-1">Ganho mensal × 12 meses</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 text-center">Composição do Valor Final</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={investmentPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {investmentPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      <span className="text-xs font-medium text-slate-700">Aplicado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span className="text-xs font-medium text-slate-700">Lucro</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <h4 className="text-xl font-bold text-slate-900 mb-6 text-center">Crescimento do Investimento</h4>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fontSize: 12 }} 
                      label={{ value: 'Meses', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value).replace('R$ ', 'R$')} 
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), 'Valor']} 
                      labelFormatter={(label) => `Mês ${label}`}
                      contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="valor" 
                      stroke="#8B5CF6" 
                      strokeWidth={4} 
                      dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }} 
                      activeDot={{ r: 8, fill: '#7C3AED' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
              <h4 className="text-lg font-semibold text-purple-900 mb-3">💡 Como funciona este cenário:</h4>
              <p className="text-purple-800 leading-relaxed">
                Você aplica o valor do crédito contemplado em investimentos seguros como CDB, Tesouro Direto ou fundos. 
                O crescimento é baseado em juros compostos, demonstrando o potencial de rentabilidade ao longo do prazo restante do consórcio.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
