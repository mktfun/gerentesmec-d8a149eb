
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Calculator, RotateCcw, Download } from 'lucide-react';
import { calculateConsortium } from '@/utils/consortiumCalculations';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { SimulationData } from '@/pages/Index';

interface SimulatorFormProps {
  onSimulate: (data: SimulationData) => void;
  isLoading: boolean;
  onReset: () => void;
  hasResults: boolean;
}

export const SimulatorForm = ({ onSimulate, isLoading, onReset, hasResults }: SimulatorFormProps) => {
  // Estados do formulário
  const [creditValue, setCreditValue] = useState<string>('200000');
  const [installments, setInstallments] = useState<string>('240');
  const [contemplationTime, setContemplationTime] = useState<string>('60');
  const [adminRate, setAdminRate] = useState<string>('10');
  const [reserveFundRate, setReserveFundRate] = useState<string>('2');
  const [anticipatedTaxRate, setAnticipatedTaxRate] = useState<string>(''); // Novo campo
  const [lifeInsurance, setLifeInsurance] = useState<string>('15');
  const [creditType, setCreditType] = useState<'property' | 'vehicle'>('property');
  const [embeddedBidPercentage, setEmbeddedBidPercentage] = useState<string>('');
  const [ownResourcesBid, setOwnResourcesBid] = useState<string>('');
  const [agioPercentage, setAgioPercentage] = useState<string>('15');
  const [returnRate, setReturnRate] = useState<string>('1.2');
  const [returnPeriod, setReturnPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [financingRate, setFinancingRate] = useState<string>('12');
  const [rentalYield, setRentalYield] = useState<string>('0.5');
  const [reducedPaymentEnabled, setReducedPaymentEnabled] = useState(false);
  const [reducedPaymentPercentage, setReducedPaymentPercentage] = useState<string>('50');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleSimulate = async () => {
    try {
      console.log('🚀 Iniciando simulação...');
      
      const inputs = {
        creditValue: parseFloat(creditValue) || 0,
        installments: parseInt(installments) || 0,
        contemplationTime: parseInt(contemplationTime) || 0,
        adminRate: parseFloat(adminRate) || 0,
        reserveFundRate: parseFloat(reserveFundRate) || 0,
        anticipatedTaxRate: anticipatedTaxRate ? parseFloat(anticipatedTaxRate) : undefined, // Novo campo
        lifeInsurance: parseFloat(lifeInsurance) || 0,
        creditType,
        embeddedBidPercentage: embeddedBidPercentage ? parseFloat(embeddedBidPercentage) : undefined,
        ownResourcesBid: ownResourcesBid ? parseFloat(ownResourcesBid) : undefined,
        agioPercentage: parseFloat(agioPercentage) || 15,
        returnRate: parseFloat(returnRate) || 1.2,
        returnPeriod,
        financingRate: parseFloat(financingRate) || 12,
        rentalYield: parseFloat(rentalYield) || 0.5,
        reducedPaymentPercentage: reducedPaymentEnabled ? parseFloat(reducedPaymentPercentage) : undefined,
      };

      console.log('📝 Inputs da simulação:', inputs);

      const results = calculateConsortium(inputs);
      
      // Converter para o formato esperado pelo componente pai
      const simulationData: SimulationData = {
        creditValue: results.availableCredit,
        installments: inputs.installments,
        contemplationTime: inputs.contemplationTime,
        monthlyPayment: results.monthlyPayment,
        monthlyPaymentWithAnticipatedTax: results.monthlyPaymentWithAnticipatedTax,
        postContemplationPayment: results.postContemplationPayment,
        finalTerm: results.finalTerm,
        bidValue: results.bidValue,
        embeddedBidValue: results.embeddedBidValue,
        ownResourcesBidValue: results.ownResourcesBidValue,
        availableCredit: results.availableCredit,
        totalPaid: results.totalPaid,
        totalInvested: results.totalInvested,
        reducedPaymentEnabled,
        reducedPaymentPercentage: reducedPaymentEnabled ? parseFloat(reducedPaymentPercentage) : undefined,
        creditType,
        correctionIndex: results.correctionIndex,
        financingRate: parseFloat(financingRate),
        anticipatedTaxValue: results.anticipatedTaxValue,
        demonstrativeRate: results.demonstrativeRate,
        cet: results.cet,
        scenarios: results.scenarios
      };

      console.log('✅ Dados da simulação convertidos:', simulationData);
      onSimulate(simulationData);
      
    } catch (error) {
      console.error('❌ Erro na simulação:', error);
      toast.error('Erro ao calcular simulação. Verifique os dados inseridos.');
    }
  };

  const handleReset = () => {
    setCreditValue('200000');
    setInstallments('240');
    setContemplationTime('60');
    setAdminRate('10');
    setReserveFundRate('2');
    setAnticipatedTaxRate(''); // Reset do novo campo
    setLifeInsurance('15');
    setCreditType('property');
    setEmbeddedBidPercentage('');
    setOwnResourcesBid('');
    setAgioPercentage('15');
    setReturnRate('1.2');
    setReturnPeriod('monthly');
    setFinancingRate('12');
    setRentalYield('0.5');
    setReducedPaymentEnabled(false);
    setReducedPaymentPercentage('50');
    onReset();
    toast.success('Formulário resetado com sucesso!');
  };

  const handleExportPDF = async () => {
    if (!hasResults) {
      toast.error('Execute uma simulação antes de exportar o PDF');
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      console.log('📄 Iniciando geração de PDF...');
      
      // Simular dados da última simulação (você pode armazenar isso no estado)
      const mockSimulationData = {
        creditValue: parseFloat(creditValue),
        installments: parseInt(installments),
        contemplationTime: parseInt(contemplationTime),
        monthlyPayment: 1000, // Valor mockado
        postContemplationPayment: 800, // Valor mockado
        finalTerm: 180, // Valor mockado
        bidValue: 0,
        availableCredit: parseFloat(creditValue),
        totalInvested: 60000, // Valor mockado
        creditType,
        scenarios: {
          quotaSale: {
            agioGrossValue: parseFloat(creditValue) * (parseFloat(agioPercentage) / 100),
            profit: 30000,
            profitPercentage: 15
          },
          appliedCredit: {
            appliedValue: parseFloat(creditValue),
            finalValue: 300000,
            totalProfit: 50000
          }
        },
        cet: { cetMonthly: 0.24, cetAnnual: 2.88 },
        demonstrativeRate: { monthlyRate: 0.05, annualRate: 0.6 }
      };

      const { data, error } = await supabase.functions.invoke('generate-pdf', {
        body: { 
          simulationData: mockSimulationData,
          userId: null // Por enquanto sem autenticação
        }
      });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        throw error;
      }

      console.log('✅ Resposta da Edge Function:', data);
      
      if (data.success && data.pdfUrl) {
        // Abrir o PDF em uma nova aba
        window.open(data.pdfUrl, '_blank');
        toast.success('PDF gerado com sucesso!');
      } else {
        throw new Error(data.error || 'Erro desconhecido na geração do PDF');
      }
      
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Card className="w-full border-2 border-blue-100 shadow-lg bg-white">
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-slate-50">
        <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-blue-600" />
          Simulador de Consórcio
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        {/* Dados Básicos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700 border-b border-blue-200 pb-2">
            Dados Básicos
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creditValue" className="text-sm font-medium text-slate-700">
                Valor do Crédito (R$)
              </Label>
              <Input
                id="creditValue"
                type="number"
                value={creditValue}
                onChange={(e) => setCreditValue(e.target.value)}
                placeholder="200.000"
                className="border-slate-300 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="installments" className="text-sm font-medium text-slate-700">
                Prazo (meses)
              </Label>
              <Input
                id="installments"
                type="number"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                placeholder="240"
                max="260"
                className="border-slate-300 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contemplationTime" className="text-sm font-medium text-slate-700">
                Contemplação (mês)
              </Label>
              <Input
                id="contemplationTime"
                type="number"
                value={contemplationTime}
                onChange={(e) => setContemplationTime(e.target.value)}
                placeholder="60"
                className="border-slate-300 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="creditType" className="text-sm font-medium text-slate-700">
                Tipo de Crédito
              </Label>
              <Select value={creditType} onValueChange={(value: 'property' | 'vehicle') => setCreditType(value)}>
                <SelectTrigger className="border-slate-300 focus:border-blue-500">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property">Imóvel</SelectItem>
                  <SelectItem value="vehicle">Veículo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Taxas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700 border-b border-blue-200 pb-2">
            Taxas e Encargos
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminRate" className="text-sm font-medium text-slate-700">
                Taxa Admin. (%)
              </Label>
              <Input
                id="adminRate"
                type="number"
                value={adminRate}
                onChange={(e) => setAdminRate(e.target.value)}
                placeholder="10"
                step="0.1"
                className="border-slate-300 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reserveFundRate" className="text-sm font-medium text-slate-700">
                Fundo Reserva (%)
              </Label>
              <Input
                id="reserveFundRate"
                type="number"
                value={reserveFundRate}
                onChange={(e) => setReserveFundRate(e.target.value)}
                placeholder="2"
                step="0.1"
                className="border-slate-300 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="anticipatedTaxRate" className="text-sm font-medium text-slate-700">
                Taxa Antecipada (%)
              </Label>
              <Input
                id="anticipatedTaxRate"
                type="number"
                value={anticipatedTaxRate}
                onChange={(e) => setAnticipatedTaxRate(e.target.value)}
                placeholder="0.5"
                step="0.1"
                className="border-slate-300 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lifeInsurance" className="text-sm font-medium text-slate-700">
                Seguro de Vida (R$)
              </Label>
              <Input
                id="lifeInsurance"
                type="number"
                value={lifeInsurance}
                onChange={(e) => setLifeInsurance(e.target.value)}
                placeholder="15"
                className="border-slate-300 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Parcela Reduzida */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="reducedPayment"
              checked={reducedPaymentEnabled}
              onCheckedChange={setReducedPaymentEnabled}
            />
            <Label htmlFor="reducedPayment" className="text-sm font-medium text-slate-700">
              Habilitar Parcela Reduzida
            </Label>
          </div>
          
          {reducedPaymentEnabled && (
            <div className="space-y-2">
              <Label htmlFor="reducedPaymentPercentage" className="text-sm font-medium text-slate-700">
                Percentual de Redução (%)
              </Label>
              <Input
                id="reducedPaymentPercentage"
                type="number"
                value={reducedPaymentPercentage}
                onChange={(e) => setReducedPaymentPercentage(e.target.value)}
                placeholder="50"
                min="1"
                max="100"
                className="border-slate-300 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Lances */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700 border-b border-blue-200 pb-2">
            Lances
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="embeddedBidPercentage" className="text-sm font-medium text-slate-700">
                Lance Embutido (%)
              </Label>
              <Input
                id="embeddedBidPercentage"
                type="number"
                value={embeddedBidPercentage}
                onChange={(e) => setEmbeddedBidPercentage(e.target.value)}
                placeholder="0"
                step="0.1"
                className="border-slate-300 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ownResourcesBid" className="text-sm font-medium text-slate-700">
                Lance Recursos Próprios (R$)
              </Label>
              <Input
                id="ownResourcesBid"
                type="number"
                value={ownResourcesBid}
                onChange={(e) => setOwnResourcesBid(e.target.value)}
                placeholder="0"
                className="border-slate-300 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Cenários */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700 border-b border-blue-200 pb-2">
            Cenários de Análise
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agioPercentage" className="text-sm font-medium text-slate-700">
                Ágio para Venda (%)
              </Label>
              <Input
                id="agioPercentage"
                type="number"
                value={agioPercentage}
                onChange={(e) => setAgioPercentage(e.target.value)}
                placeholder="15"
                step="0.1"
                className="border-slate-300 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="returnRate" className="text-sm font-medium text-slate-700">
                Taxa de Retorno (%)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="returnRate"
                  type="number"
                  value={returnRate}
                  onChange={(e) => setReturnRate(e.target.value)}
                  placeholder="1.2"
                  step="0.1"
                  className="border-slate-300 focus:border-blue-500"
                />
                <Select value={returnPeriod} onValueChange={(value: 'monthly' | 'annual') => setReturnPeriod(value)}>
                  <SelectTrigger className="w-32 border-slate-300 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">a.m.</SelectItem>
                    <SelectItem value="annual">a.a.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {creditType === 'vehicle' && (
              <div className="space-y-2">
                <Label htmlFor="financingRate" className="text-sm font-medium text-slate-700">
                  Taxa Financiamento (% a.a.)
                </Label>
                <Input
                  id="financingRate"
                  type="number"
                  value={financingRate}
                  onChange={(e) => setFinancingRate(e.target.value)}
                  placeholder="12"
                  step="0.1"
                  className="border-slate-300 focus:border-blue-500"
                />
              </div>
            )}
            
            {creditType === 'property' && (
              <div className="space-y-2">
                <Label htmlFor="rentalYield" className="text-sm font-medium text-slate-700">
                  Rendimento Aluguel (% a.m.)
                </Label>
                <Input
                  id="rentalYield"
                  type="number"
                  value={rentalYield}
                  onChange={(e) => setRentalYield(e.target.value)}
                  placeholder="0.5"
                  step="0.1"
                  className="border-slate-300 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={handleSimulate}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {isLoading ? 'Calculando...' : 'Simular'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
            className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-3 px-6"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          
          <Button
            variant="secondary"
            onClick={handleExportPDF}
            disabled={!hasResults || isGeneratingPDF}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6"
          >
            <Download className="w-4 h-4 mr-2" />
            {isGeneratingPDF ? 'Gerando...' : 'Exportar PDF'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
