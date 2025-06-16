import { SimulationData } from '@/pages/Index';

interface CalculationInput {
  creditType: 'property' | 'vehicle';
  creditValue: number;
  installments: number;
  contemplationTime: number;
  adminRate: number;
  reserveFundRate: number;
  insuranceRate: number;
  embeddedBidPercentage?: number;
  ownResourcesBidPercentage?: number;
  bidDiscountType?: 'reduceTerm' | 'reducePayment';
  reducedPaymentEnabled?: boolean;
  reducedPaymentPercentage?: number;
  financingRate?: number;
}

// Função para calcular financiamento pela Tabela Price
const calculateFinancingCost = (principal: number, monthlyRate: number, months: number): number => {
  const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return monthlyPayment * months;
};

export const calculateSimulation = (input: CalculationInput): SimulationData => {
  const { 
    creditType,
    creditValue, 
    installments, 
    contemplationTime, 
    adminRate, 
    reserveFundRate, 
    insuranceRate,
    embeddedBidPercentage = 0,
    ownResourcesBidPercentage = 0,
    bidDiscountType = 'reducePayment',
    reducedPaymentEnabled = false,
    reducedPaymentPercentage = 50,
    financingRate = 0
  } = input;
  
  // Cálculo da parcela usando as taxas específicas
  const adminValue = creditValue * (adminRate / 100);
  const reserveFundValue = creditValue * (reserveFundRate / 100);
  const insuranceValue = creditValue * (insuranceRate / 100);
  
  const totalCreditWithTaxes = creditValue + adminValue + reserveFundValue + insuranceValue;
  let monthlyPayment = totalCreditWithTaxes / installments;
  
  // Aplicar parcela reduzida se habilitada (CORRIGIDO)
  let actualMonthlyPayment = monthlyPayment;
  let compensationAmount = 0;
  
  if (reducedPaymentEnabled) {
    actualMonthlyPayment = monthlyPayment * (reducedPaymentPercentage / 100);
    const unpaidAmount = monthlyPayment - actualMonthlyPayment;
    compensationAmount = unpaidAmount * contemplationTime;
  }
  
  // Cálculos de lance
  const embeddedBidValue = creditValue * (embeddedBidPercentage / 100);
  const ownResourcesBidValue = creditValue * (ownResourcesBidPercentage / 100);
  const bidValue = embeddedBidValue + ownResourcesBidValue;
  
  // CÁLCULO CRÍTICO: Crédito disponível após lance embutido
  const availableCredit = creditValue - embeddedBidValue;
  
  const remainingInstallments = installments - contemplationTime;
  
  let postContemplationPayment = monthlyPayment;
  let finalTerm = remainingInstallments;
  
  if (bidValue > 0) {
    if (bidDiscountType === 'reduceTerm') {
      // Reduzir prazo: parcela mantém valor, prazo diminui
      const installmentsToReduce = Math.floor(bidValue / monthlyPayment);
      finalTerm = Math.max(1, remainingInstallments - installmentsToReduce);
      postContemplationPayment = monthlyPayment;
    } else {
      // Reduzir parcela: prazo mantém, parcela diminui
      const remainingDebt = monthlyPayment * remainingInstallments - bidValue;
      postContemplationPayment = Math.max(0, remainingDebt / remainingInstallments);
      finalTerm = remainingInstallments;
    }
  }
  
  // Compensar parcela reduzida no pós-contemplação
  if (reducedPaymentEnabled) {
    postContemplationPayment += compensationAmount / finalTerm;
  }
  
  // Total a ser pago
  const totalPaid = (actualMonthlyPayment * contemplationTime) + (postContemplationPayment * finalTerm) + ownResourcesBidValue;
  
  // Total investido até a contemplação (CORRIGIDO)
  const totalInvested = actualMonthlyPayment * contemplationTime;
  
  // Definir índice de correção baseado no tipo de crédito
  const correctionIndex = creditType === 'property' ? 'INCC' : 'IPCA';
  const correctionRate = creditType === 'property' ? 0.06 : 0.05; // 6% INCC, 5% IPCA
  
  // Cenário 1: Venda da Cota (mesmo para ambos os tipos)
  const quotaSaleAgio = 15;
  const quotaSaleProfit = creditValue * (quotaSaleAgio / 100);
  const quotaSaleValue = totalInvested + quotaSaleProfit;
  const quotaSaleProfitPercentage = (quotaSaleProfit / totalInvested) * 100;
  
  let scenarios: SimulationData['scenarios'];
  
  if (creditType === 'property') {
    // Cenário 2: Aquisição de Imóvel
    const propertyValue = availableCredit * (1 + correctionRate);
    const rentalRate = 0.01;
    const monthlyRental = propertyValue * rentalRate;
    const netMonthlyReturn = monthlyRental - postContemplationPayment;
    
    scenarios = {
      quotaSale: {
        title: "Venda da Cota na Contemplação",
        totalReturn: quotaSaleValue,
        profit: quotaSaleProfit,
        profitPercentage: quotaSaleProfitPercentage,
        agio: quotaSaleAgio
      },
      propertyAcquisition: {
        title: "Aquisição de Imóvel",
        propertyValue,
        monthlyRental,
        postContemplationPayment,
        netMonthlyReturn
      },
      appliedCredit: {
        title: "Crédito Aplicado em Investimentos",
        appliedValue: availableCredit * (1 + correctionRate),
        investmentReturn: 12,
        finalValue: availableCredit * (1 + correctionRate) * Math.pow(1.12, finalTerm / 12),
        totalProfit: (availableCredit * (1 + correctionRate) * Math.pow(1.12, finalTerm / 12)) - (availableCredit * (1 + correctionRate)),
        monthsToApply: finalTerm
      }
    };
  } else {
    // Cenário 2: Comparativo vs. Financiamento
    const correctedCredit = availableCredit * (1 + correctionRate);
    const monthlyFinancingRate = financingRate / 100;
    const financingTotalCost = calculateFinancingCost(correctedCredit, monthlyFinancingRate, finalTerm);
    const consortiumTotalCost = totalPaid;
    const savings = financingTotalCost - consortiumTotalCost;
    const savingsPercentage = (savings / financingTotalCost) * 100;
    
    scenarios = {
      quotaSale: {
        title: "Venda da Cota na Contemplação",
        totalReturn: quotaSaleValue,
        profit: quotaSaleProfit,
        profitPercentage: quotaSaleProfitPercentage,
        agio: quotaSaleAgio
      },
      financingComparison: {
        title: "Comparativo: Consórcio vs. Financiamento",
        consortiumTotalCost,
        financingTotalCost,
        savings,
        savingsPercentage
      },
      appliedCredit: {
        title: "Crédito Aplicado em Investimentos",
        appliedValue: correctedCredit,
        investmentReturn: 12,
        finalValue: correctedCredit * Math.pow(1.12, finalTerm / 12),
        totalProfit: (correctedCredit * Math.pow(1.12, finalTerm / 12)) - correctedCredit,
        monthsToApply: finalTerm
      }
    };
  }
  
  return {
    creditType,
    correctionIndex,
    financingRate,
    creditValue,
    installments,
    contemplationTime,
    monthlyPayment: actualMonthlyPayment,
    postContemplationPayment,
    finalTerm,
    bidValue,
    embeddedBidValue,
    ownResourcesBidValue,
    availableCredit,
    totalPaid,
    totalInvested,
    reducedPaymentEnabled,
    reducedPaymentPercentage,
    scenarios
  };
};
