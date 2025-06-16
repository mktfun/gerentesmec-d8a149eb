
// Função para calcular a Taxa Interna de Retorno (TIR/IRR) para o CET
export const calculateIRR = (cashFlows: number[], guess: number = 0.01, maxIterations: number = 1000): number => {
  let rate = guess;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    
    for (let j = 0; j < cashFlows.length; j++) {
      const denominator = Math.pow(1 + rate, j);
      npv += cashFlows[j] / denominator;
      if (j > 0) {
        dnpv += (-j * cashFlows[j]) / Math.pow(1 + rate, j + 1);
      }
    }
    
    if (Math.abs(dnpv) < 0.000001 || Math.abs(npv) < 0.000001) {
      return Math.max(0, rate);
    }
    
    const newRate = rate - npv / dnpv;
    
    if (Math.abs(newRate - rate) < 0.000001) {
      return Math.max(0, newRate);
    }
    
    // Evitar taxas negativas ou muito altas
    rate = Math.max(0.0001, Math.min(newRate, 0.5));
  }
  
  return Math.max(0, rate);
};

export const calculateCET = (creditValue: number, monthlyPayments: number[], anticipatedTaxValue: number = 0): { cetMonthly: number; cetAnnual: number } => {
  if (!creditValue || creditValue <= 0 || !monthlyPayments || monthlyPayments.length === 0) {
    return { cetMonthly: 0, cetAnnual: 0 };
  }

  // Fluxo de caixa: entrada positiva (crédito) no período 0, saídas negativas (parcelas)
  const cashFlows: number[] = [creditValue];
  
  // Adicionar todas as parcelas como saídas negativas
  monthlyPayments.forEach(payment => {
    if (payment > 0) {
      cashFlows.push(-payment);
    }
  });
  
  // Validar se temos fluxo de caixa suficiente
  if (cashFlows.length < 2) {
    return { cetMonthly: 0, cetAnnual: 0 };
  }
  
  try {
    const cetMonthly = calculateIRR(cashFlows, 0.01, 1000);
    
    // Conversão correta para taxa anual (juros compostos)
    const cetAnnual = Math.pow(1 + cetMonthly, 12) - 1;
    
    return {
      cetMonthly: Math.min(50, Math.max(0, cetMonthly * 100)), // Limitar a 50% ao mês
      cetAnnual: Math.min(600, Math.max(0, cetAnnual * 100))   // Limitar a 600% ao ano
    };
  } catch (error) {
    console.error('Erro no cálculo do CET:', error);
    
    // Fallback: cálculo aproximado mais robusto
    const totalPaid = monthlyPayments.reduce((sum, payment) => sum + payment, 0);
    const periods = monthlyPayments.length;
    
    if (periods > 0 && creditValue > 0 && totalPaid > creditValue) {
      const effectiveRate = Math.pow(totalPaid / creditValue, 1/periods) - 1;
      const annualRate = Math.pow(1 + effectiveRate, 12) - 1;
      
      return {
        cetMonthly: Math.min(50, Math.max(0, effectiveRate * 100)),
        cetAnnual: Math.min(600, Math.max(0, annualRate * 100))
      };
    }
    
    return { cetMonthly: 0, cetAnnual: 0 };
  }
};

export const calculateDemonstrativeRate = (adminRate: number, reserveFundRate: number, totalInstallments: number): { monthlyRate: number; annualRate: number } => {
  const monthlyRate = (adminRate + reserveFundRate) / totalInstallments;
  const annualRate = monthlyRate * 12;
  
  return {
    monthlyRate: Math.max(0, monthlyRate),
    annualRate: Math.max(0, annualRate)
  };
};

// Função para formatação consistente de percentuais
export const formatPercentage = (value: number, decimals: number = 2): string => {
  if (isNaN(value) || !isFinite(value)) return '0,00%';
  return value.toLocaleString('pt-BR', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  }) + '%';
};
