/**
 * Fundamental Analysis Module
 * 
 * Analyzes financial health and quality metrics.
 * Returns a 0-100 score with detailed factor breakdown.
 */

import { 
  FinancialStatements, 
  FundamentalMetrics, 
  FundamentalScore 
} from '@/types';
import { FUNDAMENTAL_WEIGHTS, SCORE_THRESHOLDS } from '../utils/constants';

// ============================================
// METRIC CALCULATIONS
// ============================================

/**
 * Calculate Return on Invested Capital (ROIC)
 * 
 * ROIC = NOPAT / Invested Capital
 * NOPAT = Operating Income * (1 - Tax Rate)
 * Invested Capital = Total Equity + Total Debt - Cash
 */
export function calculateROIC(
  operatingIncome: number,
  taxRate: number,
  totalEquity: number,
  totalDebt: number,
  cash: number
): number {
  const nopat = operatingIncome * (1 - taxRate);
  const investedCapital = totalEquity + totalDebt - cash;
  
  if (investedCapital <= 0) return 0;
  return nopat / investedCapital;
}

/**
 * Calculate Compound Annual Growth Rate (CAGR)
 */
export function calculateCAGR(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

/**
 * Calculate standard deviation as measure of stability
 */
export function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  
  return Math.sqrt(avgSquareDiff);
}

/**
 * Calculate growth rate coefficient of variation
 * Lower = more consistent growth
 */
export function calculateGrowthConsistency(values: number[]): number {
  if (values.length < 3) return 0;
  
  // Calculate year-over-year growth rates
  const growthRates: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] > 0) {
      growthRates.push((values[i] - values[i - 1]) / values[i - 1]);
    }
  }
  
  if (growthRates.length === 0) return 0;
  
  const mean = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
  const stdDev = calculateStdDev(growthRates);
  
  if (mean === 0) return 0;
  
  // Lower CV = more consistent
  const cv = Math.abs(stdDev / mean);
  
  // Convert to a 0-100 score (lower CV = higher score)
  return Math.max(0, 100 - cv * 100);
}

// ============================================
// METRICS EXTRACTION
// ============================================

/**
 * Extract fundamental metrics from financial statements
 */
