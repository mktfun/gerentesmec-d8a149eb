
import { Card } from '@/components/ui/card';
import { TrendingUp, DollarSign, PieChart, BarChart3 } from 'lucide-react';
import { SimulationData } from '@/pages/Index';
import { formatCurrency } from '@/utils/formatters';
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';

interface ScenariosSectionProps {
  data: SimulationData;
  isLoading: boolean;
}

const COLORS = {
  blue: '#3B82F6',
  green: '#10B981',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  red: '#EF4444',
  slate: '#64748B'
};

export const ScenariosSection = ({ data, isLoading }: ScenariosSectionProps) => {
  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Análise de Cenários</h2>
        <div className="grid lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white shadow-xl border-2 border-slate-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-32 bg-slate-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded"></div>
                  <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Dados para o gráfico de cascata do Cenário 2 (Waterfall Chart)
  const waterfallData = data.scenarios.propertyAcquisition ? [
    { name: 'Renda Mensal', value: data.scenarios.propertyAcquisition.monthlyRental, color: COLORS.green },
    { name: 'Parcela', value: -data.scenarios.propertyAcquisition.postContemplationPayment, color: COLORS.red },
    { name: 'Saldo Líquido', value: data.scenarios.propertyAcquisition.netMonthlyReturn, color: COLORS.blue }
  ] : [];

  // Dados para o gráfico de pizza do Cenário 1
  const quotaSalePieData = [
    { name: 'Total Investido', value: data.totalInvested, color: COLORS.blue },
    { name: 'Lucro com Ágio', value: data.scenarios.quotaSale.profit, color: COLORS.green }
  ];

  // Dados para o gráfico de pizza do Cenário 3 (Composição do Valor Final)
  const appliedCreditPieData = [
    { name: 'Valor Aplicado', value: data.scenarios.appliedCredit.appliedValue, color: COLORS.blue },
    { name: 'Lucro Total', value: data.scenarios.appliedCredit.totalProfit, color: COLORS.green }
  ];

  // Dados para o gráfico de linha do Cenário 3 (Crescimento ao longo do tempo)
  const investmentGrowthData = [];
  const months = data.scenarios.appliedCredit.monthsToApply;
  const monthlyRate = 0.12 / 12; // 12% a.a. = 1% a.m.
  
  for (let i = 0; i <= Math.min(months, 60); i += 6) { // Mostrar apenas até 60 meses, de 6 em 6
    const value = data.scenarios.appliedCredit.appliedValue * Math.pow(1 + monthlyRate, i);
    investmentGrowthData.push({
      month: i,
      value: value
    });
  }

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-medium text-slate-900">{label}</p>
          <p className="text-blue-600">
            {formatCurrency(payload[0]?.value || 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Análise de Cenários</h2>
          <p className="text-slate-600">Compare as diferentes possibilidades de retorno</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cenário 1: Venda da Cota */}
        <Card className="bg-white shadow-xl border-2 border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Cenário 1</h3>
          </div>
          
          <h4 className="text-xl font-bold text-green-600 mb-4">Venda da Cota</h4>
          
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <RechartsPieChart data={quotaSalePieData}>
                  {quotaSalePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RechartsPieChart>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700">Total Investido</span>
              <span className="font-bold text-slate-900">{formatCurrency(data.totalInvested)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-700">
                Lucro ({formatPercentage(data.scenarios.quotaSale.agio)}% ágio)
              </span>
              <span className="font-bold text-green-600">{formatCurrency(data.scenarios.quotaSale.profit)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
              <span className="text-sm font-medium text-blue-700">Retorno Total</span>
              <span className="font-bold text-blue-600 text-lg">{formatCurrency(data.scenarios.quotaSale.totalReturn)}</span>
            </div>
          </div>
        </Card>

        {/* Cenário 2: Aquisição (Imóvel) ou Comparativo (Veículo) */}
        <Card className="bg-white shadow-xl border-2 border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Cenário 2</h3>
          </div>

          {data.scenarios.propertyAcquisition ? (
            <>
              <h4 className="text-xl font-bold text-blue-600 mb-4">Aquisição de Imóvel</h4>
              
              {/* Gráfico de Cascata (Waterfall Chart) */}
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill={(entry: any) => entry.color} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Valor do Imóvel</span>
                  <span className="font-bold text-slate-900">{formatCurrency(data.scenarios.propertyAcquisition.propertyValue)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-700">Renda Mensal</span>
                  <span className="font-bold text-green-600">{formatCurrency(data.scenarios.propertyAcquisition.monthlyRental)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <span className="text-sm font-medium text-blue-700">Retorno Líquido/Mês</span>
                  <span className="font-bold text-blue-600 text-lg">{formatCurrency(data.scenarios.propertyAcquisition.netMonthlyReturn)}</span>
                </div>
              </div>
            </>
          ) : data.scenarios.financingComparison ? (
            <>
              <h4 className="text-xl font-bold text-blue-600 mb-4">Consórcio vs. Financiamento</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Custo do Consórcio</span>
                  <span className="font-bold text-slate-900">{formatCurrency(data.scenarios.financingComparison.consortiumTotalCost)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-red-700">Custo do Financiamento</span>
                  <span className="font-bold text-red-600">{formatCurrency(data.scenarios.financingComparison.financingTotalCost)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                  <span className="text-sm font-medium text-green-700">
                    Economia ({formatPercentage(data.scenarios.financingComparison.savingsPercentage)})
                  </span>
                  <span className="font-bold text-green-600 text-lg">{formatCurrency(data.scenarios.financingComparison.savings)}</span>
                </div>
              </div>
            </>
          ) : null}
        </Card>

        {/* Cenário 3: Crédito Aplicado */}
        <Card className="bg-white shadow-xl border-2 border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <PieChart className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Cenário 3</h3>
          </div>
          
          <h4 className="text-xl font-bold text-purple-600 mb-4">Crédito Aplicado</h4>
          
          {/* Gráfico de Pizza - Composição do Valor Final */}
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <RechartsPieChart data={appliedCreditPieData}>
                  {appliedCreditPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RechartsPieChart>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700">Valor Aplicado</span>
              <span className="font-bold text-slate-900">{formatCurrency(data.scenarios.appliedCredit.appliedValue)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-700">Taxa de Retorno Anual</span>
              <span className="font-bold text-purple-600">{formatPercentage(data.scenarios.appliedCredit.investmentReturn)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-700">Lucro Total</span>
              <span className="font-bold text-green-600">{formatCurrency(data.scenarios.appliedCredit.totalProfit)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
              <span className="text-sm font-medium text-blue-700">Valor Final</span>
              <span className="font-bold text-blue-600 text-lg">{formatCurrency(data.scenarios.appliedCredit.finalValue)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
