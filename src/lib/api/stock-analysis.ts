/**
 * Stock Analysis Service
 * 
 * Main orchestration layer that brings together all data sources,
 * valuation models, and analysis modules.
 */

import { yahooClient } from '../api/yahoo-client';
import { calculateDCF, calculateReverseDCF, calculateWACC } from '../valuation/dcf';
import { calculateEarningsMultipleValue, analyzeHistoricalPE } from '../valuation/earnings-multiple';
import { calculateFundamentalScore } from '../analysis/fundamental';
import { calculateTechnicalIndicators, calculateTechnicalScore } from '../analysis/technical';
import { cacheManager, cacheKeys } from '../cache/cache-manager';
import {
  StockAnalysis,
  StockQuote,
  FinancialStatements,
  DCFInputs,
  DCFResult,
  EarningsMultipleResult,
  ReverseDCFResult,
  GrahamNumberResult,
  ConfidenceScore,
  RiskFactor,
  Recommendation,
} from '@/types';
import {
  DEFAULT_RISK_FREE_RATE,
  MARKET_RETURN,
  TERMINAL_GROWTH_RATE,
  DCF_PROJECTION_YEARS,
  MARGIN_OF_SAFETY_BUY,
  PREMIUM_THRESHOLD_AVOID,
  CACHE_TTL,
} from '../utils/constants';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate weighted average of multiple fair values
 */
function calculateWeightedFairValue(
  dcfValue: number,
  earningsValue: number,
  weights: { dcf: number; earnings: number } = { dcf: 0.6, earnings: 0.4 }
): number {
  const values: { value: number; weight: number }[] = [];
  
  if (dcfValue > 0) values.push({ value: dcfValue, weight: weights.dcf });
  if (earningsValue > 0) values.push({ value: earningsValue, weight: weights.earnings });
  
  if (values.length === 0) return 0;
  
  const totalWeight = values.reduce((sum, v) => sum + v.weight, 0);
  const weightedSum = values.reduce((sum, v) => sum + v.value * v.weight, 0);
  
  return weightedSum / totalWeight;
}

/**
 * Determine buy zone range
 */
function calculateBuyZone(
  fairValue: number,
  marginOfSafety: number = MARGIN_OF_SAFETY_BUY
): { low: number; high: number } {
  return {
    low: fairValue * (1 - marginOfSafety - 0.10), // 35% discount for strong buy
    high: fairValue * (1 - marginOfSafety), // 25% discount for buy
  };
}

/**
 * Calculate Graham Number
 * Benjamin Graham's formula: √(22.5 × EPS × Book Value per Share)
 * The 22.5 comes from Graham's maximum P/E of 15 × P/B of 1.5
 */
function calculateGrahamNumber(
  eps: number,
  bookValuePerShare: number,
  currentPrice: number
): GrahamNumberResult {
  // Graham Number only works with positive EPS and book value
  if (eps <= 0 || bookValuePerShare <= 0) {
    return {
      eps,
      bookValuePerShare,
      grahamNumber: 0,
      currentPrice,
      upside: 0,
      isBelowGraham: false,
    };
  }
  
  const grahamNumber = Math.sqrt(22.5 * eps * bookValuePerShare);
  const upside = ((grahamNumber - currentPrice) / currentPrice) * 100;
  
  return {
    eps,
    bookValuePerShare,
    grahamNumber,
    currentPrice,
    upside,
    isBelowGraham: currentPrice < grahamNumber,
  };
}

/**
 * Calculate confidence score
 */
