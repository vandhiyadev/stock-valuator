import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

// Initialize Yahoo Finance client (required for v3.x)
const yahooFinance = new YahooFinance();

interface PeerStock {
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
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  priceToBook: number;
}

// Sector-based peer mapping for Indian and US stocks
const SECTOR_PEERS: Record<string, string[]> = {
  // Technology
  'Technology': ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'AMZN'],
  'Information Technology': ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS', 'LTIM.NS'],
  'Software': ['MSFT', 'CRM', 'ORCL', 'ADBE', 'NOW', 'INTU'],
  
  // Financial
  'Financial Services': ['HDFCBANK.NS', 'ICICIBANK.NS', 'KOTAKBANK.NS', 'SBIN.NS', 'AXISBANK.NS', 'INDUSINDBK.NS'],
  'Financials': ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C'],
  'Banks': ['JPM', 'BAC', 'WFC', 'USB', 'PNC', 'TFC'],
  
  // Healthcare  
  'Healthcare': ['UNH', 'JNJ', 'PFE', 'ABBV', 'MRK', 'LLY'],
  'Pharmaceuticals': ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'BIOCON.NS', 'LUPIN.NS'],
  
  // Consumer
  'Consumer Defensive': ['HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'DABUR.NS', 'MARICO.NS', 'PG', 'KO', 'PEP', 'WMT', 'COST', 'PM'],
  'Consumer Cyclical': ['AMZN', 'TSLA', 'HD', 'NKE', 'MCD', 'SBUX'],
  'Fast Moving Consumer Goods': ['HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'DABUR.NS', 'MARICO.NS'],
  'Tobacco': ['ITC.NS', 'PM', 'MO', 'BTI', 'GODFRYPHLP.NS', 'VST.NS'],
  
  // Energy
  'Energy': ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PXD'],
  'Oil & Gas': ['RELIANCE.NS', 'ONGC.NS', 'BPCL.NS', 'IOC.NS', 'GAIL.NS', 'PETRONET.NS'],
  
  // Industrial
  'Industrials': ['CAT', 'DE', 'UPS', 'HON', 'BA', 'GE'],
  'Manufacturing': ['LT.NS', 'SIEMENS.NS', 'ABB.NS', 'HAVELLS.NS', 'BHEL.NS', 'THERMAX.NS'],
  
  // Materials
  'Materials': ['LIN', 'APD', 'ECL', 'SHW', 'DD', 'NEM'],
  'Metals & Mining': ['TATASTEEL.NS', 'JSWSTEEL.NS', 'HINDALCO.NS', 'COALINDIA.NS', 'VEDL.NS', 'NMDC.NS'],
  
  // Automobiles
  'Automobile': ['MARUTI.NS', 'TATAMOTORS.NS', 'M&M.NS', 'BAJAJ-AUTO.NS', 'HEROMOTOCO.NS', 'EICHERMOT.NS'],
  'Auto Manufacturers': ['TSLA', 'GM', 'F', 'TM', 'HMC', 'RIVN'],
  
  // Telecom
  'Communication Services': ['GOOGL', 'META', 'DIS', 'NFLX', 'T', 'VZ'],
  'Telecom': ['BHARTIARTL.NS', 'RELIANCE.NS', 'IDEA.NS'],
  
  // Real Estate
  'Real Estate': ['DLF.NS', 'GODREJPROP.NS', 'OBEROIRLTY.NS', 'PRESTIGE.NS', 'BRIGADE.NS'],
  
  // Utilities
  'Utilities': ['NEE', 'DUK', 'SO', 'D', 'AEP', 'EXC'],
  'Power': ['NTPC.NS', 'POWERGRID.NS', 'TATAPOWER.NS', 'ADANIPOWER.NS', 'JSW.NS'],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const sector = searchParams.get('sector');
    const industry = searchParams.get('industry');

    if (!symbol) {
      return NextResponse.json({ success: false, error: 'Symbol required' }, { status: 400 });
    }

    // Determine peer list based on sector/industry
    let peerSymbols: string[] = [];
    
    // Check industry first, then sector
    if (industry && SECTOR_PEERS[industry]) {
      peerSymbols = SECTOR_PEERS[industry];
    } else if (sector && SECTOR_PEERS[sector]) {
      peerSymbols = SECTOR_PEERS[sector];
    } else {
      // Default to some major stocks
      peerSymbols = symbol.includes('.NS') 
        ? ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS']
        : ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];
    }

    // Remove the current symbol from peers
    peerSymbols = peerSymbols.filter(s => s.toUpperCase() !== symbol.toUpperCase());
    
    // Limit to 5 peers
    peerSymbols = peerSymbols.slice(0, 5);

    // Fetch peer data
    const peerData: PeerStock[] = [];
    
    for (const peerSymbol of peerSymbols) {
      try {
        const quote = await yahooFinance.quote(peerSymbol) as {
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
          fiftyTwoWeekHigh?: number;
          fiftyTwoWeekLow?: number;
          priceToBook?: number;
        } | null;
        
        if (quote) {
          peerData.push({
            symbol: quote.symbol || peerSymbol,
            name: quote.shortName || quote.longName || peerSymbol,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            marketCap: quote.marketCap || 0,
            pe: quote.trailingPE || 0,
            forwardPE: quote.forwardPE || 0,
            eps: quote.epsTrailingTwelveMonths || 0,
            dividendYield: quote.dividendYield || 0,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
            priceToBook: quote.priceToBook || 0,
          });
        }
      } catch (err) {
        console.error(`Error fetching peer ${peerSymbol}:`, err);
        // Continue with other peers
      }
    }

    // Calculate averages for comparison
    const avgPE = peerData.reduce((sum, p) => sum + (p.pe || 0), 0) / peerData.filter(p => p.pe > 0).length || 0;
    const avgForwardPE = peerData.reduce((sum, p) => sum + (p.forwardPE || 0), 0) / peerData.filter(p => p.forwardPE > 0).length || 0;
    const avgDividendYield = peerData.reduce((sum, p) => sum + (p.dividendYield || 0), 0) / peerData.filter(p => p.dividendYield > 0).length || 0;
    const avgPriceToBook = peerData.reduce((sum, p) => sum + (p.priceToBook || 0), 0) / peerData.filter(p => p.priceToBook > 0).length || 0;

    return NextResponse.json({
      success: true,
      symbol,
      sector,
      industry,
      peers: peerData,
      averages: {
        pe: avgPE,
        forwardPE: avgForwardPE,
        dividendYield: avgDividendYield,
        priceToBook: avgPriceToBook,
      },
    });
  } catch (error) {
    console.error('Peer comparison error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch peer data' }, { status: 500 });
  }
}
