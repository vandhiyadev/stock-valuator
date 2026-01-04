/**
 * Stock Analysis Types
 * Core type definitions for the stock valuation application
 */

// ============================================
// MARKET DATA TYPES
// ============================================

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sharesOutstanding: number;
  beta: number;
  pe: number;
  forwardPE: number;
  eps: number;
  forwardEps: number;
  dividendYield: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  sma50: number;
  sma200: number;
  timestamp: Date;
}

// ============================================
// FINANCIAL STATEMENT TYPES
// ============================================

export interface IncomeStatement {
  date: string;
  fiscalYear: number;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossProfitMargin: number;
  operatingExpenses: number;
  operatingIncome: number;
  operatingIncomeMargin: number;
  interestExpense: number;
  netIncome: number;
  netIncomeMargin: number;
  eps: number;
  epsDiluted: number;
  sharesOutstanding: number;
  sharesOutstandingDiluted: number;
}

export interface BalanceSheet {
  date: string;
  fiscalYear: number;
  totalAssets: number;
  totalCurrentAssets: number;
  cash: number;
  shortTermInvestments: number;
  totalLiabilities: number;
  totalCurrentLiabilities: number;
  totalDebt: number;
  longTermDebt: number;
  shortTermDebt: number;
  totalEquity: number;
  retainedEarnings: number;
}

export interface CashFlowStatement {
  date: string;
  fiscalYear: number;
  operatingCashFlow: number;
  capitalExpenditures: number;
  freeCashFlow: number;
  depreciation: number;
  stockCompensation: number;
  dividendsPaid: number;
  shareRepurchases: number;
  debtRepayment: number;
  netBorrowings: number;
}

export interface FinancialStatements {
  income: IncomeStatement[];
  balance: BalanceSheet[];
  cashFlow: CashFlowStatement[];
}

// ============================================
// VALUATION INPUTS & OUTPUTS
// ============================================

export interface DCFInputs {
  startingFCF: number;
  sharesOutstanding: number;
  totalDebt: number;
  cash: number;
  beta: number;
  riskFreeRate: number;
  marketReturn: number;
  analystGrowthRate: number;
  terminalGrowthRate: number;
  projectionYears: number;
}

export interface DCFProjection {
  year: number;
  fcf: number;
  growthRate: number;
  discountFactor: number;
  presentValue: number;
}

export interface DCFResult {
  projections: DCFProjection[];
  wacc: number;
  terminalValue: number;
  terminalValuePV: number;
  enterpriseValue: number;
  equityValue: number;
  intrinsicPrice: number;
  currentPrice: number;
  upside: number;
  marginOfSafety: number;
}

export interface EarningsMultipleResult {
  eps: number;
  forwardEps: number;
  historicalPELow: number;
  historicalPEHigh: number;
  historicalPEMedian: number;
  selectedPE: number;
  fairValue: number;
  currentPrice: number;
  upside: number;
}

export interface ReverseDCFResult {
  impliedGrowthRate: number;
  sustainableYears: number;
  isReasonable: boolean;
  assessment: string;
}

// ============================================
// TECHNICAL ANALYSIS TYPES
// ============================================

export interface TechnicalIndicators {
  sma50: number;
  sma200: number;
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  supportLevel: number;
  resistanceLevel: number;
  trendDirection: 'bullish' | 'bearish' | 'neutral';
  priceVsSma50: number; // % above/below
  priceVsSma200: number;
}

export interface TechnicalScore {
  score: number; // 0-100
  signals: {
    name: string;
    value: number | string;
    signal: 'bullish' | 'bearish' | 'neutral';
    weight: number;
  }[];
}

// ============================================
// FUNDAMENTAL ANALYSIS TYPES
// ============================================

export interface FundamentalMetrics {
  roic: number;
  roicTrend: number; // 5yr avg change
  revenueGrowth5Y: number;
  revenueGrowthStability: number; // std dev
  fcfGrowth5Y: number;
  fcfConsistency: number;
  debtToFCF: number;
  operatingLeverage: number;
  netMargin: number;
  grossMargin: number;
  shareDilution5Y: number; // % change in shares
}

export interface FundamentalScore {
  score: number; // 0-100
  factors: {
    name: string;
    value: number;
    score: number;
    weight: number;
    assessment: string;
  }[];
}

// ============================================
// CONFIDENCE & FINAL OUTPUT
// ============================================

export interface ConfidenceScore {
  score: number; // 0-100
  factors: {
    name: string;
    score: number;
    weight: number;
    reason: string;
  }[];
}

export interface RiskFactor {
  category: 'financial' | 'market' | 'operational' | 'valuation';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export type Recommendation = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID' | 'STRONG_AVOID';

export interface StockAnalysis {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  analysisDate: Date;
  
  // Current Data
  quote: StockQuote;
  
  // Historical Data
  financials: FinancialStatements;
  
  // Valuations
  dcf: DCFResult;
  earningsMultiple: EarningsMultipleResult;
  reverseDCF: ReverseDCFResult;
  
  // Scores
  technicalScore: TechnicalScore;
  fundamentalScore: FundamentalScore;
  confidenceScore: ConfidenceScore;
  
  // Summary
  fairValue: number; // Weighted average of models
  currentPrice: number;
  upside: number;
  marginOfSafety: number;
  buyZone: { low: number; high: number };
  
  // Risk & Recommendation
  riskFactors: RiskFactor[];
  recommendation: Recommendation;
  summary: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  timestamp?: Date;
}
