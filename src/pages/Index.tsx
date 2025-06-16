
import { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Home } from 'lucide-react';
import { SimulatorForm } from '@/components/SimulatorForm';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { ScenariosSection } from '@/components/ScenariosSection';
import { Header } from '@/components/Header';

export interface SimulationData {
  creditValue: number;
  installments: number;
  contemplationTime: number;
  monthlyPayment: number;
  monthlyPaymentWithAnticipatedTax?: number;
  postContemplationPayment: number;
  finalTerm: number;
  bidValue: number;
  embeddedBidValue: number;
  ownResourcesBidValue: number;
  availableCredit: number;
  totalPaid: number;
  totalInvested: number;
  reducedPaymentEnabled?: boolean;
  reducedPaymentPercentage?: number;
  creditType: 'property' | 'vehicle';
  correctionIndex: 'INCC' | 'IPCA';
  financingRate?: number;
  anticipatedTaxValue?: number;
  demonstrativeRate?: {
    monthlyRate: number;
    annualRate: number;
  };
  cet?: {
    cetMonthly: number;
    cetAnnual: number;
  };
  scenarios: {
    quotaSale: {
      title: string;
      totalReturn: number;
      profit: number;
      profitPercentage: number;
      agio: number;
    };
    propertyAcquisition?: {
      title: string;
      propertyValue: number;
      monthlyRental: number;
      postContemplationPayment: number;
      netMonthlyReturn: number;
    };
    financingComparison?: {
      title: string;
      consortiumTotalCost: number;
      financingTotalCost: number;
      savings: number;
      savingsPercentage: number;
    };
    appliedCredit: {
      title: string;
      appliedValue: number;
      investmentReturn: number;
      finalValue: number;
      totalProfit: number;
      monthsToApply: number;
    };
  };
}

const Index = () => {
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulation = async (data: SimulationData) => {
    setIsSimulating(true);
    
    // Simulate processing time for smooth UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setSimulationData(data);
    setIsSimulating(false);
  };

  const resetSimulation = () => {
    setSimulationData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <TrendingUp className="w-4 h-4" />
              Simulador Profissional de Consórcio
            </div>
            
            <h1 className="text-5xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Consórcio Flash Sim
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              Crie simulações completas e profissionais em tempo real. 
              Impressione seus clientes com relatórios detalhados e visuais impactantes.
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-500" />
                Cálculos em Tempo Real
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-500" />
                3 Cenários Completos
              </div>
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-500" />
                Relatórios Profissionais
              </div>
            </div>
          </div>

          {/* LAYOUT DE 3 SEÇÕES CONFORME MOCKUP */}
          
          {/* Seção Superior: Simulador (Esquerda) + Resumo (Direita) */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Simulator Form */}
            <div className="animate-slide-up">
              <SimulatorForm 
                onSimulate={handleSimulation}
                isLoading={isSimulating}
                onReset={resetSimulation}
                hasResults={!!simulationData}
              />
            </div>

            {/* Results Summary */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <ResultsDisplay 
                data={simulationData}
                isLoading={isSimulating}
              />
            </div>
          </div>

          {/* Seção Inferior: Cenários (Largura Total) */}
          {simulationData && (
            <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <ScenariosSection 
                data={simulationData}
                isLoading={isSimulating}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
