/**
 * Technical Analysis Module
 * 
 * Calculates technical indicators and trend analysis.
 * Returns a 0-100 score with signal breakdown.
 */

import { TechnicalIndicators, TechnicalScore } from '@/types';
import { TECHNICAL_WEIGHTS, RSI_THRESHOLDS } from '../utils/constants';

// ============================================
// MOVING AVERAGES
// ============================================

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  
  const slice = prices.slice(0, period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  
  const multiplier = 2 / (period + 1);
  let ema = prices[prices.length - 1]; // Start with last price
  
  // Calculate EMA backwards
  for (let i = prices.length - 2; i >= 0 && prices.length - i <= period * 2; i--) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// ============================================
// RSI (RELATIVE STRENGTH INDEX)
// ============================================

/**
 * Calculate RSI
 * RSI = 100 - (100 / (1 + RS))
 * RS = Average Gain / Average Loss
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50; // Neutral if not enough data
  
  const changes: number[] = [];
  for (let i = 0; i < prices.length - 1; i++) {
    changes.push(prices[i] - prices[i + 1]); // Prices are reverse chronological
  }
  
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (const change of changes.slice(0, period)) {
    if (change >= 0) {
      gains.push(change);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(change));
    }
  }
  
  const avgGain = gains.reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return rsi;
}

// ============================================
// MACD (MOVING AVERAGE CONVERGENCE DIVERGENCE)
// ============================================

/**
 * Calculate MACD
 * MACD Line = 12-day EMA - 26-day EMA
 * Signal Line = 9-day EMA of MACD Line
 * Histogram = MACD Line - Signal Line
 */
export function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  if (prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 };
  }
  
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  
  // Calculate MACD line for last 9 periods to get signal
  const macdLine: number[] = [];
  for (let i = 0; i < Math.min(prices.length - 26, 9); i++) {
    const slice = prices.slice(i);
    const e12 = calculateEMA(slice, 12);
    const e26 = calculateEMA(slice, 26);
    macdLine.push(e12 - e26);
  }
  
  const signal = macdLine.reduce((a, b) => a + b, 0) / macdLine.length;
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
}

// ============================================
// SUPPORT & RESISTANCE
// ============================================

/**
 * Identify support and resistance levels
 */
export function findSupportResistance(
  prices: number[],
  lookback: number = 50
): { support: number; resistance: number } {
  if (prices.length < 5) {
    return { support: 0, resistance: 0 };
  }
  
  const relevantPrices = prices.slice(0, lookback);
  
  // Find local minima and maxima
  const localMins: number[] = [];
  const localMaxs: number[] = [];
  
  for (let i = 2; i < relevantPrices.length - 2; i++) {
    const price = relevantPrices[i];
    const isMin = price < relevantPrices[i - 1] && 
                  price < relevantPrices[i + 1] &&
                  price < relevantPrices[i - 2] && 
                  price < relevantPrices[i + 2];
    const isMax = price > relevantPrices[i - 1] && 
                  price > relevantPrices[i + 1] &&
                  price > relevantPrices[i - 2] && 
                  price > relevantPrices[i + 2];
    
    if (isMin) localMins.push(price);
    if (isMax) localMaxs.push(price);
  }
  
  // Support = recent low cluster
  const support = localMins.length > 0 
    ? localMins.reduce((a, b) => a + b, 0) / localMins.length
    : Math.min(...relevantPrices);
  
  // Resistance = recent high cluster
  const resistance = localMaxs.length > 0
    ? localMaxs.reduce((a, b) => a + b, 0) / localMaxs.length
    : Math.max(...relevantPrices);
  
  return { support, resistance };
}

// ============================================
// TREND DIRECTION
// ============================================

/**
 * Determine overall trend direction
 */
export function determineTrend(
  currentPrice: number,
  sma50: number,
  sma200: number
): 'bullish' | 'bearish' | 'neutral' {
  // Golden Cross / Death Cross
  const sma50AboveSma200 = sma50 > sma200;
  const priceAboveSma50 = currentPrice > sma50;
  const priceAboveSma200 = currentPrice > sma200;
  
  if (sma50AboveSma200 && priceAboveSma50 && priceAboveSma200) {
    return 'bullish';
  }
  
  if (!sma50AboveSma200 && !priceAboveSma50 && !priceAboveSma200) {
    return 'bearish';
  }
  
  return 'neutral';
}

// ============================================
// TECHNICAL INDICATORS CALCULATION
// ============================================

/**
 * Calculate all technical indicators from price history
 */
export function calculateTechnicalIndicators(
  prices: number[], // Most recent first
  currentPrice: number
): TechnicalIndicators {
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);
  const rsi = calculateRSI(prices);
  const macd = calculateMACD(prices);
  const { support, resistance } = findSupportResistance(prices);
  const trendDirection = determineTrend(currentPrice, sma50, sma200);
  
  return {
    sma50,
    sma200,
    rsi,
    macd,
    supportLevel: support,
    resistanceLevel: resistance,
    trendDirection,
    priceVsSma50: sma50 > 0 ? (currentPrice - sma50) / sma50 : 0,
    priceVsSma200: sma200 > 0 ? (currentPrice - sma200) / sma200 : 0,
  };
}

