
import { SimulationData } from '@/pages/Index';

interface CalculationInput {
  creditValue: number;
  installments: number;
  contemplationTime: number;
  adminRate: number;
  reserveFundRate: number;
  insuranceRate: number;
}

export const calculateSimulation = (input: CalculationInput): SimulationData => {
  const { creditValue, installments, contemplationTime, adminRate, reserveFundRate, insuranceRate } = input;
  
  // Cálculo da parcela usando as taxas específicas
  const adminValue = creditValue * (adminRate / 100);
  const reserveFundValue = creditValue * (reserveFundRate / 100);
  const insuranceValue = creditValue * (insuranceRate / 100);
  
  const totalCreditWithTaxes = creditValue + adminValue + reserveFundValue + insuranceValue;
  const monthlyPayment = totalCreditWithTaxes / installments;
  
  // Total a ser pago
  const totalPaid = monthlyPayment * installments;
  
  // Valor pago até a contemplação
  const paidUntilContemplation = monthlyPayment * contemplationTime;
  
  // Cenário 1: Venda da Cota
  const quotaSaleValue = creditValue * 0.85; // Valor de venda da cota (85% do crédito)
  const quotaSaleProfit = quotaSaleValue - paidUntilContemplation;
  const quotaSaleProfitPercentage = (quotaSaleProfit / paidUntilContemplation) * 100;
  
  // Cenário 2: Aquisição de Imóvel
  const propertyValue = creditValue * 1.2; // Valor do imóvel (20% acima do crédito)
  const downPayment = creditValue; // Entrada com o crédito do consórcio
  const financing = propertyValue - downPayment;
  const monthlyFinancing = financing * 0.008; // Taxa aproximada de financiamento
  const totalFinancingCost = totalPaid + (monthlyFinancing * 240); // 20 anos de financiamento
  
  // Cenário 3: Crédito Aplicado
  const investmentReturn = 12; // 12% a.a. (CDI + margin)
  const finalValue = creditValue * Math.pow(1 + (investmentReturn / 100), 5); // 5 years
  const totalInvestmentProfit = finalValue - totalPaid;
  
  return {
    creditValue,
    installments,
    contemplationTime,
    monthlyPayment,
    totalPaid,
    scenarios: {
      quotaSale: {
        title: "Venda da Cota na Contemplação",
        totalReturn: quotaSaleValue,
        profit: quotaSaleProfit,
        profitPercentage: quotaSaleProfitPercentage
      },
      propertyAcquisition: {
        title: "Aquisição de Imóvel",
        propertyValue,
        financing,
        monthlyFinancing,
        totalCost: totalFinancingCost
      },
      appliedCredit: {
        title: "Crédito Aplicado em Investimentos",
        investmentReturn,
        finalValue,
        totalProfit: totalInvestmentProfit
      }
    }
  };
};
