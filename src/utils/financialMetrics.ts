
// Métricas financeiras estabilizadas - Versão 2.0 FINAL

// CET ESTABILIZADO - removido TIR complexa
export const calculateCET = (availableCredit: number, postContemplationPayment: number, finalTerm: number): { cetMonthly: number; cetAnnual: number } => {
  try {
    console.log('🔍 Calculando CET (ESTABILIZADO):', { availableCredit, postContemplationPayment, finalTerm });
    
    if (availableCredit <= 0 || postContemplationPayment <= 0 || finalTerm <= 0) {
      console.warn('⚠️ Valores inválidos para CET');
      return { cetMonthly: 0, cetAnnual: 0 };
    }
    
    // Método Price simplificado e confiável
    const ratio = postContemplationPayment / availableCredit;
    
    if (ratio <= 0 || !isFinite(ratio)) {
      console.warn('⚠️ Ratio inválido para CET');
      return { cetMonthly: 0, cetAnnual: 0 };
    }
    
    const cetMonthly = Math.pow(ratio, 1 / finalTerm) - 1;
    const cetAnnual = Math.pow(1 + cetMonthly, 12) - 1;
    
    // Validações rigorosas
    if (!isFinite(cetMonthly) || !isFinite(cetAnnual) || cetMonthly < 0 || cetAnnual < 0) {
      console.error('❌ CET calculado é inválido');
      return { cetMonthly: 0, cetAnnual: 0 };
    }
    
    const result = {
      cetMonthly: Number((cetMonthly * 100).toFixed(4)),
      cetAnnual: Number((cetAnnual * 100).toFixed(4))
    };
    
    console.log('✅ CET calculado (ESTABILIZADO):', result);
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

export const calculateFinancingSavings = (
  creditValue: number,
  consortiumTotalCost: number,
  financingRate: number,
  periods: number
): { financingCost: number; savings: number; savingsPercentage: number } => {
  const financingCost = creditValue * (1 + (financingRate / 100) * (periods / 12));
  const savings = financingCost - consortiumTotalCost;
  const savingsPercentage = financingCost > 0 ? (savings / financingCost) * 100 : 0;
  
  return {
    financingCost: Number(financingCost.toFixed(2)),
    savings: Number(savings.toFixed(2)),
    savingsPercentage: Number(savingsPercentage.toFixed(2))
  };
};

// TIR REMOVIDA - era fonte de bugs, substituída por método Price no CET
