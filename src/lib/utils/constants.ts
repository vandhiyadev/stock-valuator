/**
 * Financial Constants
 * All financial assumptions and constants are defined here.
 * No magic numbers in valuation code!
 */

// ============================================
// MARKET ASSUMPTIONS
// ============================================

/**
 * Long-term expected market return (S&P 500 historical average)
 * Used in CAPM calculation for discount rate
 */
export const MARKET_RETURN = 0.10; // 10%

/**
 * Default risk-free rate when US 10Y Treasury rate unavailable
 * This is a fallback; real-time data is preferred
 */
export const DEFAULT_RISK_FREE_RATE = 0.045; // 4.5%

/**
 * Terminal growth rate - long-term sustainable growth
 * Should not exceed long-term GDP growth (~2-3%)
 */
export const TERMINAL_GROWTH_RATE = 0.025; // 2.5%

/**
 * Maximum terminal growth rate cap
 */
export const MAX_TERMINAL_GROWTH = 0.035; // 3.5%

// ============================================
// DCF MODEL PARAMETERS
// ============================================

/**
 * Total projection period for DCF model
 */
export const DCF_PROJECTION_YEARS = 20;

/**
 * Phase 1: High growth period (analyst estimates)
 */
export const DCF_PHASE1_YEARS = 5;

/**
 * Phase 2: Growth decay period (transition to terminal)
 */
export const DCF_PHASE2_YEARS = 10;

/**
 * Phase 3: Terminal growth period
 */
export const DCF_PHASE3_YEARS = 5;

/**
 * Margin of safety for buy recommendations
 * Require this discount to intrinsic value for "BUY"
 */
export const MARGIN_OF_SAFETY_BUY = 0.25; // 25%

/**
 * Premium threshold for "AVOID" recommendation
 */
export const PREMIUM_THRESHOLD_AVOID = 0.20; // 20% overvalued

// ============================================
// SCORING WEIGHTS
// ============================================

export const FUNDAMENTAL_WEIGHTS = {
  roic: 0.20,
  revenueGrowth: 0.15,
  revenueStability: 0.10,
  fcfGrowth: 0.15,
  fcfConsistency: 0.10,
  debtManagement: 0.10,
  operatingLeverage: 0.05,
  margins: 0.10,
  dilution: 0.05,
} as const;

export const TECHNICAL_WEIGHTS = {
  trend: 0.25,
  rsi: 0.20,
  macd: 0.20,
  sma50: 0.15,
  sma200: 0.20,
} as const;

export const CONFIDENCE_WEIGHTS = {
  dataCompleteness: 0.25,
  volatility: 0.15,
  marginOfSafety: 0.20,
  earningsStability: 0.20,
  modelConvergence: 0.20,
} as const;

// ============================================
// THRESHOLDS
// ============================================

export const SCORE_THRESHOLDS = {
  excellent: 80,
  good: 60,
  fair: 40,
  poor: 20,
} as const;

export const RSI_THRESHOLDS = {
  overbought: 70,
  oversold: 30,
} as const;

// ============================================
// API CONFIGURATION
// ============================================

export const API_CONFIG = {
  fmp: {
    baseUrl: 'https://financialmodelingprep.com/api/v3',
    cacheHours: 12,
  },
  alphaVantage: {
    baseUrl: 'https://www.alphavantage.co/query',
    cacheHours: 12,
  },
  yahoo: {
    quotesUrl: 'https://query2.finance.yahoo.com/v10/finance/quoteSummary',
    chartUrl: 'https://query2.finance.yahoo.com/v8/finance/chart',
    cacheHours: 1,
  },
} as const;

// ============================================
// CACHE CONFIGURATION
// ============================================

export const CACHE_TTL = {
  quote: 5 * 60, // 5 minutes for real-time quotes
  financials: 24 * 60 * 60, // 24 hours for annual financials
  analysis: 12 * 60 * 60, // 12 hours for analysis results
} as const;
