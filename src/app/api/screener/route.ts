import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

interface ScreenedStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  pe: number;
  forwardPE: number;
  eps: number;
  dividendYield: number;
  sector: string;
  valuationScore: number; // 0-100, higher = more undervalued
}

// Popular stocks to screen
const STOCK_LISTS = {
  // US Large Cap
  'us-largecap': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'BRK-B', 'JPM', 'V', 'JNJ', 'UNH', 'HD', 'PG', 'MA', 'DIS', 'NFLX', 'ADBE', 'CRM', 'PYPL'],
  
  // US Tech
  'us-tech': ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'AMZN', 'TSLA', 'ADBE', 'CRM', 'ORCL', 'INTC', 'AMD', 'QCOM', 'CSCO', 'NOW', 'UBER', 'SQ', 'SHOP', 'SNOW', 'PLTR'],
  
  // US Financial
  'us-financial': ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'USB', 'PNC', 'TFC', 'COF', 'AXP', 'BLK', 'SCHW', 'CME', 'ICE', 'SPGI', 'MCO', 'MMC', 'AON', 'CB'],
  
  // India Nifty 50
  'india-nifty50': ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS', 'LT.NS', 'AXISBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS', 'TITAN.NS', 'SUNPHARMA.NS', 'BAJFINANCE.NS', 'WIPRO.NS', 'HCLTECH.NS', 'ULTRACEMCO.NS'],
  
  // India IT
  'india-it': ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS', 'LTIM.NS', 'MPHASIS.NS', 'COFORGE.NS', 'PERSISTENT.NS', 'MINDTREE.NS'],
  
  // India Banks
  'india-banks': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 'INDUSINDBK.NS', 'FEDERALBNK.NS', 'BANDHANBNK.NS', 'IDFCFIRSTB.NS', 'AUBANK.NS'],
};

// Screening criteria
type ScreeningCriteria = {
  maxPE?: number;
  minDividendYield?: number;
  maxMarketCap?: number;
  minMarketCap?: number;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const list = searchParams.get('list') || 'us-largecap';
    const sortBy = searchParams.get('sortBy') || 'valuationScore';
    const maxPE = searchParams.get('maxPE') ? Number(searchParams.get('maxPE')) : undefined;
    const minDividendYield = searchParams.get('minDividendYield') ? Number(searchParams.get('minDividendYield')) : undefined;

    const criteria: ScreeningCriteria = {
      maxPE,
      minDividendYield,
    };

    // Get stock list
    const symbols = STOCK_LISTS[list as keyof typeof STOCK_LISTS] || STOCK_LISTS['us-largecap'];

    // Fetch data for all symbols
    const screenedStocks: ScreenedStock[] = [];

    for (const symbol of symbols) {
      try {
        const quote = await yahooFinance.quote(symbol) as {
          symbol?: string;
          shortName?: string;
          longName?: string;
          regularMarketPrice?: number;
          regularMarketChange?: number;
          regularMarketChangePercent?: number;
          marketCap?: number;
          trailingPE?: number;
          forwardPE?: number;
          epsTrailingTwelveMonths?: number;
          dividendYield?: number;
          sector?: string;
        } | null;

        if (quote) {
          const pe = quote.trailingPE || 0;
          const forwardPE = quote.forwardPE || 0;
          const dividendYield = quote.dividendYield || 0;

          // Apply filters
          if (criteria.maxPE && pe > criteria.maxPE) continue;
          if (criteria.minDividendYield && dividendYield < criteria.minDividendYield) continue;

          // Calculate valuation score (0-100, higher = more undervalued)
          let valuationScore = 50; // Start at neutral
          
          // PE scoring (lower is better)
          if (pe > 0 && pe < 10) valuationScore += 25;
          else if (pe >= 10 && pe < 15) valuationScore += 20;
          else if (pe >= 15 && pe < 20) valuationScore += 10;
          else if (pe >= 20 && pe < 25) valuationScore += 0;
          else if (pe >= 25 && pe < 35) valuationScore -= 10;
          else if (pe >= 35) valuationScore -= 20;
          
          // Forward PE vs Trailing PE (if forward is lower, positive momentum)
          if (forwardPE > 0 && pe > 0) {
            if (forwardPE < pe * 0.8) valuationScore += 15; // Forward PE is much lower
            else if (forwardPE < pe) valuationScore += 5;
            else if (forwardPE > pe * 1.2) valuationScore -= 10; // Forward PE is higher (slowing)
          }
          
          // Dividend yield bonus
          if (dividendYield > 0.04) valuationScore += 10;
          else if (dividendYield > 0.02) valuationScore += 5;
          
          // Cap score between 0-100
          valuationScore = Math.max(0, Math.min(100, valuationScore));

          screenedStocks.push({
            symbol: quote.symbol || symbol,
            name: quote.shortName || quote.longName || symbol,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            marketCap: quote.marketCap || 0,
            pe: pe,
            forwardPE: forwardPE,
            eps: quote.epsTrailingTwelveMonths || 0,
            dividendYield: dividendYield,
            sector: quote.sector || 'Unknown',
            valuationScore,
          });
        }
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err);
        // Continue with other stocks
      }
    }

    // Sort results
    if (sortBy === 'valuationScore') {
      screenedStocks.sort((a, b) => b.valuationScore - a.valuationScore);
    } else if (sortBy === 'pe') {
      screenedStocks.sort((a, b) => (a.pe || 999) - (b.pe || 999));
    } else if (sortBy === 'dividendYield') {
      screenedStocks.sort((a, b) => b.dividendYield - a.dividendYield);
    } else if (sortBy === 'changePercent') {
      screenedStocks.sort((a, b) => b.changePercent - a.changePercent);
    } else if (sortBy === 'marketCap') {
      screenedStocks.sort((a, b) => b.marketCap - a.marketCap);
    }

    return NextResponse.json({
      success: true,
      list,
      count: screenedStocks.length,
      stocks: screenedStocks,
      availableLists: Object.keys(STOCK_LISTS),
    });
  } catch (error) {
    console.error('Screener error:', error);
    return NextResponse.json({ success: false, error: 'Failed to screen stocks' }, { status: 500 });
  }
}
