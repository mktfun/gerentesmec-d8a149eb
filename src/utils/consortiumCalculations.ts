interface SimulationData {
  creditType: string;
  correctionIndex: string;
  financingRate: number;
  creditValue: number;
  installments: number;
  contemplationTime: number;
  monthlyPayment: number;
  monthlyPaymentWithAnticipatedTax: number;
  postContemplationPayment: number;
  finalTerm: number;
  bidValue: number;
  embeddedBidValue: number;
  ownResourcesBidValue: number;
  availableCredit: number;
  totalPaid: number;
  totalInvested: number;
  reducedPaymentEnabled: boolean;
  reducedPaymentPercentage: number;
  anticipatedTaxValue: number;
  demonstrativeRate: any;
  cet: any;
  scenarios: any;
}

import { calculateCET, calculateDemonstrativeRate } from './financialMetrics';

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
  anticipatedTaxRate?: number;
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
    financingRate = 0,
    anticipatedTaxRate = 0.5
  } = input;
  
  // MODELO DE CÁLCULO EMBRACON CORRIGIDO:
  // 1. Fundo Comum Mensal = Valor do Crédito / Prazo
  const commonFundMonthly = creditValue / installments;
  
  // 2. Taxa de Adm Mensal = (Valor do Crédito * Taxa Adm %) / Prazo
  const adminTaxMonthly = (creditValue * (adminRate / 100)) / installments;
  
  // 3. Fundo de Reserva Mensal = (Valor do Crédito * Fundo Reserva %) / Prazo
  const reserveFundMonthly = (creditValue * (reserveFundRate / 100)) / installments;
  
  // 4. Seguro de Vida Mensal = (Valor do Crédito * Seguro %) / Prazo
  const insuranceMonthly = (creditValue * (insuranceRate / 100)) / installments;
  
  // 5. Taxa Antecipada (aplicada apenas nas primeiras 12 parcelas)
  const anticipatedTaxValue = creditValue * (anticipatedTaxRate / 100);
  const anticipatedTaxPerInstallment = anticipatedTaxValue / Math.min(12, installments);
  
  // Parcela base = soma de todos os componentes EXCETO taxa antecipada
  let baseMonthlyPayment = commonFundMonthly + adminTaxMonthly + reserveFundMonthly + insuranceMonthly;
  
  // Aplicar parcela reduzida APENAS sobre o Fundo Comum
  let actualCommonFund = commonFundMonthly;
  let compensationAmount = 0;
  
  if (reducedPaymentEnabled) {
    actualCommonFund = commonFundMonthly * (reducedPaymentPercentage / 100);
    const unpaidAmount = commonFundMonthly - actualCommonFund;
    compensationAmount = unpaidAmount * contemplationTime;
  }
  
  // Parcela real = Fundo Comum (possivelmente reduzido) + outras taxas
  const actualMonthlyPayment = actualCommonFund + adminTaxMonthly + reserveFundMonthly + insuranceMonthly;
  
  // Parcela com taxa antecipada (primeiras 12 parcelas)
  const monthlyPaymentWithAnticipatedTax = actualMonthlyPayment + anticipatedTaxPerInstallment;
  
  // Cálculos de lance
  const embeddedBidValue = creditValue * (embeddedBidPercentage / 100);
  const ownResourcesBidValue = creditValue * (ownResourcesBidPercentage / 100);
  const bidValue = embeddedBidValue + ownResourcesBidValue;
  
  // Crédito disponível após lance embutido
  const availableCredit = creditValue - embeddedBidValue;
  
  const remainingInstallments = installments - contemplationTime;
  
  let postContemplationPayment = baseMonthlyPayment;
  let finalTerm = remainingInstallments;
  
  if (bidValue > 0) {
    if (bidDiscountType === 'reduceTerm') {
      const installmentsToReduce = Math.floor(bidValue / baseMonthlyPayment);
      finalTerm = Math.max(1, remainingInstallments - installmentsToReduce);
      postContemplationPayment = baseMonthlyPayment;
    } else {
      const remainingDebt = baseMonthlyPayment * remainingInstallments - bidValue;
      postContemplationPayment = Math.max(0, remainingDebt / remainingInstallments);
      finalTerm = remainingInstallments;
    }
  }
  
  // Compensação da parcela reduzida
  if (reducedPaymentEnabled) {
    postContemplationPayment += compensationAmount / finalTerm;
  }
  
  // Calcular total pago considerando taxa antecipada
  const installmentsWithAnticipatedTax = Math.min(12, contemplationTime);
  const totalPaidWithAnticipatedTax = (monthlyPaymentWithAnticipatedTax * installmentsWithAnticipatedTax) + 
                                     (actualMonthlyPayment * (contemplationTime - installmentsWithAnticipatedTax)) +
                                     (postContemplationPayment * finalTerm) + 
                                     ownResourcesBidValue;
  
  // Total investido até a contemplação
  const totalInvested = (monthlyPaymentWithAnticipatedTax * installmentsWithAnticipatedTax) + 
                       (actualMonthlyPayment * (contemplationTime - installmentsWithAnticipatedTax));
  
  // Calcular métricas financeiras
  const demonstrativeRate = calculateDemonstrativeRate(adminRate, reserveFundRate, installments);
  
  // CÁLCULO CORRETO DO CET baseado no fluxo pós-contemplação
  const cet = calculateCET(availableCredit, postContemplationPayment, finalTerm);
  
  // Definir índice de correção baseado no tipo de crédito
  const correctionIndex = creditType === 'property' ? 'INCC' : 'IPCA';
  const correctionRate = creditType === 'property' ? 0.06 : 0.05;
  
  // Cenário 1: Venda da Cota
  const quotaSaleAgio = 15;
  const quotaSaleProfit = totalInvested * (quotaSaleAgio / 100);
  const quotaSaleValue = totalInvested + quotaSaleProfit;
  const quotaSaleProfitPercentage = (quotaSaleProfit / totalInvested) * 100;
  
  let scenarios: SimulationData['scenarios'];
  
  if (creditType === 'property') {
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
    const correctedCredit = availableCredit * (1 + correctionRate);
    const monthlyFinancingRate = financingRate / 100;
    const financingTotalCost = calculateFinancingCost(correctedCredit, monthlyFinancingRate, finalTerm);
    const consortiumTotalCost = totalPaidWithAnticipatedTax;
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
    monthlyPaymentWithAnticipatedTax,
    postContemplationPayment,
    finalTerm,
    bidValue,
    embeddedBidValue,
    ownResourcesBidValue,
    availableCredit,
    totalPaid: totalPaidWithAnticipatedTax,
    totalInvested,
    reducedPaymentEnabled,
    reducedPaymentPercentage,
    anticipatedTaxValue,
    demonstrativeRate,
    cet,
    scenarios
  };
};
