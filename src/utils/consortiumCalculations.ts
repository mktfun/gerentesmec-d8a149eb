
// Funções de cálculo para consórcio - Versão 2.0
// Baseado na documentação do Flash Sim e correções do imovel.pdf

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
      agioGrossValue: number; // Novo campo
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
      monthlyGain?: number;
      annualGain?: number;
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
      monthlyGain?: number;
      annualGain?: number;
    };
  };
}

// Função principal de cálculo
export const calculateConsortium = (inputs: ConsortiumInputs): ConsortiumResults => {
  console.log('🧮 Iniciando cálculo do consórcio com inputs:', inputs);
  
  // 1. Cálculo dos componentes da parcela
  const commonFund = inputs.creditValue / inputs.installments;
  const adminFee = (inputs.creditValue * (inputs.adminRate / 100)) / inputs.installments;
  const reserveFund = (inputs.creditValue * (inputs.reserveFundRate / 100)) / inputs.installments;
  
  // Taxa antecipada (aplicada apenas nas primeiras 12 parcelas)
  const anticipatedTaxValue = inputs.anticipatedTaxRate 
    ? (inputs.creditValue * (inputs.anticipatedTaxRate / 100)) / 12
    : 0;
  
  // Parcela base (sem taxa antecipada)
  const baseMonthlyPayment = commonFund + adminFee + reserveFund + (inputs.lifeInsurance || 0);
  
  // Parcela com taxa antecipada (primeiras 12 parcelas)
  const monthlyPaymentWithAnticipatedTax = baseMonthlyPayment + anticipatedTaxValue;
  
  // Se há parcela reduzida, aplicar apenas ao fundo comum
  const reducedCommonFund = inputs.reducedPaymentPercentage 
    ? commonFund * (inputs.reducedPaymentPercentage / 100)
    : commonFund;
  
  const monthlyPayment = inputs.reducedPaymentPercentage
    ? reducedCommonFund + adminFee + reserveFund + (inputs.lifeInsurance || 0)
    : baseMonthlyPayment;

  console.log('💰 Componentes da parcela:', {
    commonFund,
    adminFee,
    reserveFund,
    anticipatedTaxValue,
    baseMonthlyPayment,
    monthlyPaymentWithAnticipatedTax,
    monthlyPayment
  });

  // 2. Cálculo dos lances
  const embeddedBidValue = inputs.embeddedBidPercentage 
    ? inputs.creditValue * (inputs.embeddedBidPercentage / 100)
    : 0;
  
  const ownResourcesBidValue = inputs.ownResourcesBid || 0;
  const bidValue = embeddedBidValue + ownResourcesBidValue;
  const availableCredit = inputs.creditValue - embeddedBidValue;

  console.log('🎯 Lances calculados:', {
    embeddedBidValue,
    ownResourcesBidValue,
    bidValue,
    availableCredit
  });

  // 3. Cálculo do total investido (até a contemplação)
  const regularMonths = Math.max(0, inputs.contemplationTime - 12);
  const anticipatedMonths = Math.min(12, inputs.contemplationTime);
  
  const totalInvested = (regularMonths * monthlyPayment) + 
                       (anticipatedMonths * (monthlyPayment + anticipatedTaxValue)) +
                       ownResourcesBidValue;

  // 4. Cálculo da parcela pós-contemplação
  const remainingMonths = inputs.installments - inputs.contemplationTime;
  const outstandingBalance = inputs.creditValue - (inputs.contemplationTime * commonFund);
  const adjustedBalance = outstandingBalance - bidValue;
  const postContemplationPayment = adjustedBalance / remainingMonths;

  console.log('📊 Cálculos pós-contemplação:', {
    remainingMonths,
    outstandingBalance,
    adjustedBalance,
    postContemplationPayment
  });

  // 5. Taxa demonstrativa
  const demonstrativeRate = {
    monthlyRate: (inputs.adminRate + inputs.reserveFundRate) / inputs.installments,
    annualRate: ((inputs.adminRate + inputs.reserveFundRate) / inputs.installments) * 12
  };

  // 6. CET corrigido
  const cet = calculateCETCorrect(availableCredit, postContemplationPayment, remainingMonths);

  // 7. Cenários
  const scenarios = calculateScenarios(inputs, {
    availableCredit,
    totalInvested,
    remainingMonths,
    postContemplationPayment
  });

  const results: ConsortiumResults = {
    monthlyPayment,
    monthlyPaymentWithAnticipatedTax: anticipatedTaxValue > 0 ? monthlyPaymentWithAnticipatedTax : undefined,
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

  console.log('✅ Resultados finais:', results);
  return results;
};

// Função corrigida para calcular o CET
const calculateCETCorrect = (availableCredit: number, postContemplationPayment: number, finalTerm: number) => {
  try {
    if (availableCredit <= 0 || postContemplationPayment <= 0 || finalTerm <= 0) {
      return { cetMonthly: 0, cetAnnual: 0 };
    }

    // Usar uma aproximação mais simples e confiável
    // CET = [(Parcela * Prazo / Crédito) - 1] / Prazo
    const totalPayments = postContemplationPayment * finalTerm;
    const cetMonthly = Math.pow(totalPayments / availableCredit, 1 / finalTerm) - 1;
    const cetAnnual = Math.pow(1 + cetMonthly, 12) - 1;

    console.log('📈 CET calculado:', {
      availableCredit,
      postContemplationPayment,
      finalTerm,
      totalPayments,
      cetMonthly: cetMonthly * 100,
      cetAnnual: cetAnnual * 100
    });

    return {
      cetMonthly: cetMonthly * 100,
      cetAnnual: cetAnnual * 100
    };
  } catch (error) {
    console.error('❌ Erro no cálculo do CET:', error);
    return { cetMonthly: 0, cetAnnual: 0 };
  }
};

// Função para calcular os cenários
const calculateScenarios = (
  inputs: ConsortiumInputs, 
  context: { availableCredit: number; totalInvested: number; remainingMonths: number; postContemplationPayment: number }
) => {
  // CENÁRIO 1: Venda da Cota (NOVA LÓGICA)
  const agioPercentage = inputs.agioPercentage || 15; // Default 15%
  const agioGrossValue = inputs.creditValue * (agioPercentage / 100); // Valor Bruto do Ágio
  const quotaSaleProfit = agioGrossValue - context.totalInvested; // Lucro Líquido = Ágio - Total Investido
  const quotaSaleProfitPercentage = (quotaSaleProfit / context.totalInvested) * 100;

  console.log('🏷️ Cenário 1 - Nova Lógica:', {
    creditValue: inputs.creditValue,
    agioPercentage,
    agioGrossValue,
    totalInvested: context.totalInvested,
    quotaSaleProfit,
    quotaSaleProfitPercentage
  });

  // CENÁRIO 2: Aquisição do Bem
  let propertyAcquisition = undefined;
  let financingComparison = undefined;

  if (inputs.creditType === 'property') {
    const correctedPropertyValue = context.availableCredit * 1.05; // Correção INCC simulada
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
    const savingsPercentage = (savings / financingTotalCost) * 100;

    financingComparison = {
      title: 'Comparativo com Financiamento',
      consortiumTotalCost,
      financingTotalCost,
      savings,
      savingsPercentage
    };
  }

  // CENÁRIO 3: Aplicação do Crédito
  const returnRate = inputs.returnRate || 1.2; // 1.2% a.m. default
  const monthlyRate = inputs.returnPeriod === 'annual' ? returnRate / 12 : returnRate;
  const finalValue = context.availableCredit * Math.pow(1 + (monthlyRate / 100), context.remainingMonths);
  const investmentReturn = finalValue - context.availableCredit;
  const totalProfit = investmentReturn - (context.postContemplationPayment * context.remainingMonths);
  const monthlyGain = totalProfit / context.remainingMonths;
  const annualGain = monthlyGain * 12;

  return {
    quotaSale: {
      title: 'Venda da Cota',
      agioGrossValue, // Novo campo
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

// Função para aplicar correção monetária
export const applyCurrencyCorrection = (value: number, months: number, index: 'INCC' | 'IPCA'): number => {
  const monthlyRate = index === 'INCC' ? 0.005 : 0.004; // 0.5% INCC, 0.4% IPCA
  return value * Math.pow(1 + monthlyRate, months);
};

// Função para calcular juros compostos
export const calculateCompoundInterest = (principal: number, rate: number, periods: number): number => {
  return principal * Math.pow(1 + (rate / 100), periods);
};

// Função para validar inputs
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
