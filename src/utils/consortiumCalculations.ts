
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
  
  // Cenário 1: Venda da Cota (FÓRMULA CORRIGIDA)
  const quotaSaleAgio = 0.15; // 15% de ágio
  // Retorno Total = Parcelas pagas + Prêmio do ágio
  const quotaSaleProfit = creditValue * (quotaSaleAgio / 100); // Apenas o ágio como lucro
  const quotaSaleValue = paidUntilContemplation + quotaSaleProfit; // Parcelas + Prêmio
  const quotaSaleProfitPercentage = (quotaSaleProfit / paidUntilContemplation) * 100;
  
  // Cenário 2: Aquisição de Imóvel (lógica mantida)
  const propertyValue = creditValue * 1.06; // Crédito corrigido por valorização de 6%
  const rentalRate = 0.01; // 1% ao mês sobre o valor do imóvel
  const monthlyRental = propertyValue * rentalRate;
  const netMonthlyReturn = monthlyRental - postContemplationPayment;
  
  // Cenário 3: Crédito Aplicado (FÓRMULA CORRIGIDA)
  const appliedValue = creditValue * 1.06; // Valor corrigido aplicado
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
