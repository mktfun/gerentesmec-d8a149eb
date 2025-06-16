
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
  anticipatedTaxRate: number;
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
    anticipatedTaxRate,
    embeddedBidPercentage = 0,
    ownResourcesBidPercentage = 0,
    bidDiscountType = 'reducePayment',
    reducedPaymentEnabled = false,
    reducedPaymentPercentage = 50,
    financingRate = 0
  } = input;
  
  // MODELO EMBRACON CORRIGIDO PARA ALINHAR EXATAMENTE COM PDF:
  // 1. Fundo Comum Mensal = Valor do Crédito / Prazo
  const commonFundMonthly = creditValue / installments;
  
  // 2. Taxa de Adm Mensal = (Valor do Crédito * Taxa Adm %) / Prazo
  const adminTaxMonthly = (creditValue * (adminRate / 100)) / installments;
  
  // 3. Fundo de Reserva Mensal = (Valor do Crédito * Fundo Reserva %) / Prazo
  const reserveFundMonthly = (creditValue * (reserveFundRate / 100)) / installments;
  
  // 4. Seguro de Vida Mensal = (Valor do Crédito * Seguro %) / Prazo
  const insuranceMonthly = (creditValue * (insuranceRate / 100)) / installments;
  
  // 5. Taxa Antecipada: Valor total distribuído nas primeiras 12 parcelas
  const anticipatedTaxTotal = creditValue * (anticipatedTaxRate / 100);
  const anticipatedTaxPerInstallment = anticipatedTaxTotal / Math.min(12, installments);
  
  // PARCELA BASE (sem taxa antecipada)
  const baseMonthlyPayment = commonFundMonthly + adminTaxMonthly + reserveFundMonthly + insuranceMonthly;
  
  // Aplicar parcela reduzida APENAS sobre o Fundo Comum
  let actualCommonFund = commonFundMonthly;
  let compensationAmount = 0;
  
  if (reducedPaymentEnabled) {
    actualCommonFund = commonFundMonthly * (reducedPaymentPercentage / 100);
    const unpaidAmount = commonFundMonthly - actualCommonFund;
    compensationAmount = unpaidAmount * contemplationTime;
  }
  
  // PARCELA PRÉ-CONTEMPLAÇÃO
  const preContemplationPayment = actualCommonFund + adminTaxMonthly + reserveFundMonthly + insuranceMonthly;
  
  // PARCELA COM TAXA ANTECIPADA (primeiras 12 parcelas)
  const monthlyPaymentWithAnticipatedTax = preContemplationPayment + anticipatedTaxPerInstallment;
  
  // Cálculos de lance
  const embeddedBidValue = creditValue * (embeddedBidPercentage / 100);
  const ownResourcesBidValue = creditValue * (ownResourcesBidPercentage / 100);
  const bidValue = embeddedBidValue + ownResourcesBidValue;
  
  // Crédito disponível após lance embutido
  const availableCredit = creditValue - embeddedBidValue;
  
  const remainingInstallments = installments - contemplationTime;
  
  // CÁLCULO PÓS-CONTEMPLAÇÃO
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
  
  // Adicionar compensação da parcela reduzida
  if (reducedPaymentEnabled && compensationAmount > 0) {
    postContemplationPayment += compensationAmount / finalTerm;
  }
  
  // TOTAL PAGO - Cálculo corrigido
  const installmentsWithAnticipatedTax = Math.min(12, contemplationTime);
  const remainingPreContemplation = Math.max(0, contemplationTime - installmentsWithAnticipatedTax);
  
  const totalPaidWithAnticipatedTax = 
    (monthlyPaymentWithAnticipatedTax * installmentsWithAnticipatedTax) + 
    (preContemplationPayment * remainingPreContemplation) +
    (postContemplationPayment * finalTerm) + 
    ownResourcesBidValue;
  
  // Total investido até a contemplação
  const totalInvested = 
    (monthlyPaymentWithAnticipatedTax * installmentsWithAnticipatedTax) + 
    (preContemplationPayment * remainingPreContemplation);
  
  // Calcular métricas financeiras
  const demonstrativeRate = calculateDemonstrativeRate(adminRate, reserveFundRate, installments);
  
  // Preparar fluxo de pagamentos para CET
  const monthlyPayments: number[] = [];
  
  // Adicionar parcelas com taxa antecipada
  for (let i = 0; i < installmentsWithAnticipatedTax; i++) {
    monthlyPayments.push(monthlyPaymentWithAnticipatedTax);
  }
  
  // Adicionar parcelas pré-contemplação restantes
  for (let i = 0; i < remainingPreContemplation; i++) {
    monthlyPayments.push(preContemplationPayment);
  }
  
  // Adicionar parcelas pós-contemplação
  for (let i = 0; i < finalTerm; i++) {
    monthlyPayments.push(postContemplationPayment);
  }
  
  const cet = calculateCET(creditValue, monthlyPayments, anticipatedTaxTotal);
  
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
    monthlyPayment: preContemplationPayment,
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
    anticipatedTaxValue: anticipatedTaxTotal,
    demonstrativeRate,
    cet,
    scenarios
  };
};
