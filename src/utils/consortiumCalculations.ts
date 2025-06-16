
import { SimulationData } from '@/pages/Index';
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
  anticipatedTaxRate?: number; // Nova taxa antecipada
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
    anticipatedTaxRate = 0.5 // Taxa padrão de 0.5% para taxa antecipada
  } = input;
  
  // Cálculo da parcela usando as taxas específicas
  const adminValue = creditValue * (adminRate / 100);
  const reserveFundValue = creditValue * (reserveFundRate / 100);
  const insuranceValue = creditValue * (insuranceRate / 100);
  
  // Implementação da Taxa Antecipada (apenas nas primeiras 12 parcelas)
  const anticipatedTaxValue = creditValue * (anticipatedTaxRate / 100);
  const anticipatedTaxPerInstallment = anticipatedTaxValue / Math.min(12, installments);
  
  const totalCreditWithTaxes = creditValue + adminValue + reserveFundValue + insuranceValue;
  let baseMonthlyPayment = totalCreditWithTaxes / installments;
  
  // Aplicar parcela reduzida se habilitada
  let actualMonthlyPayment = baseMonthlyPayment;
  let compensationAmount = 0;
  
  if (reducedPaymentEnabled) {
    actualMonthlyPayment = baseMonthlyPayment * (reducedPaymentPercentage / 100);
    const unpaidAmount = baseMonthlyPayment - actualMonthlyPayment;
    compensationAmount = unpaidAmount * contemplationTime;
  }
  
  // Adicionar taxa antecipada às primeiras 12 parcelas (ou até a contemplação se for menor)
  const installmentsWithAnticipatedTax = Math.min(12, contemplationTime);
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
  
  if (reducedPaymentEnabled) {
    postContemplationPayment += compensationAmount / finalTerm;
  }
  
  // Calcular total pago considerando taxa antecipada
  const totalPaidWithAnticipatedTax = (monthlyPaymentWithAnticipatedTax * installmentsWithAnticipatedTax) + 
                                     (actualMonthlyPayment * (contemplationTime - installmentsWithAnticipatedTax)) +
                                     (postContemplationPayment * finalTerm) + 
                                     ownResourcesBidValue;
  
  // Total investido até a contemplação (incluindo taxa antecipada)
  const totalInvested = (monthlyPaymentWithAnticipatedTax * installmentsWithAnticipatedTax) + 
                       (actualMonthlyPayment * (contemplationTime - installmentsWithAnticipatedTax));
  
  // Calcular métricas financeiras
  const demonstrativeRate = calculateDemonstrativeRate(adminRate, reserveFundRate, installments);
  
  // Preparar fluxo de pagamentos para CET
  const monthlyPayments: number[] = [];
  for (let i = 0; i < installmentsWithAnticipatedTax; i++) {
    monthlyPayments.push(monthlyPaymentWithAnticipatedTax);
  }
  for (let i = installmentsWithAnticipatedTax; i < contemplationTime; i++) {
    monthlyPayments.push(actualMonthlyPayment);
  }
  for (let i = 0; i < finalTerm; i++) {
    monthlyPayments.push(postContemplationPayment);
  }
  
  const cet = calculateCET(creditValue, monthlyPayments, anticipatedTaxValue);
  
  // Definir índice de correção baseado no tipo de crédito
  const correctionIndex = creditType === 'property' ? 'INCC' : 'IPCA';
  const correctionRate = creditType === 'property' ? 0.06 : 0.05;
  
  // Cenário 1: Venda da Cota
  const quotaSaleAgio = 15;
  const quotaSaleProfit = creditValue * (quotaSaleAgio / 100);
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
