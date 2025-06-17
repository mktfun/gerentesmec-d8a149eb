
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
    
    if (Math.abs(dnpv) < 0.000001) break;
    
    const newRate = rate - npv / dnpv;
    
    if (Math.abs(newRate - rate) < 0.000001) {
      return newRate;
    }
    
    rate = newRate;
  }
  
  return rate;
};

export const calculateCET = (creditValue: number, monthlyPayments: number[], anticipatedTaxValue: number = 0): { cetMonthly: number; cetAnnual: number } => {
  // Fluxo de caixa corrigido: entrada positiva (crédito recebido) e saídas negativas (parcelas pagas)
  const cashFlows: number[] = [creditValue]; // Entrada inicial
  
  // Adicionar as parcelas como saídas negativas
  monthlyPayments.forEach(payment => {
    cashFlows.push(-payment);
  });
  
  try {
    const cetMonthly = calculateIRR(cashFlows);
    // Garantir que o resultado seja um número válido e positivo
    const validCetMonthly = isNaN(cetMonthly) || !isFinite(cetMonthly) ? 0 : Math.abs(cetMonthly);
    // Conversão correta para taxa anual composta
    const cetAnnual = Math.pow(1 + validCetMonthly, 12) - 1;
    
    return {
      cetMonthly: validCetMonthly * 100, // Converter para percentual
      cetAnnual: cetAnnual * 100
    };
  } catch (error) {
    // Fallback melhorado se o IRR não convergir
    const totalPaid = monthlyPayments.reduce((sum, payment) => sum + payment, 0);
    const periods = monthlyPayments.length;
    
    if (periods > 0 && creditValue > 0) {
      // Cálculo aproximado mais preciso
      const effectiveRate = Math.pow(totalPaid / creditValue, 1/periods) - 1;
      const annualRate = Math.pow(1 + effectiveRate, 12) - 1;
      
      return {
        cetMonthly: Math.max(0, effectiveRate * 100),
        cetAnnual: Math.max(0, annualRate * 100)
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
