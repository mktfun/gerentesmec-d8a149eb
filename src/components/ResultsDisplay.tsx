
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, Car, Home, Download } from 'lucide-react';
import { SimulationData } from '@/pages/Index';
import { formatCurrency } from '@/utils/formatters';

interface ResultsDisplayProps {
  data: SimulationData | null;
  isLoading: boolean;
}

export const ResultsDisplay = ({
  data,
  isLoading
}: ResultsDisplayProps) => {
  if (isLoading) {
    return (
      <Card className="bg-white shadow-xl border-2 border-slate-200 p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">Processando Simulação</h3>
            <p className="text-slate-500">Calculando os melhores cenários...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-white shadow-xl border-2 border-slate-200 p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Calculator className="w-8 h-8 text-blue-500" />
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
- Parcela Base: ${formatCurrency(data.monthlyPayment)}
- Total Pago: ${formatCurrency(data.totalPaid)}

MÉTRICAS FINANCEIRAS:
${data.demonstrativeRate ? `- Taxa Demonstrativa Mensal: ${data.demonstrativeRate.monthlyRate.toFixed(2)}%` : ''}
${data.demonstrativeRate ? `- Taxa Demonstrativa Anual: ${data.demonstrativeRate.annualRate.toFixed(2)}%` : ''}
${data.cet ? `- CET Mensal: ${data.cet.cetMonthly.toFixed(2)}%` : ''}
${data.cet ? `- CET Anual: ${data.cet.cetAnnual.toFixed(2)}%` : ''}

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
  const isVehicle = data.creditType === 'vehicle';

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <Card className="bg-white shadow-xl border-2 border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            {isVehicle ? <Car className="w-5 h-5 text-white" /> : <Home className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Resumo da Simulação</h3>
            <p className="text-sm text-slate-500">
              Consórcio de {isVehicle ? 'Veículo' : 'Imóvel'} • Correção: {data.correctionIndex}
            </p>
          </div>
        </div>
        <Button 
          onClick={exportSimulation} 
          variant="outline" 
          className="border-2 border-slate-200 hover:border-blue-300 text-slate-700 bg-white hover:bg-blue-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Dados Básicos */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-800 font-medium mb-1">Valor do Crédito</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(data.creditValue)}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-800 font-medium mb-1">
            Parcela {hasReducedPayment ? 'Reduzida' : 'Base'}
          </p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.monthlyPayment)}</p>
          {hasReducedPayment && (
            <p className="text-xs text-slate-600 mt-1">{formatPercentage(data.reducedPaymentPercentage || 0)} da parcela</p>
          )}
          {data.monthlyPaymentWithAnticipatedTax && data.monthlyPaymentWithAnticipatedTax > data.monthlyPayment && (
            <p className="text-xs text-orange-600 mt-1">
              Com taxa antecipada: {formatCurrency(data.monthlyPaymentWithAnticipatedTax)} (12 primeiras)
            </p>
          )}
        </div>
      </div>

      {/* Métricas Financeiras */}
      {(data.demonstrativeRate || data.cet) && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-500" />
            Métricas Financeiras
          </h4>
          
          {data.demonstrativeRate && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-1">Taxa Mensal</p>
                <p className="text-xl font-bold text-blue-900">{formatPercentage(data.demonstrativeRate.monthlyRate)}</p>
                <p className="text-xs text-blue-700 mt-1">Demonstrativo de Taxa</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-1">Taxa Anual</p>
                <p className="text-xl font-bold text-blue-900">{formatPercentage(data.demonstrativeRate.annualRate)}</p>
                <p className="text-xs text-blue-700 mt-1">Demonstrativo de Taxa</p>
              </div>
            </div>
          )}
          
          {data.cet && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <p className="text-sm text-purple-900 font-medium mb-1">CET Mensal</p>
                <p className="text-xl font-bold text-purple-900">{formatPercentage(data.cet.cetMonthly)}</p>
                <p className="text-xs text-purple-700 mt-1">Custo Efetivo Total</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <p className="text-sm text-purple-900 font-medium mb-1">CET Anual</p>
                <p className="text-xl font-bold text-purple-900">{formatPercentage(data.cet.cetAnnual)}</p>
                <p className="text-xs text-purple-700 mt-1">Custo Efetivo Total</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Taxa Antecipada */}
      {data.anticipatedTaxValue && data.anticipatedTaxValue > 0 && (
        <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg mb-6">
          <p className="text-sm text-orange-900 font-medium mb-1">Taxa Antecipada</p>
          <p className="text-2xl font-bold text-orange-900">{formatCurrency(data.anticipatedTaxValue)}</p>
          <p className="text-xs text-orange-700 mt-1">Diluída nas primeiras 12 parcelas</p>
        </div>
      )}

      {/* Informações de Lance */}
      {hasBid && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <p className="text-sm text-purple-900 font-medium mb-1">Lance Total</p>
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

      {/* Crédito Disponível */}
      {hasEmbeddedBid && (
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg mb-6">
          <p className="text-sm text-indigo-900 font-medium mb-1">Crédito Disponível</p>
          <p className="text-2xl font-bold text-indigo-900">{formatCurrency(data.availableCredit)}</p>
          <p className="text-xs text-indigo-700 mt-1">Após desconto do lance embutido</p>
        </div>
      )}

      {/* Total Investido */}
      <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
        <p className="text-sm text-green-900 font-medium mb-1">Total Investido até Contemplação</p>
        <p className="text-2xl font-bold text-green-900">{formatCurrency(data.totalInvested)}</p>
        <p className="text-xs text-green-700 mt-1">Incluindo taxa antecipada e parcelas reduzidas</p>
      </div>
    </Card>
  );
};
