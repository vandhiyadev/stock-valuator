/**
 * Stock Search API Route
 * GET /api/search?q=apple
 * 
 * Returns matching stocks from US (NYSE/NASDAQ) and India NSE
 */

import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    console.log(`Searching for: ${query}`);

    // Use Yahoo Finance search
    const results = await yahooFinance.search(query, {
      quotesCount: 15,
      newsCount: 0,
    });

    // Filter and format results - include US and NSE exchanges
    const stocks = (results.quotes || [])
      .filter((quote: any) => {
        const isStock = quote.quoteType === 'EQUITY';
        const isETF = quote.quoteType === 'ETF';
        
        // US exchanges
        const usExchanges = ['NYQ', 'NMS', 'NGM', 'NCM', 'NYSE', 'NASDAQ', 'PCX', 'ASE'];
        const isUS = usExchanges.includes(quote.exchange);
        
        // India NSE
        const isNSE = quote.exchange === 'NSI' || quote.symbol?.endsWith('.NS');
        
        return (isStock || isETF) && (isUS || isNSE);
      })
      .slice(0, 10)
      .map((quote: any) => {
        // Determine market
        const isNSE = quote.exchange === 'NSI' || quote.symbol?.endsWith('.NS');
        const market = isNSE ? 'NSE' : 'US';
        const flag = isNSE ? '🇮🇳' : '🇺🇸';
        const currency = isNSE ? '₹' : '$';
        
        return {
          symbol: quote.symbol,
          name: quote.shortname || quote.longname || quote.symbol,
          exchange: quote.exchange,
          market,
          flag,
          currency,
          type: quote.quoteType,
        };
      });

    return NextResponse.json({
      success: true,
      results: stocks,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Search failed',
    });
  }
}
