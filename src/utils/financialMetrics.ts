
// Função para calcular a Taxa Interna de Retorno (TIR/IRR) para o CET
export const calculateIRR = (cashFlows: number[], guess: number = 0.1, maxIterations: number = 100): number => {
  let rate = guess;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    
    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / Math.pow(1 + rate, j);
      dnpv += (-j * cashFlows[j]) / Math.pow(1 + rate, j + 1);
    }
    
    const newRate = rate - npv / dnpv;
    
    if (Math.abs(newRate - rate) < 0.000001) {
      return newRate;
    }
    
    rate = newRate;
  }
  
  return rate;
};

export const calculateCET = (creditValue: number, monthlyPayments: number[], anticipatedTaxValue: number = 0): { cetMonthly: number; cetAnnual: number } => {
  // Fluxo de caixa: entrada positiva (crédito recebido) e saídas negativas (parcelas pagas)
  const cashFlows: number[] = [creditValue]; // Entrada inicial
  
  // Adicionar as parcelas como saídas negativas
  monthlyPayments.forEach(payment => {
    cashFlows.push(-payment);
  });
  
  // Se houver taxa antecipada, ajustar as primeiras 12 parcelas
  if (anticipatedTaxValue > 0 && monthlyPayments.length >= 12) {
    const anticipatedTaxPerInstallment = anticipatedTaxValue / 12;
    for (let i = 1; i <= Math.min(12, monthlyPayments.length); i++) {
      cashFlows[i] -= anticipatedTaxPerInstallment;
    }
  }
  
  try {
    const cetMonthly = calculateIRR(cashFlows);
    const cetAnnual = cetMonthly * 12;
    
    return {
      cetMonthly: Math.max(0, cetMonthly * 100), // Converter para percentual
      cetAnnual: Math.max(0, cetAnnual * 100)
    };
  } catch (error) {
    return { cetMonthly: 0, cetAnnual: 0 };
  }
};

export const calculateDemonstrativeRate = (adminRate: number, reserveFundRate: number, totalInstallments: number): { monthlyRate: number; annualRate: number } => {
  const monthlyRate = (adminRate + reserveFundRate) / totalInstallments;
  const annualRate = monthlyRate * 12;
  
  return {
    monthlyRate,
    annualRate
  };
};
