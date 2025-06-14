
import { useState } from 'react';
import { Calculator, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimulationData } from '@/pages/Index';
import { calculateSimulation } from '@/utils/consortiumCalculations';

interface SimulatorFormProps {
  onSimulate: (data: SimulationData) => void;
  isLoading: boolean;
  onReset: () => void;
  hasResults: boolean;
}

export const SimulatorForm = ({ onSimulate, isLoading, onReset, hasResults }: SimulatorFormProps) => {
  const [formData, setFormData] = useState({
    creditValue: '',
    installments: '',
    contemplationTime: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const creditValue = parseFloat(formData.creditValue.replace(/\D/g, ''));
    const installments = parseInt(formData.installments);
    const contemplationTime = parseInt(formData.contemplationTime);

    if (!creditValue || !installments || !contemplationTime) {
      return;
    }

    const simulationData = calculateSimulation({
      creditValue,
      installments,
      contemplationTime
    });

    onSimulate(simulationData);
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseInt(numericValue) / 100);
    return formatted;
  };

  const isFormValid = formData.creditValue && formData.installments && formData.contemplationTime;

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
            placeholder="R$ 0,00"
            value={formData.creditValue}
            onChange={(e) => {
              const formatted = formatCurrency(e.target.value);
              handleInputChange('creditValue', formatted);
            }}
            className="h-12 text-lg font-medium glass-button border-slate-200 focus:border-apple-blue-500 focus:ring-apple-blue-500/20"
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