export function extractFundamentalMetrics(
  financials: FinancialStatements
): FundamentalMetrics {
  const { income, balance, cashFlow } = financials;
  
  // Need at least 2 years for meaningful analysis
  if (income.length < 2 || balance.length < 2 || cashFlow.length < 2) {
    return {
      roic: 0,
      roicTrend: 0,
      revenueGrowth5Y: 0,
      revenueGrowthStability: 0,
      fcfGrowth5Y: 0,
      fcfConsistency: 0,
      debtToFCF: 0,
      operatingLeverage: 0,
      netMargin: 0,
      grossMargin: 0,
      shareDilution5Y: 0,
    };
  }

  // Sort by date descending (most recent first)
  const sortedIncome = [...income].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const sortedBalance = [...balance].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const sortedCashFlow = [...cashFlow].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Most recent values
  const latestIncome = sortedIncome[0];
  const latestBalance = sortedBalance[0];
  const latestCashFlow = sortedCashFlow[0];

  // Assume 25% effective tax rate if not available
  const taxRate = 0.25;

  // ROIC
  const roic = calculateROIC(
    latestIncome.operatingIncome,
    taxRate,
    latestBalance.totalEquity,
    latestBalance.totalDebt,
    latestBalance.cash
  );

  // ROIC trend (compare current to 3 years ago)
  let roicTrend = 0;
  if (sortedIncome.length >= 3 && sortedBalance.length >= 3) {
    const oldROIC = calculateROIC(
      sortedIncome[2].operatingIncome,
      taxRate,
      sortedBalance[2].totalEquity,
      sortedBalance[2].totalDebt,
      sortedBalance[2].cash
    );
    roicTrend = roic - oldROIC;
  }

  // Revenue growth (5 year CAGR)
  const revenues = sortedIncome.slice(0, 5).reverse().map(i => i.revenue);
  const revenueGrowth5Y = revenues.length >= 2 
    ? calculateCAGR(revenues[0], revenues[revenues.length - 1], revenues.length - 1)
    : 0;

  // Revenue stability
  const revenueGrowthStability = calculateGrowthConsistency(revenues);

  // FCF growth (5 year CAGR)
  const fcfs = sortedCashFlow.slice(0, 5).reverse().map(c => c.freeCashFlow);
  const fcfGrowth5Y = fcfs.length >= 2 && fcfs[0] > 0
    ? calculateCAGR(fcfs[0], fcfs[fcfs.length - 1], fcfs.length - 1)
    : 0;

  // FCF consistency
  const fcfConsistency = calculateGrowthConsistency(fcfs.filter(f => f > 0));

  // Debt to FCF
  const avgFCF = fcfs.reduce((a, b) => a + b, 0) / fcfs.length;
  const debtToFCF = avgFCF > 0 ? latestBalance.totalDebt / avgFCF : 99;

  // Operating leverage (change in operating income / change in revenue)
  let operatingLeverage = 1;
  if (sortedIncome.length >= 2) {
    const revChange = latestIncome.revenue - sortedIncome[1].revenue;
    const opIncChange = latestIncome.operatingIncome - sortedIncome[1].operatingIncome;
    if (revChange !== 0) {
      operatingLeverage = opIncChange / revChange;
    }
  }

  // Margins
  const netMargin = latestIncome.netIncomeMargin || 0;
  const grossMargin = latestIncome.grossProfitMargin || 0;

  // Share dilution
  const shares = sortedIncome.slice(0, 5).map(i => i.sharesOutstanding);
  const shareDilution5Y = shares.length >= 2 && shares[shares.length - 1] > 0
    ? (shares[0] - shares[shares.length - 1]) / shares[shares.length - 1]
    : 0;

  return {
    roic,
    roicTrend,
    revenueGrowth5Y,
    revenueGrowthStability,
    fcfGrowth5Y,
    fcfConsistency,
    debtToFCF,
    operatingLeverage,
    netMargin,
    grossMargin,
    shareDilution5Y,
  };
}

// ============================================
// SCORING FUNCTIONS
// ============================================

/**
 * Score ROIC (0-100)
 * > 20% = excellent, 15-20% = good, 10-15% = fair, < 10% = poor
 */
function scoreROIC(roic: number): { score: number; assessment: string } {
  if (roic >= 0.25) return { score: 100, assessment: 'Exceptional ROIC' };
  if (roic >= 0.20) return { score: 85, assessment: 'Excellent ROIC' };
  if (roic >= 0.15) return { score: 70, assessment: 'Good ROIC' };
  if (roic >= 0.10) return { score: 50, assessment: 'Fair ROIC' };
  if (roic >= 0.05) return { score: 30, assessment: 'Below average ROIC' };
  return { score: 10, assessment: 'Poor ROIC' };
}

/**
 * Score Revenue Growth (0-100)
 */
function scoreRevenueGrowth(growth: number): { score: number; assessment: string } {
  if (growth >= 0.25) return { score: 100, assessment: 'Exceptional growth' };
  if (growth >= 0.15) return { score: 85, assessment: 'Strong growth' };
  if (growth >= 0.10) return { score: 70, assessment: 'Good growth' };
  if (growth >= 0.05) return { score: 50, assessment: 'Moderate growth' };
  if (growth >= 0) return { score: 30, assessment: 'Slow growth' };
  return { score: 10, assessment: 'Declining revenue' };
}

/**
 * Score Debt Management (0-100)
 * Debt/FCF < 2 = excellent, 2-4 = good, 4-6 = fair, > 6 = concerning
 */
function scoreDebtManagement(debtToFCF: number): { score: number; assessment: string } {
  if (debtToFCF <= 1) return { score: 100, assessment: 'Minimal debt' };
  if (debtToFCF <= 2) return { score: 85, assessment: 'Low debt' };
  if (debtToFCF <= 4) return { score: 65, assessment: 'Moderate debt' };
  if (debtToFCF <= 6) return { score: 40, assessment: 'High debt' };
  return { score: 15, assessment: 'Very high debt' };
}

