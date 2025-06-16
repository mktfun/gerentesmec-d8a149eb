
// Função robusta para calcular a Taxa Interna de Retorno (TIR/IRR) para o CET
export const calculateIRR = (cashFlows: number[], guess: number = 0.01, maxIterations: number = 1000): number => {
  // Validações básicas
  if (!cashFlows || cashFlows.length < 2) return 0;
  
  // Verificar se há pelo menos um valor positivo e um negativo
  const hasPositive = cashFlows.some(cf => cf > 0);
  const hasNegative = cashFlows.some(cf => cf < 0);
  if (!hasPositive || !hasNegative) return 0;
  
  let rate = guess;
  let previousRate = rate;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    
    // Calcular NPV e derivada
    for (let j = 0; j < cashFlows.length; j++) {
      const denominator = Math.pow(1 + rate, j);
      if (denominator === 0) continue;
      
      npv += cashFlows[j] / denominator;
      if (j > 0) {
        dnpv += (-j * cashFlows[j]) / Math.pow(1 + rate, j + 1);
      }
    }
    
    // Verificar convergência
    if (Math.abs(npv) < 0.000001) {
      return Math.max(0, Math.min(rate, 2)); // Limitar entre 0% e 200%
    }
    
    // Verificar se a derivada é muito pequena (evitar divisão por zero)
    if (Math.abs(dnpv) < 0.000001) {
      break;
    }
    
    // Newton-Raphson
    const newRate = rate - npv / dnpv;
    
    // Verificar convergência da taxa
    if (Math.abs(newRate - rate) < 0.000001) {
      return Math.max(0, Math.min(newRate, 2));
    }
    
    // Aplicar limites e suavização para evitar oscilações
    previousRate = rate;
    rate = Math.max(-0.5, Math.min(newRate, 2));
    
    // Se a taxa está oscilando muito, usar média ponderada
    if (i > 10 && Math.abs(rate - previousRate) > 0.1) {
      rate = (rate + previousRate) / 2;
    }
  }
  
  return Math.max(0, Math.min(rate, 2));
};

export const calculateCET = (creditValue: number, monthlyPayments: number[], anticipatedTaxValue: number = 0): { cetMonthly: number; cetAnnual: number } => {
  // Validações robustas
  if (!creditValue || creditValue <= 0 || !monthlyPayments || monthlyPayments.length === 0) {
    return { cetMonthly: 0, cetAnnual: 0 };
  }

  // Filtrar pagamentos válidos
  const validPayments = monthlyPayments.filter(payment => payment > 0);
  if (validPayments.length === 0) {
    return { cetMonthly: 0, cetAnnual: 0 };
  }

  // Fluxo de caixa: entrada positiva (crédito) no período 0, saídas negativas (parcelas)
  const cashFlows: number[] = [creditValue];
  
  // Adicionar todas as parcelas como saídas negativas
  validPayments.forEach(payment => {
    cashFlows.push(-payment);
  });
  
  try {
    const cetMonthly = calculateIRR(cashFlows, 0.02, 1500); // Chute inicial melhor e mais iterações
    
    // Conversão para taxa anual com juros compostos
    const cetAnnual = Math.pow(1 + cetMonthly, 12) - 1;
    
    return {
      cetMonthly: Math.max(0, Math.min(cetMonthly * 100, 50)), // Entre 0% e 50% ao mês
      cetAnnual: Math.max(0, Math.min(cetAnnual * 100, 600))   // Entre 0% e 600% ao ano
    };
  } catch (error) {
    console.error('Erro no cálculo do CET:', error);
    
    // Fallback robusto: método de taxa efetiva simples
    const totalPaid = validPayments.reduce((sum, payment) => sum + payment, 0);
    const periods = validPayments.length;
    
    if (periods > 0 && creditValue > 0 && totalPaid > creditValue) {
      // Taxa efetiva simples
      const totalCost = totalPaid / creditValue;
      const monthlyEffectiveRate = Math.pow(totalCost, 1/periods) - 1;
      const annualEffectiveRate = Math.pow(1 + monthlyEffectiveRate, 12) - 1;
      
      return {
        cetMonthly: Math.max(0, Math.min(monthlyEffectiveRate * 100, 50)),
        cetAnnual: Math.max(0, Math.min(annualEffectiveRate * 100, 600))
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

// Função padronizada para formatação de percentuais
export const formatPercentage = (value: number, decimals: number = 2): string => {
  if (isNaN(value) || !isFinite(value)) return '0,00%';
  return value.toLocaleString('pt-BR', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  }) + '%';
};
