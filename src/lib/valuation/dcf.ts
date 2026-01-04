/**
 * DCF Valuation Model
 * 
 * Implements a multi-phase Discounted Cash Flow model:
 * - Phase 1 (5 years): Analyst growth estimates
 * - Phase 2 (10 years): Growth decay to terminal rate
 * - Phase 3 (5 years): Terminal growth rate
 * 
 * All functions are pure with no side effects.
 */

import {
  DCFInputs,
  DCFProjection,
  DCFResult,
} from '@/types';
import {
  MARKET_RETURN,
  DEFAULT_RISK_FREE_RATE,
  TERMINAL_GROWTH_RATE,
  DCF_PROJECTION_YEARS,
  DCF_PHASE1_YEARS,
  DCF_PHASE2_YEARS,
  DCF_PHASE3_YEARS,
  MARGIN_OF_SAFETY_BUY,
} from '../utils/constants';

// ============================================
// WACC CALCULATION
// ============================================

/**
 * Calculate Weighted Average Cost of Capital using CAPM
 * 
 * WACC = Rf + Beta * (Rm - Rf)
 * 
 * Where:
 * - Rf = Risk-free rate (10Y Treasury)
 * - Beta = Stock's systematic risk
 * - Rm = Expected market return
 * 
 * @param beta - Stock beta (volatility relative to market)
 * @param riskFreeRate - Current risk-free rate
 * @param marketReturn - Expected market return
 * @returns Discount rate as decimal
 */
export function calculateWACC(
  beta: number,
  riskFreeRate: number = DEFAULT_RISK_FREE_RATE,
  marketReturn: number = MARKET_RETURN
): number {
  // Sanity check: Beta shouldn't be negative or extremely high
  const adjustedBeta = Math.max(0.5, Math.min(beta, 3));
  
  // Market risk premium (Rm - Rf)
  const marketRiskPremium = marketReturn - riskFreeRate;
  
  // CAPM formula
  const wacc = riskFreeRate + adjustedBeta * marketRiskPremium;
  
  // Ensure reasonable bounds (5% - 20%)
  return Math.max(0.05, Math.min(wacc, 0.20));
}

// ============================================
// GROWTH RATE CALCULATION
// ============================================

/**
 * Calculate growth rate for a specific year in the projection
 * 
 * Uses three phases:
 * 1. High growth: Years 1-5 use analyst growth estimate
 * 2. Decay phase: Years 6-15 linearly decay to terminal rate
 * 3. Terminal phase: Years 16-20 use terminal growth rate
 * 
 * @param year - Projection year (1-20)
 * @param analystGrowthRate - Initial growth rate from analyst estimates
 * @param terminalGrowthRate - Long-term sustainable growth rate
 * @returns Growth rate as decimal for the specified year
 */
export function calculateGrowthRate(
  year: number,
  analystGrowthRate: number,
  terminalGrowthRate: number = TERMINAL_GROWTH_RATE
): number {
  // Phase 1: High growth period (years 1-5)
  if (year <= DCF_PHASE1_YEARS) {
    return analystGrowthRate;
  }
  
  // Phase 3: Terminal growth (years 16-20)
  if (year > DCF_PHASE1_YEARS + DCF_PHASE2_YEARS) {
    return terminalGrowthRate;
  }
  
  // Phase 2: Decay period (years 6-15)
  // Linear interpolation from analyst rate to terminal rate
  const decayYear = year - DCF_PHASE1_YEARS; // 1-10 in decay phase
  const totalDecayYears = DCF_PHASE2_YEARS;
  
  const decayProgress = decayYear / totalDecayYears;
  const decayedRate = analystGrowthRate - (analystGrowthRate - terminalGrowthRate) * decayProgress;
  
  return Math.max(decayedRate, terminalGrowthRate);
}

// ============================================
// FREE CASH FLOW PROJECTION
// ============================================

/**
 * Project Free Cash Flow for all years
 * 
 * @param startingFCF - Most recent annual FCF
 * @param analystGrowthRate - Growth rate for phase 1
 * @param terminalGrowthRate - Terminal growth rate
 * @param years - Number of years to project
 * @returns Array of projected FCF values
 */
export function projectFCF(
  startingFCF: number,
  analystGrowthRate: number,
  terminalGrowthRate: number = TERMINAL_GROWTH_RATE,
  years: number = DCF_PROJECTION_YEARS
): { year: number; fcf: number; growthRate: number }[] {
  const projections: { year: number; fcf: number; growthRate: number }[] = [];
  let previousFCF = startingFCF;
  
  for (let year = 1; year <= years; year++) {
    const growthRate = calculateGrowthRate(year, analystGrowthRate, terminalGrowthRate);
    const fcf = previousFCF * (1 + growthRate);
    
    projections.push({
      year,
      fcf,
      growthRate,
    });
    
    previousFCF = fcf;
  }
  
  return projections;
}

