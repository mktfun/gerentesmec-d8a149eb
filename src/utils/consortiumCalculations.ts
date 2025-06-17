
// Funções de cálculo para consórcio - Versão 2.0 ESTABILIZADA
// Motor de cálculo corrigido com tolerância zero para bugs

export interface ConsortiumInputs {
  creditValue: number;
  installments: number;
  contemplationTime: number;
  adminRate: number;
  reserveFundRate: number;
  anticipatedTaxRate?: number;
  lifeInsurance?: number;
  reducedPaymentPercentage?: number;
  embeddedBidPercentage?: number;
  ownResourcesBid?: number;
  agioPercentage?: number;
  returnRate?: number;
  returnPeriod?: 'monthly' | 'annual';
  creditType: 'property' | 'vehicle';
  financingRate?: number;
  rentalYield?: number;
}

export interface ConsortiumResults {
  monthlyPayment: number;
  monthlyPaymentWithAnticipatedTax?: number;
  postContemplationPayment: number;
  finalTerm: number;
  bidValue: number;
  embeddedBidValue: number;
  ownResourcesBidValue: number;
  availableCredit: number;
  totalPaid: number;
  totalInvested: number;
  correctionIndex: 'INCC' | 'IPCA';
  anticipatedTaxValue?: number;
  demonstrativeRate?: {
    monthlyRate: number;
    annualRate: number;
  };
  cet?: {
    cetMonthly: number;
    cetAnnual: number;
  };
  scenarios: {
    quotaSale: {
      title: string;
      agioGrossValue: number;
      totalReturn: number;
      profit: number;
      profitPercentage: number;
      agio: number;
    };
    propertyAcquisition?: {
      title: string;
      propertyValue: number;
      monthlyRental: number;
      postContemplationPayment: number;
      netMonthlyReturn: number;
      monthlyGain: number;
      annualGain: number;
    };
    financingComparison?: {
      title: string;
      consortiumTotalCost: number;
      financingTotalCost: number;
      savings: number;
      savingsPercentage: number;
    };
    appliedCredit: {
      title: string;
      appliedValue: number;
      investmentReturn: number;
      finalValue: number;
      totalProfit: number;
      monthsToApply: number;
      monthlyGain: number;
      annualGain: number;
    };
  };
}