/**
 * Score Shareholder Dilution (0-100)
 * Negative = buybacks (good), positive = dilution (bad)
 */
function scoreDilution(dilution: number): { score: number; assessment: string } {
  if (dilution <= -0.05) return { score: 100, assessment: 'Significant buybacks' };
  if (dilution <= 0) return { score: 80, assessment: 'Share buybacks' };
  if (dilution <= 0.02) return { score: 60, assessment: 'Minimal dilution' };
  if (dilution <= 0.05) return { score: 40, assessment: 'Moderate dilution' };
  return { score: 20, assessment: 'High dilution' };
}

// ============================================
// MAIN SCORING FUNCTION
// ============================================

/**
 * Calculate comprehensive fundamental score
 */
export function calculateFundamentalScore(
  financials: FinancialStatements
): FundamentalScore {
  const metrics = extractFundamentalMetrics(financials);
  
  const factors: FundamentalScore['factors'] = [];
  
  // Score each factor
  const roicResult = scoreROIC(metrics.roic);
  factors.push({
    name: 'Return on Invested Capital',
    value: metrics.roic,
    score: roicResult.score,
    weight: FUNDAMENTAL_WEIGHTS.roic,
    assessment: roicResult.assessment,
  });

  const revenueResult = scoreRevenueGrowth(metrics.revenueGrowth5Y);
  factors.push({
    name: 'Revenue Growth (5Y)',
    value: metrics.revenueGrowth5Y,
    score: revenueResult.score,
    weight: FUNDAMENTAL_WEIGHTS.revenueGrowth,
    assessment: revenueResult.assessment,
  });

  factors.push({
    name: 'Revenue Stability',
    value: metrics.revenueGrowthStability,
    score: metrics.revenueGrowthStability,
    weight: FUNDAMENTAL_WEIGHTS.revenueStability,
    assessment: metrics.revenueGrowthStability >= 70 ? 'Consistent' : 'Variable',
  });

  const fcfResult = scoreRevenueGrowth(metrics.fcfGrowth5Y);
  factors.push({
    name: 'FCF Growth (5Y)',
    value: metrics.fcfGrowth5Y,
    score: fcfResult.score,
    weight: FUNDAMENTAL_WEIGHTS.fcfGrowth,
    assessment: fcfResult.assessment,
  });

  factors.push({
    name: 'FCF Consistency',
    value: metrics.fcfConsistency,
    score: metrics.fcfConsistency,
    weight: FUNDAMENTAL_WEIGHTS.fcfConsistency,
    assessment: metrics.fcfConsistency >= 70 ? 'Reliable cash flows' : 'Variable cash flows',
  });

  const debtResult = scoreDebtManagement(metrics.debtToFCF);
  factors.push({
    name: 'Debt Management',
    value: metrics.debtToFCF,
    score: debtResult.score,
    weight: FUNDAMENTAL_WEIGHTS.debtManagement,
    assessment: debtResult.assessment,
  });

  // Margin score
  const marginScore = Math.min(100, metrics.netMargin * 500); // 20% margin = 100
  factors.push({
    name: 'Profit Margins',
    value: metrics.netMargin,
    score: marginScore,
    weight: FUNDAMENTAL_WEIGHTS.margins,
    assessment: metrics.netMargin >= 0.15 ? 'Excellent margins' : 'Fair margins',
  });

  const dilutionResult = scoreDilution(metrics.shareDilution5Y);
  factors.push({
    name: 'Share Dilution',
    value: metrics.shareDilution5Y,
    score: dilutionResult.score,
    weight: FUNDAMENTAL_WEIGHTS.dilution,
    assessment: dilutionResult.assessment,
  });

  // Calculate weighted score
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const finalScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

  return {
    score: finalScore,
    factors,
  };
}
