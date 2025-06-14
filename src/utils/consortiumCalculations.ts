
import { SimulationData } from '@/pages/Index';

interface CalculationInput {
  creditValue: number;
  installments: number;
  contemplationTime: number;
  adminRate: number;
  reserveFundRate: number;
  insuranceRate: number;
  bidPercentage?: number;
  bidDiscountType?: 'reduceTerm' | 'reducePayment';
}

export const calculateSimulation = (input: CalculationInput): SimulationData => {
  const { 
    creditValue, 
    installments, 
    contemplationTime, 
    adminRate, 
    reserveFundRate, 
    insuranceRate,
    bidPercentage = 0,
    bidDiscountType = 'reducePayment'
  } = input;
  
  // Cálculo da parcela usando as taxas específicas
  const adminValue = creditValue * (adminRate / 100);
  const reserveFundValue = creditValue * (reserveFundRate / 100);
  const insuranceValue = creditValue * (insuranceRate / 100);
  
  const totalCreditWithTaxes = creditValue + adminValue + reserveFundValue + insuranceValue;
  const monthlyPayment = totalCreditWithTaxes / installments;
  
  // Cálculos de lance
  const bidValue = creditValue * (bidPercentage / 100);
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
  
  // Total a ser pago
  const totalPaid = (monthlyPayment * contemplationTime) + (postContemplationPayment * finalTerm) + bidValue;
  
  // Valor pago até a contemplação
  const paidUntilContemplation = monthlyPayment * contemplationTime;
  
  // Cenário 1: Venda da Cota (com ágio de 15% sobre o crédito)
  const quotaSaleAgio = 0.15; // 15% de ágio
  const quotaSaleValue = creditValue * (1 + quotaSaleAgio);
  const quotaSaleProfit = quotaSaleValue - paidUntilContemplation - bidValue;
  const quotaSaleProfitPercentage = (quotaSaleProfit / (paidUntilContemplation + bidValue)) * 100;
  
  // Cenário 2: Aquisição de Imóvel (lógica corrigida)
  const propertyValue = creditValue * 1.06; // Crédito corrigido por valorização de 6%
  const rentalRate = 0.01; // 1% ao mês sobre o valor do imóvel
  const monthlyRental = propertyValue * rentalRate;
  const netMonthlyReturn = monthlyRental - postContemplationPayment;
  
  // Cenário 3: Crédito Aplicado (lógica corrigida - juros compostos sobre o montante total)
  const appliedValue = creditValue * 1.06; // Valor corrigido aplicado
  const investmentReturn = 12; // 12% a.a.
  const monthsToApply = finalTerm; // Prazo restante após contemplação
  const yearsToApply = monthsToApply / 12;
  const finalInvestmentValue = appliedValue * Math.pow(1 + (investmentReturn / 100), yearsToApply);
  const totalInvestmentProfit = finalInvestmentValue - appliedValue - (postContemplationPayment * finalTerm);
  
  return {
    creditValue,
    installments,
    contemplationTime,
    monthlyPayment,
    postContemplationPayment,
    finalTerm,
    bidValue,
    totalPaid,
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
