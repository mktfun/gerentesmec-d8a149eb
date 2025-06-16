
// Função para calcular a Taxa Interna de Retorno (TIR/IRR) para o CET
export const calculateIRR = (cashFlows: number[], guess: number = 0.1, maxIterations: number = 1000): number => {
  let rate = guess;
  const tolerance = 1e-10;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    
    for (let j = 0; j < cashFlows.length; j++) {
      const periodRate = Math.pow(1 + rate, j);
      npv += cashFlows[j] / periodRate;
      dnpv += (-j * cashFlows[j]) / (periodRate * (1 + rate));
    }
    
    if (Math.abs(npv) < tolerance) {
      return rate;
    }
    
    if (Math.abs(dnpv) < tolerance) {
      break;
    }
    
    const newRate = rate - npv / dnpv;
    
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }
    
    rate = newRate;
    
    // Prevenir taxas extremas
    if (rate < -0.99) rate = -0.99;
    if (rate > 10) rate = 10;
  }
  
  return rate;
};

export const calculateCET = (creditValue: number, monthlyPayments: number[], anticipatedTaxValue: number = 0): { cetMonthly: number; cetAnnual: number } => {
  if (creditValue <= 0 || monthlyPayments.length === 0) {
    return { cetMonthly: 0, cetAnnual: 0 };
  }
  
  // Fluxo de caixa: entrada positiva (crédito recebido) e saídas negativas (parcelas pagas)
  const cashFlows: number[] = [creditValue]; // Entrada inicial
  
  // Adicionar as parcelas como saídas negativas
  monthlyPayments.forEach(payment => {
    cashFlows.push(-payment);
  });
  
  try {
    const cetMonthly = calculateIRR(cashFlows);
    
    if (isNaN(cetMonthly) || !isFinite(cetMonthly)) {
      throw new Error('IRR calculation failed');
    }
    
    // Anualização correta usando juros compostos
    const cetAnnual = Math.pow(1 + cetMonthly, 12) - 1;
    
    return {
      cetMonthly: Math.max(0, cetMonthly * 100), // Converter para percentual
      cetAnnual: Math.max(0, cetAnnual * 100)
    };
  } catch (error) {
    // Fallback mais robusto se o IRR não convergir
    const totalPaid = monthlyPayments.reduce((sum, payment) => sum + payment, 0);
    const periods = monthlyPayments.length;
    
    if (periods > 0 && creditValue > 0 && totalPaid > creditValue) {
      // Cálculo aproximado baseado na taxa efetiva
      const totalCostRatio = totalPaid / creditValue;
      const monthlyEffectiveRate = Math.pow(totalCostRatio, 1/periods) - 1;
      const annualEffectiveRate = Math.pow(1 + monthlyEffectiveRate, 12) - 1;
      
      return {
        cetMonthly: Math.max(0, monthlyEffectiveRate * 100),
        cetAnnual: Math.max(0, annualEffectiveRate * 100)
      };
    }
    
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
