/**
 * Yahoo Finance API Client
 * Uses yahoo-finance2 npm package for reliable data
 */

import YahooFinance from 'yahoo-finance2';
import { 
  StockQuote, 
  IncomeStatement, 
  BalanceSheet, 
  CashFlowStatement,
  FinancialStatements 
} from '@/types';

// Initialize Yahoo Finance client
const yahooFinance = new YahooFinance();

class YahooFinanceClient {
  /**
   * Get stock quote
   */
  async getQuote(symbol: string): Promise<StockQuote | null> {
    try {
      const quote = await yahooFinance.quote(symbol);
      
      if (!quote || !quote.regularMarketPrice) {
        return null;
      }

      return {
        symbol: symbol.toUpperCase(),
        name: quote.shortName || quote.longName || symbol,
        price: quote.regularMarketPrice || 0,
        previousClose: quote.regularMarketPreviousClose || 0,
        change: quote.regularMarketChange || 0,
        changePercent: (quote.regularMarketChangePercent || 0) * 100,
        volume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap || 0,
        sharesOutstanding: quote.sharesOutstanding || 0,
        beta: quote.beta || 1,
        pe: quote.trailingPE || 0,
        forwardPE: quote.forwardPE || 0,
        eps: quote.epsTrailingTwelveMonths || 0,
        forwardEps: quote.epsForward || 0,
        dividendYield: quote.dividendYield || 0,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
        sma50: quote.fiftyDayAverage || 0,
        sma200: quote.twoHundredDayAverage || 0,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error fetching Yahoo quote:', error);
      return null;
    }
  }

  /**
   * Get financial statements - uses quoteSummary module
   */
  async getFinancials(symbol: string): Promise<FinancialStatements> {
    try {
      const result = await yahooFinance.quoteSummary(symbol, {
        modules: ['incomeStatementHistory', 'balanceSheetHistory', 'cashflowStatementHistory']
      });
      
      // Parse income statements
      const incomeHistory = result.incomeStatementHistory?.incomeStatementHistory || [];
      const income: IncomeStatement[] = incomeHistory.map((item: any) => ({
        date: item.endDate?.toISOString().split('T')[0] || '',
        fiscalYear: item.endDate ? new Date(item.endDate).getFullYear() : 0,
        revenue: item.totalRevenue || 0,
        costOfRevenue: item.costOfRevenue || 0,
        grossProfit: item.grossProfit || 0,
        grossProfitMargin: item.totalRevenue ? (item.grossProfit || 0) / item.totalRevenue : 0,
        operatingExpenses: item.totalOperatingExpenses || 0,
        operatingIncome: item.operatingIncome || 0,
        operatingIncomeMargin: item.totalRevenue ? (item.operatingIncome || 0) / item.totalRevenue : 0,
        interestExpense: item.interestExpense || 0,
        netIncome: item.netIncome || 0,
        netIncomeMargin: item.totalRevenue ? (item.netIncome || 0) / item.totalRevenue : 0,
        eps: (item.netIncome || 0) / (item.dilutedAverageShares || 1),
        epsDiluted: (item.netIncome || 0) / (item.dilutedAverageShares || 1),
        sharesOutstanding: item.dilutedAverageShares || 0,
        sharesOutstandingDiluted: item.dilutedAverageShares || 0,
      }));

      // Parse balance sheets
      const balanceHistory = result.balanceSheetHistory?.balanceSheetStatements || [];
      const balance: BalanceSheet[] = balanceHistory.map((item: any) => ({
        date: item.endDate?.toISOString().split('T')[0] || '',
        fiscalYear: item.endDate ? new Date(item.endDate).getFullYear() : 0,
        totalAssets: item.totalAssets || 0,
        totalCurrentAssets: item.totalCurrentAssets || 0,
        cash: item.cash || 0,
        shortTermInvestments: item.shortTermInvestments || 0,
        totalLiabilities: item.totalLiab || 0,
        totalCurrentLiabilities: item.totalCurrentLiabilities || 0,
        totalDebt: (item.longTermDebt || 0) + (item.shortLongTermDebt || 0),
        longTermDebt: item.longTermDebt || 0,
        shortTermDebt: item.shortLongTermDebt || 0,
        totalEquity: item.totalStockholderEquity || 0,
        retainedEarnings: item.retainedEarnings || 0,
      }));

      // Parse cash flow statements
      const cashFlowHistory = result.cashflowStatementHistory?.cashflowStatements || [];
      const cashFlow: CashFlowStatement[] = cashFlowHistory.map((item: any) => ({
        date: item.endDate?.toISOString().split('T')[0] || '',
        fiscalYear: item.endDate ? new Date(item.endDate).getFullYear() : 0,
        operatingCashFlow: item.totalCashFromOperatingActivities || 0,
        capitalExpenditures: Math.abs(item.capitalExpenditures || 0),
        freeCashFlow: (item.totalCashFromOperatingActivities || 0) + (item.capitalExpenditures || 0),
        depreciation: item.depreciation || 0,
        stockCompensation: item.stockBasedCompensation || 0,
        dividendsPaid: Math.abs(item.dividendsPaid || 0),
        shareRepurchases: Math.abs(item.repurchaseOfStock || 0),
        debtRepayment: Math.abs(item.repaymentOfDebt || 0),
        netBorrowings: item.netBorrowings || 0,
      }));

      return { income, balance, cashFlow };
    } catch (error) {
      console.error('Error fetching Yahoo financials:', error);
      return { income: [], balance: [], cashFlow: [] };
    }
  }

  /**
   * Get historical prices
   */
  async getHistoricalPrices(symbol: string, days: number = 365): Promise<number[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const result = await yahooFinance.historical(symbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d',
      });
      
      if (!result || result.length === 0) {
        return [];
      }

      // Return closing prices in reverse order (most recent first)
      return result.map((item: any) => item.close).filter((p: any) => p !== null).reverse();
    } catch (error) {
      console.error('Error fetching historical prices:', error);
      return [];
    }
  }

  /**
   * Get company profile
   */
  async getProfile(symbol: string): Promise<{ sector: string; industry: string } | null> {
    try {
      const result = await yahooFinance.quoteSummary(symbol, {
        modules: ['assetProfile']
      });
      
      if (!result.assetProfile) {
        return null;
      }

      return {
        sector: result.assetProfile.sector || 'Unknown',
        industry: result.assetProfile.industry || 'Unknown',
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }
}

export const yahooClient = new YahooFinanceClient();
