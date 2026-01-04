/**
 * Earnings Multiple Valuation Model
 * 
 * Simple but effective valuation using P/E multiples.
 * Uses conservative PE based on historical range.
 */

import { EarningsMultipleResult } from '@/types';

// ============================================
// PE MULTIPLE SELECTION
// ============================================

/**
 * Select a conservative PE multiple based on historical range
 * 
 * Philosophy: Use a PE that is below the median to build in margin of safety
 * 
 * @param historicalPELow - Lowest PE in historical period
 * @param historicalPEHigh - Highest PE in historical period
 * @param historicalPEMedian - Median PE in historical period
 * @param growthRate - Expected earnings growth rate
 * @returns Selected PE multiple
 */
export function selectConservativePE(
  historicalPELow: number,
  historicalPEHigh: number,
  historicalPEMedian: number,
  growthRate: number
): number {
  // PEG-based adjustment: Higher growth can justify higher PE
  // But we stay conservative
  const pegRatio = 1.0; // Conservative PEG of 1
  const growthAdjustedPE = growthRate * 100 * pegRatio;
  
  // Use the lower of:
  // 1. 25th percentile of historical range
  // 2. PEG-based PE
  // 3. Historical median
  const percentile25 = historicalPELow + (historicalPEHigh - historicalPELow) * 0.25;
  
  const candidates = [percentile25, growthAdjustedPE, historicalPEMedian];
  const conservativePE = Math.min(...candidates.filter(pe => pe > 0));
  
  // Floor at 5x, cap at 40x for sanity
  return Math.max(5, Math.min(conservativePE, 40));
}

// ============================================
// EARNINGS MULTIPLE VALUATION
// ============================================

/**
 * Calculate fair value using earnings multiple
 * 
 * @param eps - Current earnings per share
 * @param forwardEps - Forward EPS estimate (next year)
 * @param historicalPELow - Historical low PE
 * @param historicalPEHigh - Historical high PE
 * @param historicalPEMedian - Historical median PE
 * @param expectedGrowthRate - Expected earnings growth
 * @param currentPrice - Current stock price
 * @returns Earnings multiple valuation result
 */
export function calculateEarningsMultipleValue(
  eps: number,
  forwardEps: number,
  historicalPELow: number,
  historicalPEHigh: number,
  historicalPEMedian: number,
  expectedGrowthRate: number,
  currentPrice: number
): EarningsMultipleResult {
  // If no earnings, cannot use this model
  if (eps <= 0 && forwardEps <= 0) {
    return {
      eps,
      forwardEps,
      historicalPELow,
      historicalPEHigh,
      historicalPEMedian,
      selectedPE: 0,
      fairValue: 0,
      currentPrice,
      upside: 0,
    };
  }

  // Select conservative PE
  const selectedPE = selectConservativePE(
    historicalPELow,
    historicalPEHigh,
    historicalPEMedian,
    expectedGrowthRate
  );

  // Use forward EPS if available, otherwise trailing EPS
  const epsToUse = forwardEps > 0 ? forwardEps : eps;
  
  // Fair Value = EPS * PE
  const fairValue = epsToUse * selectedPE;

  // Calculate upside
  const upside = (fairValue - currentPrice) / currentPrice;

  return {
    eps,
    forwardEps,
    historicalPELow,
    historicalPEHigh,
    historicalPEMedian,
    selectedPE,
    fairValue,
    currentPrice,
    upside,
  };
}

// ============================================
// HISTORICAL PE ANALYSIS
// ============================================

/**
 * Calculate historical PE statistics from price and earnings history
 * 
 * @param priceHistory - Array of historical prices
 * @param epsHistory - Array of historical EPS values
 * @returns PE statistics
 */
export function analyzeHistoricalPE(
  priceHistory: number[],
  epsHistory: number[]
): { low: number; high: number; median: number; average: number } {
  // Calculate PE ratios for each period
  const peRatios: number[] = [];
  
  const length = Math.min(priceHistory.length, epsHistory.length);
  for (let i = 0; i < length; i++) {
    if (epsHistory[i] > 0) {
      peRatios.push(priceHistory[i] / epsHistory[i]);
    }
  }

  if (peRatios.length === 0) {
    return { low: 0, high: 0, median: 0, average: 0 };
  }

  // Sort for percentile calculations
  const sorted = [...peRatios].sort((a, b) => a - b);
  
  // Remove outliers (top and bottom 10%)
  const trimStart = Math.floor(sorted.length * 0.1);
  const trimEnd = Math.ceil(sorted.length * 0.9);
  const trimmed = sorted.slice(trimStart, trimEnd);

  if (trimmed.length === 0) {
    return { low: 0, high: 0, median: 0, average: 0 };
  }

  const low = trimmed[0];
  const high = trimmed[trimmed.length - 1];
  const median = trimmed[Math.floor(trimmed.length / 2)];
  const average = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;

  return { low, high, median, average };
}

// ============================================
// PETER LYNCH FAIR VALUE
// ============================================

/**
 * Peter Lynch Fair Value (PEG-based)
 * 
 * Fair PE = Growth Rate * 100 (PEG = 1)
 * Fair Value = EPS * Fair PE
 * 
 * @param eps - Earnings per share
 * @param growthRate - Expected growth rate (decimal)
 * @returns Fair value
 */
export function calculateLynchFairValue(eps: number, growthRate: number): number {
  if (eps <= 0 || growthRate <= 0) return 0;
  
  // PEG = 1 means fair PE = growth rate * 100
  const fairPE = Math.min(growthRate * 100, 50); // Cap at 50x
  return eps * fairPE;
}

// ============================================
// GRAHAM NUMBER
// ============================================

/**
 * Benjamin Graham's intrinsic value formula
 * 
 * Value = sqrt(22.5 * EPS * BVPS)
 * 
 * Based on Graham's criteria:
 * - PE < 15
 * - PB < 1.5
 * - PE * PB < 22.5
 * 
 * @param eps - Earnings per share
 * @param bookValuePerShare - Book value per share
 * @returns Graham Number (intrinsic value)
 */
export function calculateGrahamNumber(eps: number, bookValuePerShare: number): number {
  if (eps <= 0 || bookValuePerShare <= 0) return 0;
  
  // Graham's formula: sqrt(22.5 * EPS * BVPS)
  return Math.sqrt(22.5 * eps * bookValuePerShare);
}