function calculateConfidence(
  financials: FinancialStatements,
  dcfResult: DCFResult,
  earningsResult: EarningsMultipleResult,
  fundamentalScore: number
): ConfidenceScore {
  const factors: ConfidenceScore['factors'] = [];
  
  // Data completeness (do we have 10 years of data?)
  const yearsOfData = Math.min(
    financials.income.length,
    financials.balance.length,
    financials.cashFlow.length
  );
  const completenessScore = Math.min(100, yearsOfData * 10);
  factors.push({
    name: 'Data Completeness',
    score: completenessScore,
    weight: 0.25,
    reason: `${yearsOfData} years of financial data available`,
  });
  
  // Earnings stability
  const earningsStability = fundamentalScore >= 60 ? 80 : fundamentalScore >= 40 ? 50 : 20;
  factors.push({
    name: 'Earnings Stability',
    score: earningsStability,
    weight: 0.20,
    reason: fundamentalScore >= 60 ? 'Stable earnings history' : 'Variable earnings',
  });
  
  // Model convergence (do DCF and earnings multiple agree?)
  const dcfValue = dcfResult.intrinsicPrice;
  const earningsValue = earningsResult.fairValue;
  let convergenceScore = 50;
  if (dcfValue > 0 && earningsValue > 0) {
    const difference = Math.abs(dcfValue - earningsValue) / Math.max(dcfValue, earningsValue);
    if (difference < 0.15) convergenceScore = 90;
    else if (difference < 0.30) convergenceScore = 70;
    else if (difference < 0.50) convergenceScore = 40;
    else convergenceScore = 20;
  }
  factors.push({
    name: 'Model Convergence',
    score: convergenceScore,
    weight: 0.20,
    reason: convergenceScore >= 70 ? 'Valuation models agree' : 'Valuation models diverge',
  });
  
  // Margin of safety
  const mosScore = dcfResult.marginOfSafety >= 0.25 ? 90 :
                   dcfResult.marginOfSafety >= 0.10 ? 70 :
                   dcfResult.marginOfSafety >= 0 ? 50 : 30;
  factors.push({
    name: 'Margin of Safety',
    score: mosScore,
    weight: 0.20,
    reason: `${(dcfResult.marginOfSafety * 100).toFixed(1)}% margin of safety`,
  });
  
  // Volatility (using implied growth reasonableness)
  const volatilityScore = 60; // Default moderate
  factors.push({
    name: 'Volatility Assessment',
    score: volatilityScore,
    weight: 0.15,
    reason: 'Moderate volatility expected',
  });
  
  // Calculate weighted score
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  
  return {
    score: Math.round(weightedScore / totalWeight),
    factors,
  };
}

/**
 * Identify risk factors
 */
function identifyRiskFactors(
  financials: FinancialStatements,
  dcfResult: DCFResult,
  fundamentalScore: number
): RiskFactor[] {
  const risks: RiskFactor[] = [];
  
  // High debt
  if (financials.balance[0]?.totalDebt) {
    const debtToEquity = financials.balance[0].totalDebt / financials.balance[0].totalEquity;
    if (debtToEquity > 2) {
      risks.push({
        category: 'financial',
        severity: 'high',
        description: 'Very high debt-to-equity ratio',
      });
    } else if (debtToEquity > 1) {
      risks.push({
        category: 'financial',
        severity: 'medium',
        description: 'Elevated debt levels',
      });
    }
  }
  
  // Declining revenue
  if (financials.income.length >= 2) {
    const recentRevenue = financials.income[0].revenue;
    const previousRevenue = financials.income[1].revenue;
    if (recentRevenue < previousRevenue) {
      risks.push({
        category: 'operational',
        severity: 'medium',
        description: 'Revenue declined year-over-year',
      });
    }
  }
  
  // Negative FCF
  if (financials.cashFlow[0]?.freeCashFlow < 0) {
    risks.push({
      category: 'financial',
      severity: 'high',
      description: 'Negative free cash flow',
    });
  }
  
  // Valuation risk
  if (dcfResult.marginOfSafety < -0.20) {
    risks.push({
      category: 'valuation',
      severity: 'high',
      description: 'Stock appears significantly overvalued',
    });
  }
  
  // Low fundamental score
  if (fundamentalScore < 40) {
    risks.push({
      category: 'operational',
      severity: 'medium',
      description: 'Weak fundamental metrics',
    });
  }
  
  return risks;
}

/**
 * Determine recommendation
 */
function determineRecommendation(
  marginOfSafety: number,
  fundamentalScore: number,
  technicalScore: number,
  confidenceScore: number
): Recommendation {
  const compositeScore = (
    marginOfSafety * 100 * 0.4 +
    fundamentalScore * 0.3 +
    technicalScore * 0.2 +
    confidenceScore * 0.1
  );
  
  // High margin of safety is most important
  if (marginOfSafety >= 0.35 && fundamentalScore >= 60) {
    return 'STRONG_BUY';
  }
  
  if (marginOfSafety >= MARGIN_OF_SAFETY_BUY && fundamentalScore >= 50) {
    return 'BUY';
  }
  
  if (marginOfSafety >= 0 && marginOfSafety < MARGIN_OF_SAFETY_BUY) {
    return 'HOLD';
  }
  
  if (marginOfSafety < -PREMIUM_THRESHOLD_AVOID && fundamentalScore < 40) {
    return 'STRONG_AVOID';
  }
  
  if (marginOfSafety < 0) {
    return 'AVOID';
  }
  
  return 'HOLD';
}

