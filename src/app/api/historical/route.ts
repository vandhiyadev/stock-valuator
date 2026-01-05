import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

// Initialize Yahoo Finance client (required for v3.x)
const yahooFinance = new YahooFinance();

interface HistoricalDataPoint {
  date: string;
  price: number;
  fairValue: number | null;
  buyZone: number | null;
  peRatio: number | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const period = searchParams.get('period') || '1y'; // 1m, 3m, 6m, 1y, 2y, 5y

    if (!symbol) {
      return NextResponse.json({ success: false, error: 'Symbol required' }, { status: 400 });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1m':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case '2y':
        startDate.setFullYear(startDate.getFullYear() - 2);
        break;
      case '5y':
        startDate.setFullYear(startDate.getFullYear() - 5);
        break;
      default:
        startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Fetch historical data
    const historicalData = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: period === '1m' ? '1d' : period === '3m' ? '1d' : '1wk',
    }) as {
      quotes?: Array<{
        date?: Date;
        close?: number | null;
      }>;
    };

    if (!historicalData?.quotes || historicalData.quotes.length === 0) {
      return NextResponse.json({ success: false, error: 'No historical data available' }, { status: 404 });
    }

    // Get current financial data for fair value calculation
    const quote = await yahooFinance.quote(symbol) as {
      epsTrailingTwelveMonths?: number;
      regularMarketPrice?: number;
      bookValue?: number;
      priceToBook?: number;
      fiftyTwoWeekHigh?: number;
      fiftyTwoWeekLow?: number;
      trailingPE?: number;
    };
    
    const currentEPS = quote?.epsTrailingTwelveMonths || 0;
    const currentPrice = quote?.regularMarketPrice || 0;
    const bookValue = quote?.bookValue || 0;
    const fiftyTwoWeekHigh = quote?.fiftyTwoWeekHigh || currentPrice;
    const fiftyTwoWeekLow = quote?.fiftyTwoWeekLow || currentPrice;
    
    // Calculate fair value using multiple methods
    let baseFairValue = 0;
    
    if (currentEPS > 0) {
      // Method 1: P/E based (primary)
      const currentPE = currentPrice / currentEPS;
      const fairValuePE = Math.min(Math.max(currentPE * 0.85, 12), 25);
      baseFairValue = currentEPS * fairValuePE;
    } else if (bookValue > 0) {
      // Method 2: Book value based (fallback)
      // For companies with no earnings, use 1.5x book value as fair value
      baseFairValue = bookValue * 1.5;
    } else {
      // Method 3: Price-based estimation (last resort)
      // Use average of 52-week range as a proxy for fair value
      baseFairValue = (fiftyTwoWeekHigh + fiftyTwoWeekLow) / 2;
    }
    
    // Ensure we always have some fair value
    if (baseFairValue <= 0) {
      baseFairValue = currentPrice * 0.85; // 15% discount as basic fair value
    }
    
    const buyZoneMultiplier = 0.75; // 25% discount for buy zone

    // Process historical data
    const chartData: HistoricalDataPoint[] = [];
    
    for (const item of historicalData.quotes) {
      if (item.date && item.close !== null && item.close !== undefined) {
        const date = new Date(item.date);
        const price = item.close;
        
        // Use constant fair value (based on current fundamentals)
        // This shows how price has moved relative to estimated fair value
        const historicalFairValue = baseFairValue;
        const historicalBuyZone = baseFairValue * buyZoneMultiplier;
        
        // Estimate historical P/E
        const historicalPE = currentEPS > 0 ? price / currentEPS : null;
        
        chartData.push({
          date: date.toISOString().split('T')[0],
          price: Math.round(price * 100) / 100,
          fairValue: Math.round(historicalFairValue * 100) / 100,
          buyZone: Math.round(historicalBuyZone * 100) / 100,
          peRatio: historicalPE ? Math.round(historicalPE * 10) / 10 : null,
        });
      }
    }

    // Calculate statistics
    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    const validFairValues = chartData.filter(d => d.fairValue !== null).map(d => d.fairValue!);
    const avgFairValue = validFairValues.length > 0 
      ? validFairValues.reduce((a, b) => a + b, 0) / validFairValues.length 
      : 0;

    // Determine current valuation status
    const latestPrice = chartData[chartData.length - 1]?.price || 0;
    const latestFairValue = chartData[chartData.length - 1]?.fairValue || 0;
    const latestBuyZone = chartData[chartData.length - 1]?.buyZone || 0;
    
    let valuationStatus = 'Fairly Valued';
    if (latestFairValue > 0) {
      if (latestPrice < latestBuyZone) {
        valuationStatus = 'Significantly Undervalued';
      } else if (latestPrice < latestFairValue) {
        valuationStatus = 'Undervalued';
      } else if (latestPrice > latestFairValue * 1.25) {
        valuationStatus = 'Significantly Overvalued';
      } else if (latestPrice > latestFairValue) {
        valuationStatus = 'Overvalued';
      }
    }

    return NextResponse.json({
      success: true,
      symbol,
      period,
      chartData,
      stats: {
        minPrice,
        maxPrice,
        avgPrice: Math.round(avgPrice * 100) / 100,
        avgFairValue: Math.round(avgFairValue * 100) / 100,
        currentPrice: latestPrice,
        currentFairValue: latestFairValue,
        currentBuyZone: latestBuyZone,
        valuationStatus,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Historical valuation error:', errorMessage);
    console.error('Stack:', errorStack);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch historical data',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}
// Deployment trigger: 1767632198