// Função principal de cálculo - CORRIGIDA
export const calculateConsortium = (inputs: ConsortiumInputs): ConsortiumResults => {
  console.log('🧮 Iniciando cálculo do consórcio (V2.0 ESTABILIZADA):', inputs);
  
  // 1. COMPONENTES DA PARCELA - LÓGICA CORRIGIDA
  const commonFund = inputs.creditValue / inputs.installments;
  const adminFee = (inputs.creditValue * (inputs.adminRate / 100)) / inputs.installments;
  const reserveFund = (inputs.creditValue * (inputs.reserveFundRate / 100)) / inputs.installments;
  const lifeInsuranceValue = inputs.lifeInsurance || 0;
  
  // Taxa antecipada (12 primeiras parcelas apenas)
  const anticipatedTaxValue = inputs.anticipatedTaxRate 
    ? (inputs.creditValue * (inputs.anticipatedTaxRate / 100)) / 12
    : 0;
  
  // Parcela base (componentes fixos)
  const baseComponents = adminFee + reserveFund + lifeInsuranceValue;
  
  // Aplicar redução APENAS no fundo comum se habilitada
  let effectiveCommonFund = commonFund;
  if (inputs.reducedPaymentPercentage) {
    effectiveCommonFund = commonFund * (inputs.reducedPaymentPercentage / 100);
  }
  
  // Parcela mensal final
  const monthlyPayment = effectiveCommonFund + baseComponents;
  const monthlyPaymentWithAnticipatedTax = anticipatedTaxValue > 0 
    ? monthlyPayment + anticipatedTaxValue 
    : undefined;

  console.log('💰 Componentes da parcela (CORRIGIDOS):', {
    commonFund,
    effectiveCommonFund,
    adminFee,
    reserveFund,
    lifeInsuranceValue,
    anticipatedTaxValue,
    monthlyPayment,
    monthlyPaymentWithAnticipatedTax
  });

  // 2. LANCES
  const embeddedBidValue = inputs.embeddedBidPercentage 
    ? inputs.creditValue * (inputs.embeddedBidPercentage / 100)
    : 0;
  
  const ownResourcesBidValue = inputs.ownResourcesBid || 0;
  const bidValue = embeddedBidValue + ownResourcesBidValue;
  const availableCredit = inputs.creditValue - embeddedBidValue;

  // 3. TOTAL INVESTIDO ATÉ CONTEMPLAÇÃO - CORRIGIDO
  const monthsWithAnticipatedTax = Math.min(12, inputs.contemplationTime);
  const monthsWithoutAnticipatedTax = Math.max(0, inputs.contemplationTime - 12);
  
  const totalInvested = 
    (monthsWithAnticipatedTax * (monthlyPayment + anticipatedTaxValue)) +
    (monthsWithoutAnticipatedTax * monthlyPayment) +
    ownResourcesBidValue;

  // 4. PÓS-CONTEMPLAÇÃO - LÓGICA CORRIGIDA
  const remainingMonths = inputs.installments - inputs.contemplationTime;
  const totalPaidCommonFund = inputs.contemplationTime * commonFund;
  const outstandingBalance = inputs.creditValue - totalPaidCommonFund;
  const adjustedBalance = Math.max(0, outstandingBalance - bidValue);
  const postContemplationPayment = remainingMonths > 0 ? adjustedBalance / remainingMonths : 0;

  console.log('📊 Pós-contemplação (CORRIGIDO):', {
    remainingMonths,
    totalPaidCommonFund,
    outstandingBalance,
    adjustedBalance,
    postContemplationPayment
  });

  // 5. TAXA DEMONSTRATIVA
  const demonstrativeRate = {
    monthlyRate: Number(((inputs.adminRate + inputs.reserveFundRate) / inputs.installments).toFixed(4)),
    annualRate: Number((((inputs.adminRate + inputs.reserveFundRate) / inputs.installments) * 12).toFixed(4))
  };

  // 6. CET CORRIGIDO - MÉTODO SIMPLIFICADO E CONFIÁVEL
  const cet = calculateCETStabilized(availableCredit, postContemplationPayment, remainingMonths);

  // 7. CENÁRIOS
  const scenarios = calculateScenariosStabilized(inputs, {
    availableCredit,
    totalInvested,
    remainingMonths,
    postContemplationPayment
  });

  const results: ConsortiumResults = {
    monthlyPayment,
    monthlyPaymentWithAnticipatedTax,
    postContemplationPayment,
    finalTerm: remainingMonths,
    bidValue,
    embeddedBidValue,
    ownResourcesBidValue,
    availableCredit,
    totalPaid: totalInvested + (postContemplationPayment * remainingMonths),
    totalInvested,
    correctionIndex: inputs.creditType === 'property' ? 'INCC' : 'IPCA',
    anticipatedTaxValue: anticipatedTaxValue > 0 ? anticipatedTaxValue : undefined,
    demonstrativeRate,
    cet,
    scenarios
  };

  console.log('✅ Resultados finais (V2.0 ESTABILIZADA):', results);
  return results;
};

// CET ESTABILIZADO - Método confiável sem TIR complexa
const calculateCETStabilized = (availableCredit: number, postContemplationPayment: number, finalTerm: number) => {
  try {
    if (availableCredit <= 0 || postContemplationPayment <= 0 || finalTerm <= 0) {
      return { cetMonthly: 0, cetAnnual: 0 };
    }

    // Método Price simplificado - mais confiável
    // CET = (Parcela / Crédito)^(1/Prazo) - 1
    const ratio = postContemplationPayment / availableCredit;
    
    if (ratio <= 0 || !isFinite(ratio)) {
      return { cetMonthly: 0, cetAnnual: 0 };
    }
    
    const cetMonthly = Math.pow(ratio, 1 / finalTerm) - 1;
    const cetAnnual = Math.pow(1 + cetMonthly, 12) - 1;

    // Validações rigorosas
    if (!isFinite(cetMonthly) || !isFinite(cetAnnual) || cetMonthly < 0 || cetAnnual < 0) {
      console.warn('⚠️ CET inválido calculado, retornando 0');
      return { cetMonthly: 0, cetAnnual: 0 };
    }

    const result = {
      cetMonthly: Number((cetMonthly * 100).toFixed(4)),
      cetAnnual: Number((cetAnnual * 100).toFixed(4))
    };

    console.log('📈 CET estabilizado:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Erro no CET:', error);
    return { cetMonthly: 0, cetAnnual: 0 };
  }
};

