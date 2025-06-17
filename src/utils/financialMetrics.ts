
// Métricas financeiras corrigidas - Versão 2.0

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

// CET corrigido para evitar notação científica e valores zerados
export const calculateCET = (availableCredit: number, postContemplationPayment: number, finalTerm: number): { cetMonthly: number; cetAnnual: number } => {
  try {
    console.log('🔍 Calculando CET:', { availableCredit, postContemplationPayment, finalTerm });
    
    // Validação rigorosa de entrada
    if (availableCredit <= 0 || postContemplationPayment <= 0 || finalTerm <= 0) {
      console.warn('⚠️ Valores inválidos para CET:', { availableCredit, postContemplationPayment, finalTerm });
      return { cetMonthly: 0, cetAnnual: 0 };
    }
    
    // Método simplificado e mais confiável
    // CET Mensal = (Parcela / Crédito)^(1/Prazo) - 1
    const ratio = postContemplationPayment / availableCredit;
    const cetMonthly = Math.pow(ratio, 1 / finalTerm) - 1;
    
    // CET Anual = (1 + CET Mensal)^12 - 1
    const cetAnnual = Math.pow(1 + cetMonthly, 12) - 1;
    
    // Verificar se os valores são válidos
    if (isNaN(cetMonthly) || !isFinite(cetMonthly) || cetMonthly < 0) {
      console.error('❌ CET mensal inválido:', cetMonthly);
      return { cetMonthly: 0, cetAnnual: 0 };
    }
    
    if (isNaN(cetAnnual) || !isFinite(cetAnnual) || cetAnnual < 0) {
      console.error('❌ CET anual inválido:', cetAnnual);
      return { cetMonthly: cetMonthly * 100, cetAnnual: 0 };
    }
    
    const result = {
      cetMonthly: Number((cetMonthly * 100).toFixed(4)), // Converter para % com 4 casas decimais
      cetAnnual: Number((cetAnnual * 100).toFixed(4))    // Converter para % com 4 casas decimais
    };
    
    console.log('✅ CET calculado com sucesso:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Erro no cálculo do CET:', error);
    return { cetMonthly: 0, cetAnnual: 0 };
  }
};

export const calculateDemonstrativeRate = (adminRate: number, reserveFundRate: number, totalInstallments: number): { monthlyRate: number; annualRate: number } => {
  const monthlyRate = (adminRate + reserveFundRate) / totalInstallments;
  const annualRate = monthlyRate * 12;
  
  return {
    monthlyRate: Number(monthlyRate.toFixed(4)),
    annualRate: Number(annualRate.toFixed(4))
  };
};

// Função para calcular rentabilidade de investimento
export const calculateInvestmentYield = (
  initialValue: number, 
  monthlyRate: number, 
  periods: number
): { finalValue: number; totalReturn: number; monthlyGain: number; annualGain: number } => {
  const finalValue = initialValue * Math.pow(1 + (monthlyRate / 100), periods);
  const totalReturn = finalValue - initialValue;
  const monthlyGain = totalReturn / periods;
  const annualGain = monthlyGain * 12;
  
  return {
    finalValue: Number(finalValue.toFixed(2)),
    totalReturn: Number(totalReturn.toFixed(2)),
    monthlyGain: Number(monthlyGain.toFixed(2)),
    annualGain: Number(annualGain.toFixed(2))
  };
};

// Função para calcular economia em comparação com financiamento
export const calculateFinancingSavings = (
  creditValue: number,
  consortiumTotalCost: number,
  financingRate: number,
  periods: number
): { financingCost: number; savings: number; savingsPercentage: number } => {
  const financingCost = creditValue * (1 + (financingRate / 100) * (periods / 12));
  const savings = financingCost - consortiumTotalCost;
  const savingsPercentage = (savings / financingCost) * 100;
  
  return {
    financingCost: Number(financingCost.toFixed(2)),
    savings: Number(savings.toFixed(2)),
    savingsPercentage: Number(savingsPercentage.toFixed(2))
  };
};
