import { useState } from 'react';
import { Calculator, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { SimulationData } from '@/pages/Index';
import { calculateSimulation } from '@/utils/consortiumCalculations';

interface SimulatorFormProps {
  onSimulate: (data: SimulationData) => void;
  isLoading: boolean;
  onReset: () => void;
  hasResults: boolean;
}

// Função para formatar valor para o padrão R$ 0.000,00 (pt-BR)
function formatBRLCurrency(value: string): string {
  // Remove todos os caracteres não numéricos
  const numeric = value.replace(/\D/g, '');
  if (!numeric) return '';

  // Divide centavos
  let intValue = parseInt(numeric, 10);
  let cents = (intValue % 100).toString().padStart(2, '0'); // Últimos 2 dígitos
  let rest = Math.floor(intValue / 100).toString();

  // Adiciona separador de milhar
  let formattedInt = rest.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${formattedInt},${cents}`;
}

// Função para converter "R$ 300.000,00" -> 300000 (float)
function parseBRLInputToNumber(value: string): number {
  // Remove R$ e espaços, troca "." por "", troca "," por "."
  // Ex: "R$ 300.000,25" => "300000.25"
  const clean = value.replace(/[^0-9,]/g, '') // Keep only numbers and comma
  .replace(/\./g, '') // Remove dots (thousand separators)
  .replace(/,/g, '.'); // Convert comma to dot for decimal

  // ParseFloat entende "." como decimal separador
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}
export const SimulatorForm = ({
  onSimulate,
  isLoading,
  onReset,
  hasResults
}: SimulatorFormProps) => {
  const [formData, setFormData] = useState({
    creditType: 'property',
    creditValue: '',
    installments: '',
    contemplationTime: '',
    adminRate: '18',
    reserveFundRate: '1',
    insuranceRate: '1',
    anticipatedTaxRate: '0.5',
    embeddedBidPercentage: '',
    ownResourcesBidPercentage: '',
    bidDiscountType: 'reducePayment',
    reducedPaymentEnabled: false,
    reducedPaymentPercentage: '50',
    financingRate: '2.5'
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreditValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBRLCurrency(e.target.value);
    setFormData(prev => ({
      ...prev,
      creditValue: formatted
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const creditValue = parseBRLInputToNumber(formData.creditValue);
    const installments = parseInt(formData.installments);
    const contemplationTime = parseInt(formData.contemplationTime);
    const adminRate = parseFloat(formData.adminRate);
    const reserveFundRate = parseFloat(formData.reserveFundRate);
    const insuranceRate = parseFloat(formData.insuranceRate);
    const anticipatedTaxRate = parseFloat(formData.anticipatedTaxRate);
    const embeddedBidPercentage = parseFloat(formData.embeddedBidPercentage) || 0;
    const ownResourcesBidPercentage = parseFloat(formData.ownResourcesBidPercentage) || 0;
    const reducedPaymentPercentage = parseFloat(formData.reducedPaymentPercentage);
    const financingRate = parseFloat(formData.financingRate);

    if (!creditValue || !installments || !contemplationTime || isNaN(adminRate) || isNaN(reserveFundRate) || isNaN(insuranceRate) || isNaN(anticipatedTaxRate)) {
      return;
    }

    if (formData.creditType === 'vehicle' && isNaN(financingRate)) {
      return;
    }

    const simulationData = calculateSimulation({
      creditType: formData.creditType as 'property' | 'vehicle',
      creditValue,
      installments,
      contemplationTime,
      adminRate,
      reserveFundRate,
      insuranceRate,
      anticipatedTaxRate,
      embeddedBidPercentage,
      ownResourcesBidPercentage,
      bidDiscountType: formData.bidDiscountType as 'reduceTerm' | 'reducePayment',
      reducedPaymentEnabled: formData.reducedPaymentEnabled,
      reducedPaymentPercentage,
      financingRate: formData.creditType === 'vehicle' ? financingRate : undefined
    });

    onSimulate(simulationData);
  };

  const isFormValid = formData.creditValue && formData.installments && formData.contemplationTime && 
    formData.adminRate && formData.reserveFundRate && formData.insuranceRate && formData.anticipatedTaxRate &&
    (formData.creditType === 'property' || (formData.creditType === 'vehicle' && formData.financingRate));

  const hasBid = (parseFloat(formData.embeddedBidPercentage) || 0) + (parseFloat(formData.ownResourcesBidPercentage) || 0) > 0;

  return (
    <Card className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Simulador</h2>
          <p className="text-slate-600">Insira os dados para começar</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seletor de Tipo de Crédito */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">
            Tipo de Crédito
          </Label>
          <RadioGroup value={formData.creditType} onValueChange={value => handleInputChange('creditType', value)} className="flex flex-row gap-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="property" id="property" />
              <Label htmlFor="property" className="text-sm cursor-pointer flex items-center gap-2">
                🏠 Imóvel
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="vehicle" id="vehicle" />
              <Label htmlFor="vehicle" className="text-sm cursor-pointer flex items-center gap-2">
                🚗 Veículo
              </Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-slate-500">
            Índice de correção: {formData.creditType === 'property' ? 'INCC' : 'IPCA'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="creditValue" className="text-sm font-medium text-slate-700">
            Valor do Crédito
          </Label>
          <Input id="creditValue" type="text" inputMode="numeric" placeholder="R$ 0,00" value={formData.creditValue} onChange={handleCreditValueChange} className="h-12 text-lg font-medium border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" autoComplete="off" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="installments">Parcelas</Label>
            <Input 
              id="installments" 
              type="number" 
              value={formData.installments} 
              onChange={e => handleInputChange('installments', e.target.value)} 
              min={12} 
              max={260} 
              className="h-12 text-lg font-medium border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" 
            />
            <p className="text-xs text-slate-500">Entre 12 e 260 parcelas</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contemplationTime" className="text-sm font-medium text-slate-700">
              Contemplação (meses)
            </Label>
            <Input 
              id="contemplationTime" 
              type="number" 
              placeholder="36" 
              value={formData.contemplationTime} 
              onChange={e => handleInputChange('contemplationTime', e.target.value)} 
              className="h-12 text-lg font-medium border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" 
              min="6" 
              max="120" 
            />
          </div>
        </div>

        {/* Taxa de Financiamento (apenas para veículo) */}
        {formData.creditType === 'vehicle' && (
          <div className="space-y-2">
            <Label htmlFor="financingRate" className="text-sm font-medium text-slate-700">
              Taxa de Juros do Financiamento (% a.m.)
            </Label>
            <Input 
              id="financingRate" 
              type="number" 
              placeholder="2.5" 
              value={formData.financingRate} 
              onChange={e => handleInputChange('financingRate', e.target.value)} 
              className="h-12 text-lg font-medium border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" 
              min="0.1" 
              max="10" 
              step="0.1" 
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Taxas do Consórcio</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminRate" className="text-sm font-medium text-slate-700">
                Taxa de Administração (%)
              </Label>
              <Input 
                id="adminRate" 
                type="number" 
                placeholder="18" 
                value={formData.adminRate} 
                onChange={e => handleInputChange('adminRate', e.target.value)} 
                className="h-12 text-lg font-medium border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" 
                min="0" 
                max="30" 
                step="0.01" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reserveFundRate" className="text-sm font-medium text-slate-700">
                Fundo de Reserva (%)
              </Label>
              <Input 
                id="reserveFundRate" 
                type="number" 
                placeholder="1" 
                value={formData.reserveFundRate} 
                onChange={e => handleInputChange('reserveFundRate', e.target.value)} 
                className="h-12 text-lg font-medium border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" 
                min="0" 
                max="10" 
                step="0.01" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insuranceRate" className="text-sm font-medium text-slate-700">
                Seguro de Vida (%)
              </Label>
              <Input 
                id="insuranceRate" 
                type="number" 
                placeholder="1" 
                value={formData.insuranceRate} 
                onChange={e => handleInputChange('insuranceRate', e.target.value)} 
                className="h-12 text-lg font-medium border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" 
                min="0" 
                max="10" 
                step="0.01" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="anticipatedTaxRate" className="text-sm font-medium text-slate-700">
                Taxa Antecipada (%)
              </Label>
              <Input 
                id="anticipatedTaxRate" 
                type="number" 
                placeholder="0.5" 
                value={formData.anticipatedTaxRate} 
                onChange={e => handleInputChange('anticipatedTaxRate', e.target.value)} 
                className="h-12 text-lg font-medium border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" 
                min="0" 
                max="5" 
                step="0.01" 
              />
              <p className="text-xs text-slate-500">Diluída nas primeiras 12 parcelas</p>
            </div>
          </div>
        </div>

        {/* Seção: Parcela Reduzida */}
        <div className="space-y-4">
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Parcela Reduzida</h3>
                <p className="text-sm text-slate-500">Pagar parcela reduzida até a contemplação</p>
              </div>
              <Switch checked={formData.reducedPaymentEnabled} onCheckedChange={checked => handleInputChange('reducedPaymentEnabled', checked)} className="bg-slate-500 hover:bg-slate-400 text-gray-600" />
            </div>

            {formData.reducedPaymentEnabled && <div className="space-y-2">
                <Label htmlFor="reducedPaymentPercentage" className="text-sm font-medium text-slate-700">
                  Percentual da Parcela Reduzida
                </Label>
                <div className="relative">
                  <Input id="reducedPaymentPercentage" type="number" placeholder="50" value={formData.reducedPaymentPercentage} onChange={e => handleInputChange('reducedPaymentPercentage', e.target.value)} className="h-12 text-lg font-medium border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 pr-10" min="1" max="99" />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-slate-500 text-lg">%</span>
                  </div>
                </div>
              </div>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Lance (Opcional)</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="embeddedBidPercentage" className="text-sm font-medium text-slate-700">
                Lance Embutido (% do crédito)
              </Label>
              <Input id="embeddedBidPercentage" type="number" placeholder="0" value={formData.embeddedBidPercentage} onChange={e => handleInputChange('embeddedBidPercentage', e.target.value)} className="h-12 text-lg font-medium border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" min="0" max="30" step="0.1" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownResourcesBidPercentage" className="text-sm font-medium text-slate-700">
                Lance com Recursos Próprios (%)
              </Label>
              <Input id="ownResourcesBidPercentage" type="number" placeholder="0" value={formData.ownResourcesBidPercentage} onChange={e => handleInputChange('ownResourcesBidPercentage', e.target.value)} className="h-12 text-lg font-medium border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" min="0" max="50" step="0.1" />
            </div>
          </div>

          {hasBid && <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">
                Abatimento do Lance
              </Label>
              <RadioGroup value={formData.bidDiscountType} onValueChange={value => handleInputChange('bidDiscountType', value)} className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reducePayment" id="reducePayment" />
                  <Label htmlFor="reducePayment" className="text-sm cursor-pointer">
                    Reduzir valor da parcela
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reduceTerm" id="reduceTerm" />
                  <Label htmlFor="reduceTerm" className="text-sm cursor-pointer">
                    Reduzir prazo
                  </Label>
                </div>
              </RadioGroup>
            </div>}
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={!isFormValid || isLoading} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0">
            {isLoading ? <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Calculando...
              </div> : <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Simular Agora
              </div>}
          </Button>

          {hasResults && <Button type="button" onClick={onReset} variant="outline" className="h-12 px-6 border-2 border-slate-200 hover:border-blue-300 rounded-xl transition-all duration-200 bg-slate-400 hover:bg-slate-300">
              <RotateCcw className="w-4 h-4" />
            </Button>}
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-700">
          <strong>Dica:</strong> Para melhores resultados, use dados reais do consórcio que você está apresentando ao cliente.
        </p>
      </div>
    </Card>
  );
};
