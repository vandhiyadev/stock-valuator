/**
 * Financial Modeling Prep API Client
 * Primary data source for financial data
 * 
 * Free tier: 250 requests/day
 * Docs: https://financialmodelingprep.com/developer/docs/
 */

import axios, { AxiosInstance } from 'axios';
import { 
  StockQuote, 
  IncomeStatement, 
  BalanceSheet, 
  CashFlowStatement,
  FinancialStatements 
} from '@/types';
import { API_CONFIG } from '../utils/constants';

// ============================================
// API CLIENT
// ============================================

class FMPClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.FMP_API_KEY || '';
    this.client = axios.create({
      baseURL: API_CONFIG.fmp.baseUrl,
      timeout: 15000,
    });
  }

  /**
   * Make API request with error handling and rate limit awareness
   */
  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error('FMP_API_KEY environment variable is not set');
    }

    try {
      const response = await this.client.get<T>(endpoint, {
        params: {
          ...params,
          apikey: this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('FMP API rate limit exceeded');
        }
        throw new Error(`FMP API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get real-time stock quote
   */
  async getQuote(symbol: string): Promise<StockQuote | null> {
    try {
      const data = await this.request<any[]>(`/quote/${symbol.toUpperCase()}`);
      
      if (!data || data.length === 0) {
        return null;
      }

      const quote = data[0];
      return {
        symbol: quote.symbol,
        name: quote.name,
        price: quote.price,
        previousClose: quote.previousClose,
        change: quote.change,
        changePercent: quote.changesPercentage,
        volume: quote.volume,
        marketCap: quote.marketCap,
        sharesOutstanding: quote.sharesOutstanding,
        beta: quote.beta || 1,
        pe: quote.pe,
        forwardPE: quote.priceToEarnings,
        eps: quote.eps,
        forwardEps: quote.eps, // FMP doesn't have forward EPS in quote
        dividendYield: quote.lastDividend / quote.price || 0,
        fiftyTwoWeekHigh: quote.yearHigh,
        fiftyTwoWeekLow: quote.yearLow,
        sma50: quote.priceAvg50,
        sma200: quote.priceAvg200,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error fetching FMP quote:', error);
      return null;
    }
  }

  /**
   * Get stock profile with additional details
   */
  async getProfile(symbol: string): Promise<any | null> {
    try {
      const data = await this.request<any[]>(`/profile/${symbol.toUpperCase()}`);
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching FMP profile:', error);
      return null;
    }
  }

  /**
   * Get income statements (10 years)
   */
  async getIncomeStatements(symbol: string, limit: number = 10): Promise<IncomeStatement[]> {
    try {
      const data = await this.request<any[]>(
        `/income-statement/${symbol.toUpperCase()}`,
        { limit: limit.toString() }
      );

      if (!data) return [];

      return data.map((item: any) => ({
        date: item.date,
        fiscalYear: parseInt(item.calendarYear) || new Date(item.date).getFullYear(),
        revenue: item.revenue,
        costOfRevenue: item.costOfRevenue,
        grossProfit: item.grossProfit,
        grossProfitMargin: item.grossProfitRatio,
        operatingExpenses: item.operatingExpenses,
        operatingIncome: item.operatingIncome,
        operatingIncomeMargin: item.operatingIncomeRatio,
        interestExpense: item.interestExpense,
        netIncome: item.netIncome,
        netIncomeMargin: item.netIncomeRatio,
        eps: item.eps,
        epsDiluted: item.epsdiluted,
        sharesOutstanding: item.weightedAverageShsOut,
        sharesOutstandingDiluted: item.weightedAverageShsOutDil,
      }));
    } catch (error) {
      console.error('Error fetching income statements:', error);
      return [];
    }
  }

  /**
   * Get balance sheets (10 years)
   */
  async getBalanceSheets(symbol: string, limit: number = 10): Promise<BalanceSheet[]> {
    try {
      const data = await this.request<any[]>(
        `/balance-sheet-statement/${symbol.toUpperCase()}`,
        { limit: limit.toString() }
      );

      if (!data) return [];

      return data.map((item: any) => ({
        date: item.date,
        fiscalYear: parseInt(item.calendarYear) || new Date(item.date).getFullYear(),
        totalAssets: item.totalAssets,
        totalCurrentAssets: item.totalCurrentAssets,
        cash: item.cashAndCashEquivalents,
        shortTermInvestments: item.shortTermInvestments,
        totalLiabilities: item.totalLiabilities,
        totalCurrentLiabilities: item.totalCurrentLiabilities,
        totalDebt: item.totalDebt,
        longTermDebt: item.longTermDebt,
        shortTermDebt: item.shortTermDebt,
        totalEquity: item.totalStockholdersEquity,
        retainedEarnings: item.retainedEarnings,
      }));
    } catch (error) {
      console.error('Error fetching balance sheets:', error);
      return [];
    }
  }

  /**
   * Get cash flow statements (10 years)
   */
  async getCashFlowStatements(symbol: string, limit: number = 10): Promise<CashFlowStatement[]> {
    try {
      const data = await this.request<any[]>(
        `/cash-flow-statement/${symbol.toUpperCase()}`,
        { limit: limit.toString() }
      );

      if (!data) return [];

      return data.map((item: any) => ({
        date: item.date,
        fiscalYear: parseInt(item.calendarYear) || new Date(item.date).getFullYear(),
        operatingCashFlow: item.operatingCashFlow,
        capitalExpenditures: Math.abs(item.capitalExpenditure), // Convert to positive
        freeCashFlow: item.freeCashFlow,
        depreciation: item.depreciationAndAmortization,
        stockCompensation: item.stockBasedCompensation,
        dividendsPaid: Math.abs(item.dividendsPaid || 0),
        shareRepurchases: Math.abs(item.commonStockRepurchased || 0),
        debtRepayment: Math.abs(item.debtRepayment || 0),
        netBorrowings: item.netDebt,
      }));
    } catch (error) {
      console.error('Error fetching cash flow statements:', error);
      return [];
    }
  }

  /**
   * Get all financial statements bundled
   */
  async getAllFinancials(symbol: string): Promise<FinancialStatements> {
    const [income, balance, cashFlow] = await Promise.all([
      this.getIncomeStatements(symbol),
      this.getBalanceSheets(symbol),
      this.getCashFlowStatements(symbol),
    ]);

    return { income, balance, cashFlow };
  }

  /**
   * Get key metrics including analyst estimates
   */
  async getKeyMetrics(symbol: string): Promise<any | null> {
    try {
      const data = await this.request<any[]>(
        `/key-metrics/${symbol.toUpperCase()}`,
        { limit: '1' }
      );
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching key metrics:', error);
      return null;
    }
  }

  /**
   * Get analyst estimates
   */
  async getAnalystEstimates(symbol: string): Promise<any[]> {
    try {
      const data = await this.request<any[]>(
        `/analyst-estimates/${symbol.toUpperCase()}`,
        { limit: '1' }
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching analyst estimates:', error);
      return [];
    }
  }

  /**
   * Get historical prices for technical analysis
   */
  async getHistoricalPrices(symbol: string, days: number = 365): Promise<any[]> {
    try {
      const data = await this.request<any>(`/historical-price-full/${symbol.toUpperCase()}`);
      return (data?.historical || []).slice(0, days);
    } catch (error) {
      console.error('Error fetching historical prices:', error);
      return [];
    }
  }

  /**
   * Get US Treasury rate (risk-free rate)
   */
  async getTreasuryRate(): Promise<number> {
    try {
      const data = await this.request<any[]>('/treasury');
      // Find the 10 year rate
      const tenYear = data?.find((item: any) => item.month === '10') || data?.[0];
      return (tenYear?.close || 4.5) / 100; // Convert to decimal
    } catch (error) {
      console.error('Error fetching treasury rate:', error);
      return 0.045; // Default 4.5%
    }
  }
}

// Export singleton instance
export const fmpClient = new FMPClient();
