
import { SimulationData } from '@/pages/Index';

interface CalculationInput {
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
}

export const calculateSimulation = (input: CalculationInput): SimulationData => {
  const { 
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
    reducedPaymentPercentage = 50
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
  
  // Cenário 1: Venda da Cota (FÓRMULA CORRIGIDA)
  const quotaSaleAgio = 15; // 15% de ágio
  // Lucro Líquido = Apenas o ágio como lucro (CORRIGIDO)
  const quotaSaleProfit = creditValue * (quotaSaleAgio / 100);
  // Retorno Total = Total Investido + Lucro Líquido (CORRIGIDO)
  const quotaSaleValue = totalInvested + quotaSaleProfit;
  const quotaSaleProfitPercentage = (quotaSaleProfit / totalInvested) * 100;
  
  // Cenário 2: Aquisição de Imóvel (usa crédito disponível)
  const propertyValue = availableCredit * 1.06; // Crédito disponível corrigido por valorização de 6%
  const rentalRate = 0.01; // 1% ao mês sobre o valor do imóvel
  const monthlyRental = propertyValue * rentalRate;
  const netMonthlyReturn = monthlyRental - postContemplationPayment;
  
  // Cenário 3: Crédito Aplicado (usa crédito disponível)
  const appliedValue = availableCredit * 1.06; // Valor disponível corrigido aplicado
  const investmentReturn = 12; // 12% a.a.
  const monthsToApply = finalTerm; // Prazo restante após contemplação
  const yearsToApply = monthsToApply / 12;
  // Fórmula de juros compostos: FV = PV * (1 + r)^n
  const finalInvestmentValue = appliedValue * Math.pow(1 + (investmentReturn / 100), yearsToApply);
  // Lucro Total = Valor Final - Valor Aplicado (FÓRMULA CORRIGIDA)
  const totalInvestmentProfit = finalInvestmentValue - appliedValue;
  
  return {
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
    scenarios: {
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
        appliedValue,
        investmentReturn,
        finalValue: finalInvestmentValue,
        totalProfit: totalInvestmentProfit,
        monthsToApply
      }
    }
  };
};
