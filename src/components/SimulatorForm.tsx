import { useState } from 'react';
import { Calculator, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const clean = value
    .replace(/[^0-9,]/g, '')           // Keep only numbers and comma
    .replace(/\./g, '')                // Remove dots (thousand separators)
    .replace(/,/g, '.');               // Convert comma to dot for decimal

  // ParseFloat entende "." como decimal separador
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export const SimulatorForm = ({ onSimulate, isLoading, onReset, hasResults }: SimulatorFormProps) => {
  const [formData, setFormData] = useState({
    creditValue: '',
    installments: '',
    contemplationTime: '',
    adminRate: '18',
    reserveFundRate: '1',
    insuranceRate: '1',
    bidPercentage: '',
    bidDiscountType: 'reducePayment',
    reducedPaymentEnabled: false,
    reducedPaymentPercentage: '50'
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
    const bidPercentage = parseFloat(formData.bidPercentage) || 0;
    const reducedPaymentPercentage = parseFloat(formData.reducedPaymentPercentage);

    if (!creditValue || !installments || !contemplationTime || 
        isNaN(adminRate) || isNaN(reserveFundRate) || isNaN(insuranceRate)) {
      return;
    }

    const simulationData = calculateSimulation({
      creditValue,
      installments,
      contemplationTime,
      adminRate,
      reserveFundRate,
      insuranceRate,
      bidPercentage,
      bidDiscountType: formData.bidDiscountType as 'reduceTerm' | 'reducePayment',
      reducedPaymentEnabled: formData.reducedPaymentEnabled,
      reducedPaymentPercentage
    });

    onSimulate(simulationData);
  };

  const isFormValid = formData.creditValue && formData.installments && formData.contemplationTime &&
                     formData.adminRate && formData.reserveFundRate && formData.insuranceRate;

  const hasBid = parseFloat(formData.bidPercentage) > 0;

  return (
    <Card className="glass-card p-8 apple-shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-apple-blue-500 to-apple-blue-600 rounded-lg flex items-center justify-center">
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Simulador</h2>
          <p className="text-slate-500">Insira os dados para começar</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="creditValue" className="text-sm font-medium text-slate-700">
            Valor do Crédito
          </Label>
          <Input
            id="creditValue"
            type="text"
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={formData.creditValue}
            onChange={handleCreditValueChange}
            className="h-12 text-lg font-medium glass-button border-slate-200 focus:border-apple-blue-500 focus:ring-apple-blue-500/20"
            autoComplete="off"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="installments" className="text-sm font-medium text-slate-700">
              Parcelas
            </Label>
            <Input
              id="installments"
              type="number"
              placeholder="60"
              value={formData.installments}
              onChange={(e) => handleInputChange('installments', e.target.value)}
              className="h-12 text-lg font-medium glass-button border-slate-200 focus:border-apple-blue-500 focus:ring-apple-blue-500/20"
              min="12"
              max="200"
            />
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
              onChange={(e) => handleInputChange('contemplationTime', e.target.value)}
              className="h-12 text-lg font-medium glass-button border-slate-200 focus:border-apple-blue-500 focus:ring-apple-blue-500/20"
              min="6"
              max="120"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Taxas do Consórcio</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminRate" className="text-sm font-medium text-slate-700">
                Taxa de Administração (%)
              </Label>
              <Input
                id="adminRate"
                type="number"
                placeholder="18"
                value={formData.adminRate}
                onChange={(e) => handleInputChange('adminRate', e.target.value)}
                className="h-12 text-lg font-medium glass-button border-slate-200 focus:border-apple-blue-500 focus:ring-apple-blue-500/20"
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
                onChange={(e) => handleInputChange('reserveFundRate', e.target.value)}
                className="h-12 text-lg font-medium glass-button border-slate-200 focus:border-apple-blue-500 focus:ring-apple-blue-500/20"
                min="0"
                max="10"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceRate" className="text-sm font-medium text-slate-700">
                Seguro de Vida (%)
              </Label>
              <Input
                id="insuranceRate"
                type="number"
                placeholder="1"
                value={formData.insuranceRate}
                onChange={(e) => handleInputChange('insuranceRate', e.target.value)}
                className="h-12 text-lg font-medium glass-button border-slate-200 focus:border-apple-blue-500 focus:ring-apple-blue-500/20"
                min="0"
                max="10"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Nova seção: Parcela Reduzida */}
        <div className="space-y-4">
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Parcela Reduzida</h3>
                <p className="text-sm text-slate-500">Pagar parcela reduzida até a contemplação</p>
              </div>
              <Switch
                checked={formData.reducedPaymentEnabled}
                onCheckedChange={(checked) => handleInputChange('reducedPaymentEnabled', checked)}
              />
            </div>

            {formData.reducedPaymentEnabled && (
              <div className="space-y-2">
                <Label htmlFor="reducedPaymentPercentage" className="text-sm font-medium text-slate-700">
                  Percentual da Parcela Reduzida
                </Label>
                <Select
                  value={formData.reducedPaymentPercentage}
                  onValueChange={(value) => handleInputChange('reducedPaymentPercentage', value)}
                >
                  <SelectTrigger className="h-12 text-lg font-medium glass-button border-slate-200 focus:border-apple-blue-500 focus:ring-apple-blue-500/20">
                    <SelectValue placeholder="Selecione o percentual" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50% da parcela</SelectItem>
                    <SelectItem value="75">75% da parcela</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Lance (Opcional)</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bidPercentage" className="text-sm font-medium text-slate-700">
              Valor do Lance (% do crédito)
            </Label>
            <Input
              id="bidPercentage"
              type="number"
              placeholder="0"
              value={formData.bidPercentage}
              onChange={(e) => handleInputChange('bidPercentage', e.target.value)}
              className="h-12 text-lg font-medium glass-button border-slate-200 focus:border-apple-blue-500 focus:ring-apple-blue-500/20"
              min="0"
              max="50"
              step="0.1"
            />
          </div>

          {hasBid && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">
                Abatimento do Lance
              </Label>
              <RadioGroup
                value={formData.bidDiscountType}
                onValueChange={(value) => handleInputChange('bidDiscountType', value)}
                className="flex flex-col space-y-2"
              >
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
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="flex-1 h-12 bg-gradient-to-r from-apple-blue-500 to-apple-blue-600 hover:from-apple-blue-600 hover:to-apple-blue-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Calculando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Simular Agora
              </div>
            )}
          </Button>

          {hasResults && (
            <Button
              type="button"
              onClick={onReset}
              variant="outline"
              className="h-12 px-6 glass-button border-slate-200 hover:border-apple-blue-300 hover:bg-apple-blue-50 rounded-xl transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </form>

      <div className="mt-6 p-4 bg-apple-blue-50 rounded-xl border border-apple-blue-100">
        <p className="text-sm text-apple-blue-700">
          <strong>Dica:</strong> Para melhores resultados, use dados reais do consórcio que você está apresentando ao cliente.
        </p>
      </div>
    </Card>
  );
};