// ============================================
// TECHNICAL SCORING
// ============================================

/**
 * Score RSI (0-100)
 * Oversold is bullish, overbought is bearish
 */
function scoreRSI(rsi: number): { score: number; signal: 'bullish' | 'bearish' | 'neutral' } {
  if (rsi <= RSI_THRESHOLDS.oversold) {
    return { score: 85, signal: 'bullish' }; // Oversold = buy signal
  }
  if (rsi >= RSI_THRESHOLDS.overbought) {
    return { score: 25, signal: 'bearish' }; // Overbought = caution
  }
  // Neutral zone
  return { score: 50, signal: 'neutral' };
}

/**
 * Score MACD
 */
function scoreMACD(
  macd: { macd: number; signal: number; histogram: number }
): { score: number; signal: 'bullish' | 'bearish' | 'neutral' } {
  const { histogram } = macd;
  
  if (histogram > 0) {
    return { score: 75, signal: 'bullish' };
  }
  if (histogram < 0) {
    return { score: 25, signal: 'bearish' };
  }
  return { score: 50, signal: 'neutral' };
}

/**
 * Score price vs moving average
 */
function scorePriceVsSMA(
  percentAbove: number
): { score: number; signal: 'bullish' | 'bearish' | 'neutral' } {
  if (percentAbove > 0.10) {
    return { score: 70, signal: 'bullish' };
  }
  if (percentAbove > 0) {
    return { score: 60, signal: 'bullish' };
  }
  if (percentAbove > -0.05) {
    return { score: 45, signal: 'neutral' };
  }
  if (percentAbove > -0.10) {
    return { score: 35, signal: 'bearish' };
  }
  return { score: 20, signal: 'bearish' };
}

/**
 * Score overall trend
 */
function scoreTrend(
  trend: 'bullish' | 'bearish' | 'neutral'
): { score: number; signal: 'bullish' | 'bearish' | 'neutral' } {
  switch (trend) {
    case 'bullish':
      return { score: 80, signal: 'bullish' };
    case 'bearish':
      return { score: 20, signal: 'bearish' };
    default:
      return { score: 50, signal: 'neutral' };
  }
}

// ============================================
// MAIN TECHNICAL SCORE
// ============================================

/**
 * Calculate comprehensive technical score
 */
export function calculateTechnicalScore(
  indicators: TechnicalIndicators
): TechnicalScore {
  const signals: TechnicalScore['signals'] = [];
  
  // Trend
  const trendResult = scoreTrend(indicators.trendDirection);
  signals.push({
    name: 'Trend Direction',
    value: indicators.trendDirection,
    signal: trendResult.signal,
    weight: TECHNICAL_WEIGHTS.trend,
  });
  
  // RSI
  const rsiResult = scoreRSI(indicators.rsi);
  signals.push({
    name: 'RSI',
    value: indicators.rsi.toFixed(1),
    signal: rsiResult.signal,
    weight: TECHNICAL_WEIGHTS.rsi,
  });
  
  // MACD
  const macdResult = scoreMACD(indicators.macd);
  signals.push({
    name: 'MACD',
    value: indicators.macd.histogram.toFixed(2),
    signal: macdResult.signal,
    weight: TECHNICAL_WEIGHTS.macd,
  });
  
  // SMA 50
  const sma50Result = scorePriceVsSMA(indicators.priceVsSma50);
  signals.push({
    name: 'Price vs SMA50',
    value: `${(indicators.priceVsSma50 * 100).toFixed(1)}%`,
    signal: sma50Result.signal,
    weight: TECHNICAL_WEIGHTS.sma50,
  });
  
  // SMA 200
  const sma200Result = scorePriceVsSMA(indicators.priceVsSma200);
  signals.push({
    name: 'Price vs SMA200',
    value: `${(indicators.priceVsSma200 * 100).toFixed(1)}%`,
    signal: sma200Result.signal,
    weight: TECHNICAL_WEIGHTS.sma200,
  });
  
  // Calculate weighted score
  const scores = [trendResult, rsiResult, macdResult, sma50Result, sma200Result];
  const weights = [
    TECHNICAL_WEIGHTS.trend,
    TECHNICAL_WEIGHTS.rsi,
    TECHNICAL_WEIGHTS.macd,
    TECHNICAL_WEIGHTS.sma50,
    TECHNICAL_WEIGHTS.sma200,
  ];
  
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedScore = scores.reduce(
    (sum, s, i) => sum + s.score * weights[i],
    0
  );
  const finalScore = Math.round(weightedScore / totalWeight);
  
  return {
    score: finalScore,
    signals,
  };
}