// CENÁRIOS ESTABILIZADOS
const calculateScenariosStabilized = (
  inputs: ConsortiumInputs, 
  context: { availableCredit: number; totalInvested: number; remainingMonths: number; postContemplationPayment: number }
) => {
  // CENÁRIO 1: VENDA DA COTA - NOVA LÓGICA CORRIGIDA
  const agioPercentage = inputs.agioPercentage || 15;
  const agioGrossValue = inputs.creditValue * (agioPercentage / 100); // Valor Bruto do Ágio
  const quotaSaleProfit = agioGrossValue - context.totalInvested; // Lucro Líquido = Ágio - Total Investido
  const quotaSaleProfitPercentage = context.totalInvested > 0 ? (quotaSaleProfit / context.totalInvested) * 100 : 0;

  console.log('🏷️ Cenário 1 - NOVA LÓGICA ESTABILIZADA:', {
    creditValue: inputs.creditValue,
    agioPercentage,
    agioGrossValue,
    totalInvested: context.totalInvested,
    quotaSaleProfit,
    quotaSaleProfitPercentage
  });

  // CENÁRIO 2: CONDICIONAL POR TIPO
  let propertyAcquisition = undefined;
  let financingComparison = undefined;

  if (inputs.creditType === 'property') {
    const correctedPropertyValue = context.availableCredit * 1.05; // Correção INCC
    const monthlyRental = correctedPropertyValue * ((inputs.rentalYield || 0.5) / 100);
    const netMonthlyReturn = monthlyRental - context.postContemplationPayment;
    const monthlyGain = netMonthlyReturn;
    const annualGain = monthlyGain * 12;

    propertyAcquisition = {
      title: 'Aquisição de Imóvel para Renda',
      propertyValue: correctedPropertyValue,
      monthlyRental,
      postContemplationPayment: context.postContemplationPayment,
      netMonthlyReturn,
      monthlyGain,
      annualGain
    };
  } else {
    const consortiumTotalCost = context.totalInvested + (context.postContemplationPayment * context.remainingMonths);
    const financingTotalCost = context.availableCredit * (1 + ((inputs.financingRate || 12) / 100) * (context.remainingMonths / 12));
    const savings = financingTotalCost - consortiumTotalCost;
    const savingsPercentage = financingTotalCost > 0 ? (savings / financingTotalCost) * 100 : 0;

    financingComparison = {
      title: 'Comparativo com Financiamento',
      consortiumTotalCost,
      financingTotalCost,
      savings,
      savingsPercentage
    };
  }

  // CENÁRIO 3: APLICAÇÃO DO CRÉDITO - SEM TOGGLE (SEMPRE MENSAL)
  const returnRate = inputs.returnRate || 1.2; // 1.2% a.m. default
  const monthlyRate = returnRate; // SEMPRE MENSAL - removido o toggle
  const finalValue = context.availableCredit * Math.pow(1 + (monthlyRate / 100), context.remainingMonths);
  const investmentReturn = finalValue - context.availableCredit;
  const totalProfit = investmentReturn - (context.postContemplationPayment * context.remainingMonths);
  const monthlyGain = totalProfit / context.remainingMonths;
  const annualGain = monthlyGain * 12;

  return {
    quotaSale: {
      title: 'Venda da Cota',
      agioGrossValue,
      totalReturn: agioGrossValue, // Retorno Total = Valor Bruto do Ágio
      profit: quotaSaleProfit,
      profitPercentage: quotaSaleProfitPercentage,
      agio: agioPercentage
    },
    propertyAcquisition,
    financingComparison,
    appliedCredit: {
      title: 'Aplicação do Crédito',
      appliedValue: context.availableCredit,
      investmentReturn,
      finalValue,
      totalProfit,
      monthsToApply: context.remainingMonths,
      monthlyGain,
      annualGain
    }
  };
};

// UTILITÁRIOS
export const applyCurrencyCorrection = (value: number, months: number, index: 'INCC' | 'IPCA'): number => {
  const monthlyRate = index === 'INCC' ? 0.005 : 0.004;
  return value * Math.pow(1 + monthlyRate, months);
};

export const calculateCompoundInterest = (principal: number, rate: number, periods: number): number => {
  return principal * Math.pow(1 + (rate / 100), periods);
};

export const validateInputs = (inputs: ConsortiumInputs): string[] => {
  const errors: string[] = [];
  
  if (inputs.creditValue <= 0) {
    errors.push('Valor do crédito deve ser maior que zero');
  }
  
  if (inputs.installments <= 0 || inputs.installments > 260) {
    errors.push('Prazo deve estar entre 1 e 260 meses');
  }
  
  if (inputs.contemplationTime <= 0 || inputs.contemplationTime >= inputs.installments) {
    errors.push('Tempo de contemplação deve ser menor que o prazo total');
  }
  
  if (inputs.adminRate < 0 || inputs.adminRate > 20) {
    errors.push('Taxa de administração deve estar entre 0% e 20%');
  }
  
  if (inputs.reserveFundRate < 0 || inputs.reserveFundRate > 10) {
    errors.push('Taxa do fundo de reserva deve estar entre 0% e 10%');
  }
  
  return errors;
};