/**
 * Generate analyst-style summary
 */
function generateSummary(
  symbol: string,
  name: string,
  recommendation: Recommendation,
  fairValue: number,
  currentPrice: number,
  marginOfSafety: number,
  fundamentalScore: number,
  technicalScore: number
): string {
  const upside = ((fairValue - currentPrice) / currentPrice * 100).toFixed(1);
  
  let summaryParts: string[] = [];
  
  // Valuation assessment
  if (marginOfSafety >= 0.25) {
    summaryParts.push(`${name} (${symbol}) appears significantly undervalued with ${upside}% upside potential.`);
  } else if (marginOfSafety >= 0) {
    summaryParts.push(`${name} (${symbol}) is trading at a reasonable valuation with modest upside.`);
  } else {
    summaryParts.push(`${name} (${symbol}) appears overvalued at current prices.`);
  }
  
  // Fundamental quality
  if (fundamentalScore >= 70) {
    summaryParts.push('The company demonstrates excellent fundamental quality with strong cash flows and returns on capital.');
  } else if (fundamentalScore >= 50) {
    summaryParts.push('Fundamentals are solid with room for improvement in some areas.');
  } else {
    summaryParts.push('Fundamental quality is a concern with weak metrics across several categories.');
  }
  
  // Technical picture
  if (technicalScore >= 65) {
    summaryParts.push('Technical indicators are bullish with positive momentum.');
  } else if (technicalScore >= 40) {
    summaryParts.push('Technical picture is mixed with no strong directional signals.');
  } else {
    summaryParts.push('Technical indicators suggest bearish momentum.');
  }
  
  // Valuation Analysis (renamed from Recommendation for legal safety)
  const recText = {
    STRONG_BUY: 'Significantly Undervalued - Current valuation appears attractive based on analysis.',
    BUY: 'Undervalued - Analysis suggests potential upside from current levels.',
    HOLD: 'Fairly Valued - Current price appears to reflect intrinsic value.',
    AVOID: 'Overvalued - Analysis suggests limited upside from current price.',
    STRONG_AVOID: 'Significantly Overvalued - Current valuation appears stretched.',
  };
  summaryParts.push(`Analysis Result: ${recText[recommendation]}`);
  
  return summaryParts.join(' ');
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

/**
 * Perform complete stock analysis using Yahoo Finance
 */
export async function analyzeStock(symbol: string): Promise<StockAnalysis | null> {
  try {
    // Check cache first
    const cached = await cacheManager.get<StockAnalysis>(cacheKeys.analysis(symbol));
    if (cached) {
      console.log(`Returning cached analysis for ${symbol}`);
      return cached;
    }

    console.log(`Fetching data for ${symbol} from Yahoo Finance...`);

    // Fetch all required data in parallel using Yahoo Finance
    const [quote, financials, profile, historicalPrices] = await Promise.all([
      yahooClient.getQuote(symbol),
      yahooClient.getFinancials(symbol),
      yahooClient.getProfile(symbol),
      yahooClient.getHistoricalPrices(symbol, 365),
    ]);

    if (!quote) {
      console.error(`Could not fetch quote for ${symbol}`);
      return null;
    }

    // Get most recent financials
    const latestCashFlow = financials.cashFlow[0];
    const latestBalance = financials.balance[0];
    
    // Handle case where financial data might be limited
    const hasSufficientData = latestCashFlow && latestBalance;
    
    // Estimate growth rate from historical data or use default
    let analystGrowthRate = 0.08; // Default 8%
    if (financials.income.length >= 2) {
      const recentRevenue = financials.income[0]?.revenue || 0;
      const olderRevenue = financials.income[Math.min(2, financials.income.length - 1)]?.revenue || 0;
      if (olderRevenue > 0) {
        analystGrowthRate = (recentRevenue - olderRevenue) / olderRevenue / 2; // Annualized roughly
        analystGrowthRate = Math.min(Math.max(analystGrowthRate, -0.10), 0.30); // Cap
      }
    }

    // DCF Inputs - use defaults if financial data is limited
    const dcfInputs: DCFInputs = {
      startingFCF: latestCashFlow?.freeCashFlow || (quote.eps * quote.sharesOutstanding * 0.8), // Estimate FCF from earnings
      sharesOutstanding: quote.sharesOutstanding || 1,
      totalDebt: latestBalance?.totalDebt || 0,
      cash: latestBalance?.cash || 0,
      beta: quote.beta || 1,
      riskFreeRate: DEFAULT_RISK_FREE_RATE, // Use default since we don't have treasury data
      marketReturn: MARKET_RETURN,
      analystGrowthRate: analystGrowthRate,
      terminalGrowthRate: TERMINAL_GROWTH_RATE,
      projectionYears: DCF_PROJECTION_YEARS,
    };

    // Calculate DCF
    const dcfResult = calculateDCF(dcfInputs, quote.price);

    // Calculate Reverse DCF
    const wacc = calculateWACC(quote.beta || 1, DEFAULT_RISK_FREE_RATE, MARKET_RETURN);
    const reverseDCFResult = calculateReverseDCF(
      quote.price,
      dcfInputs.startingFCF,
      quote.sharesOutstanding || 1,
      latestBalance?.totalDebt || 0,
      latestBalance?.cash || 0,
      wacc
    );

    // Historical PE analysis - use price history from Yahoo
    const priceHistory = historicalPrices; // Already just prices
    const epsHistory = financials.income.map(i => i.eps);
    const historicalPE = analyzeHistoricalPE(
      priceHistory.slice(0, epsHistory.length),
      epsHistory
    );

    // Earnings Multiple valuation
    const earningsMultipleResult = calculateEarningsMultipleValue(
      quote.eps,
      quote.forwardEps || quote.eps * (1 + analystGrowthRate),
      historicalPE.low || 10,
      historicalPE.high || 25,
      historicalPE.median || 15,
      analystGrowthRate,
      quote.price
    );

    // Graham Number calculation
    const bookValuePerShare = latestBalance?.totalEquity 
      ? latestBalance.totalEquity / (quote.sharesOutstanding || 1)
      : 0;
    const grahamNumberResult = calculateGrahamNumber(
      quote.eps,
      bookValuePerShare,
      quote.price
    );

    // Technical Analysis
    const technicalIndicators = calculateTechnicalIndicators(priceHistory, quote.price);
    const technicalScore = calculateTechnicalScore(technicalIndicators);

    // Fundamental Analysis
    const fundamentalScore = calculateFundamentalScore(financials);

    // Confidence Score
    const confidenceScore = calculateConfidence(
      financials,
      dcfResult,
      earningsMultipleResult,
      fundamentalScore.score
    );

    // Weighted Fair Value
    const fairValue = calculateWeightedFairValue(
      dcfResult.intrinsicPrice,
      earningsMultipleResult.fairValue
    );

    // Upside and Margin of Safety
    const upside = (fairValue - quote.price) / quote.price;
    const marginOfSafety = upside;

    // Buy Zone
    const buyZone = calculateBuyZone(fairValue);

    // Risk Factors
    const riskFactors = identifyRiskFactors(
      financials,
      dcfResult,
      fundamentalScore.score
    );

    // Recommendation
    const recommendation = determineRecommendation(
      marginOfSafety,
      fundamentalScore.score,
      technicalScore.score,
      confidenceScore.score
    );

    // Summary
    const summary = generateSummary(
      symbol,
      quote.name,
      recommendation,
      fairValue,
      quote.price,
      marginOfSafety,
      fundamentalScore.score,
      technicalScore.score
    );

    // Compile final analysis
    const analysis: StockAnalysis = {
      symbol,
      name: quote.name,
      sector: profile?.sector || 'Unknown',
      industry: profile?.industry || 'Unknown',
      analysisDate: new Date(),
      quote,
      financials,
      dcf: dcfResult,
      earningsMultiple: earningsMultipleResult,
      reverseDCF: {
        impliedGrowthRate: reverseDCFResult.impliedGrowthRate,
        sustainableYears: 10,
        isReasonable: reverseDCFResult.isReasonable,
        assessment: reverseDCFResult.assessment,
      },
      grahamNumber: grahamNumberResult,
      technicalScore,
      fundamentalScore,
      confidenceScore,
      fairValue,
      currentPrice: quote.price,
      upside,
      marginOfSafety,
      buyZone,
      riskFactors,
      recommendation,
      summary,
    };

    // Cache the result
    await cacheManager.set(cacheKeys.analysis(symbol), analysis, CACHE_TTL.analysis);

    return analysis;
  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error);
    return null;
  }
}