// ============================================
// TERMINAL VALUE
// ============================================

/**
 * Calculate Terminal Value using Gordon Growth Model
 * 
 * TV = FCF_n * (1 + g) / (r - g)
 * 
 * Where:
 * - FCF_n = Free Cash Flow in final projected year
 * - g = Terminal growth rate
 * - r = Discount rate (WACC)
 * 
 * @param finalFCF - FCF in the last projected year
 * @param terminalGrowthRate - Long-term sustainable growth rate
 * @param discountRate - WACC
 * @returns Terminal value
 */
export function calculateTerminalValue(
  finalFCF: number,
  terminalGrowthRate: number = TERMINAL_GROWTH_RATE,
  discountRate: number
): number {
  // Guard against division by zero or negative denominator
  if (discountRate <= terminalGrowthRate) {
    throw new Error('Discount rate must be greater than terminal growth rate');
  }
  
  return (finalFCF * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
}

// ============================================
// PRESENT VALUE CALCULATIONS
// ============================================

/**
 * Calculate discount factor for a given year
 * 
 * DF = 1 / (1 + r)^n
 * 
 * @param year - Year number
 * @param discountRate - Discount rate (WACC)
 * @returns Discount factor
 */
export function calculateDiscountFactor(year: number, discountRate: number): number {
  return 1 / Math.pow(1 + discountRate, year);
}

/**
 * Calculate present value of a future cash flow
 * 
 * @param futureValue - Future cash flow
 * @param year - Year when cash flow occurs
 * @param discountRate - Discount rate (WACC)
 * @returns Present value
 */
export function calculatePresentValue(
  futureValue: number,
  year: number,
  discountRate: number
): number {
  return futureValue * calculateDiscountFactor(year, discountRate);
}

// ============================================
// MAIN DCF CALCULATION
// ============================================

/**
 * Perform complete DCF valuation
 * 
 * @param inputs - DCF model inputs
 * @param currentPrice - Current stock price for comparison
 * @returns Complete DCF result with intrinsic value
 */
export function calculateDCF(
  inputs: DCFInputs,
  currentPrice: number
): DCFResult {
  const {
    startingFCF,
    sharesOutstanding,
    totalDebt,
    cash,
    beta,
    riskFreeRate = DEFAULT_RISK_FREE_RATE,
    marketReturn = MARKET_RETURN,
    analystGrowthRate,
    terminalGrowthRate = TERMINAL_GROWTH_RATE,
    projectionYears = DCF_PROJECTION_YEARS,
  } = inputs;

  // Step 1: Calculate discount rate (WACC)
  const wacc = calculateWACC(beta, riskFreeRate, marketReturn);

  // Step 2: Project Free Cash Flows
  const fcfProjections = projectFCF(
    startingFCF,
    analystGrowthRate,
    terminalGrowthRate,
    projectionYears
  );

  // Step 3: Calculate present values for each year
  const projections: DCFProjection[] = fcfProjections.map((proj) => {
    const discountFactor = calculateDiscountFactor(proj.year, wacc);
    const presentValue = proj.fcf * discountFactor;
    
    return {
      year: proj.year,
      fcf: proj.fcf,
      growthRate: proj.growthRate,
      discountFactor,
      presentValue,
    };
  });

  // Step 4: Sum of PV of projected cash flows
  const pvOfCashFlows = projections.reduce((sum, p) => sum + p.presentValue, 0);

  // Step 5: Calculate Terminal Value and its PV
  const finalFCF = projections[projections.length - 1].fcf;
  const terminalValue = calculateTerminalValue(finalFCF, terminalGrowthRate, wacc);
  const terminalValuePV = calculatePresentValue(terminalValue, projectionYears, wacc);

  // Step 6: Enterprise Value = PV of Cash Flows + PV of Terminal Value
  const enterpriseValue = pvOfCashFlows + terminalValuePV;

  // Step 7: Equity Value = EV - Debt + Cash
  const equityValue = enterpriseValue - totalDebt + cash;

  // Step 8: Intrinsic Price = Equity Value / Shares Outstanding
  const intrinsicPrice = equityValue / sharesOutstanding;

  // Step 9: Calculate upside and margin of safety
  const upside = (intrinsicPrice - currentPrice) / currentPrice;
  const marginOfSafety = upside; // Positive = undervalued

  return {
    projections,
    wacc,
    terminalValue,
    terminalValuePV,
    enterpriseValue,
    equityValue,
    intrinsicPrice,
    currentPrice,
    upside,
    marginOfSafety,
  };
}

// ============================================
// REVERSE DCF
// ============================================

/**
 * Reverse DCF: Find implied growth rate from current market price
 * 
 * Iteratively solves for the growth rate that would justify current price
 * 
 * @param currentPrice - Current stock price
 * @param startingFCF - Starting FCF
 * @param sharesOutstanding - Shares outstanding
 * @param totalDebt - Total debt
 * @param cash - Cash and equivalents
 * @param wacc - Discount rate
 * @param terminalGrowthRate - Terminal growth rate
 * @returns Implied growth rate and assessment
 */
export function calculateReverseDCF(
  currentPrice: number,
  startingFCF: number,
  sharesOutstanding: number,
  totalDebt: number,
  cash: number,
  wacc: number,
  terminalGrowthRate: number = TERMINAL_GROWTH_RATE
): { impliedGrowthRate: number; assessment: string; isReasonable: boolean } {
  // Target equity value implied by market
  const targetEquityValue = currentPrice * sharesOutstanding;
  const targetEV = targetEquityValue + totalDebt - cash;
  
  // Binary search for implied growth rate
  let lowGrowth = -0.20; // -20%
  let highGrowth = 0.50; // +50%
  let impliedGrowthRate = 0;
  
  const maxIterations = 50;
  const tolerance = 0.0001;
  
  for (let i = 0; i < maxIterations; i++) {
    impliedGrowthRate = (lowGrowth + highGrowth) / 2;
    
    // Calculate EV with this growth rate
    const projections = projectFCF(startingFCF, impliedGrowthRate, terminalGrowthRate);
    let pvOfCashFlows = 0;
    
    for (const proj of projections) {
      const df = calculateDiscountFactor(proj.year, wacc);
      pvOfCashFlows += proj.fcf * df;
    }
    
    const finalFCF = projections[projections.length - 1].fcf;
    const tv = calculateTerminalValue(finalFCF, terminalGrowthRate, wacc);
    const tvPV = calculatePresentValue(tv, DCF_PROJECTION_YEARS, wacc);
    
    const calculatedEV = pvOfCashFlows + tvPV;
    
    if (Math.abs(calculatedEV - targetEV) < tolerance * targetEV) {
      break;
    }
    
    if (calculatedEV < targetEV) {
      lowGrowth = impliedGrowthRate;
    } else {
      highGrowth = impliedGrowthRate;
    }
  }
  
  // Assess reasonableness
  let assessment: string;
  let isReasonable: boolean;
  
  if (impliedGrowthRate > 0.30) {
    assessment = `Market expects ${(impliedGrowthRate * 100).toFixed(1)}% annual growth - extremely aggressive!`;
    isReasonable = false;
  } else if (impliedGrowthRate > 0.20) {
    assessment = `Market expects ${(impliedGrowthRate * 100).toFixed(1)}% growth - very optimistic assumptions`;
    isReasonable = false;
  } else if (impliedGrowthRate > 0.10) {
    assessment = `Market expects ${(impliedGrowthRate * 100).toFixed(1)}% growth - reasonably optimistic`;
    isReasonable = true;
  } else if (impliedGrowthRate > 0) {
    assessment = `Market expects ${(impliedGrowthRate * 100).toFixed(1)}% growth - conservative expectations`;
    isReasonable = true;
  } else {
    assessment = `Market expects negative growth (${(impliedGrowthRate * 100).toFixed(1)}%) - very pessimistic`;
    isReasonable = true;
  }
  
  return {
    impliedGrowthRate,
    assessment,
    isReasonable,
  };
}

// ============================================
// SENSITIVITY ANALYSIS
// ============================================

/**
 * Generate sensitivity analysis table
 * Shows intrinsic values for various WACC and growth rate combinations
 */
export function generateSensitivityTable(
  inputs: DCFInputs,
  waccRange: number[] = [-0.02, -0.01, 0, 0.01, 0.02],
  growthRange: number[] = [-0.05, -0.025, 0, 0.025, 0.05]
): { wacc: number; growth: number; intrinsicPrice: number }[] {
  const baseWACC = calculateWACC(inputs.beta, inputs.riskFreeRate, inputs.marketReturn);
  const results: { wacc: number; growth: number; intrinsicPrice: number }[] = [];
  
  for (const waccDelta of waccRange) {
    for (const growthDelta of growthRange) {
      const modifiedInputs: DCFInputs = {
        ...inputs,
        beta: inputs.beta, // Keep beta, adjust through WACC
        analystGrowthRate: inputs.analystGrowthRate + growthDelta,
      };
      
      // Manually adjust WACC by creating a modified beta
      const targetWACC = baseWACC + waccDelta;
      const modifiedBeta = (targetWACC - inputs.riskFreeRate) / (inputs.marketReturn - inputs.riskFreeRate);
      modifiedInputs.beta = modifiedBeta;
      
      try {
        const result = calculateDCF(modifiedInputs, 0);
        results.push({
          wacc: targetWACC,
          growth: inputs.analystGrowthRate + growthDelta,
          intrinsicPrice: result.intrinsicPrice,
        });
      } catch {
        results.push({
          wacc: targetWACC,
          growth: inputs.analystGrowthRate + growthDelta,
          intrinsicPrice: 0,
        });
      }
    }
  }
  
  return results;
}
