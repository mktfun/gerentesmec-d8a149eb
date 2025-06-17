
// Função para calcular a Taxa Interna de Retorno (TIR/IRR) usando Newton-Raphson
export const calculateIRR = (cashFlows: number[], guess: number = 0.01, maxIterations: number = 1000): number => {
  let rate = guess;
  const tolerance = 0.0000001;
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let npv = 0;
    let dnpv = 0;
    
    // Calcular NPV e sua derivada
    for (let period = 0; period < cashFlows.length; period++) {
      const divisor = Math.pow(1 + rate, period);
      npv += cashFlows[period] / divisor;
      
      if (period > 0) {
        dnpv += (-period * cashFlows[period]) / Math.pow(1 + rate, period + 1);
      }
    }
    
    // Verificar convergência
    if (Math.abs(npv) < tolerance) {
      return rate;
    }
    
    // Evitar divisão por zero
    if (Math.abs(dnpv) < tolerance) {
      break;
    }
    
    // Atualizar taxa usando Newton-Raphson
    const newRate = rate - npv / dnpv;
    
    // Verificar convergência da taxa
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }
    
    rate = newRate;
    
    // Limitar a taxa para valores razoáveis
    if (rate < -0.99) rate = -0.99;
    if (rate > 10) rate = 10;
  }
  
  return rate;
};

export const calculateCET = (availableCredit: number, postContemplationPayment: number, finalTerm: number): { cetMonthly: number; cetAnnual: number } => {
  try {
    // Validação de entrada
    if (availableCredit <= 0 || postContemplationPayment <= 0 || finalTerm <= 0) {
      return { cetMonthly: 0, cetAnnual: 0 };
    }
    
    // Fluxo de caixa correto para CET:
    // Período 0: Entrada do crédito líquido (POSITIVO)
    // Períodos 1 a finalTerm: Parcelas pós-contemplação (NEGATIVAS)
    const cashFlows: number[] = [availableCredit]; // Entrada positiva
    
    // Adicionar as parcelas como saídas negativas
    for (let month = 1; month <= finalTerm; month++) {
      cashFlows.push(-postContemplationPayment);
    }
    
    // Calcular a TIR
    const cetMonthly = calculateIRR(cashFlows);
    
    // Garantir que o resultado seja válido
    if (isNaN(cetMonthly) || !isFinite(cetMonthly) || cetMonthly < 0) {
      return { cetMonthly: 0, cetAnnual: 0 };
    }
    
    // CET Anual = CET Mensal * 12 (taxa simples para demonstração)
    const cetAnnual = cetMonthly * 12;
    
    return {
      cetMonthly: cetMonthly * 100, // Converter para percentual
      cetAnnual: cetAnnual * 100
    };
  } catch (error) {
    console.error('Erro no cálculo do CET:', error);
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
