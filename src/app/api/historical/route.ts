import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

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
    };
    
    const currentEPS = quote?.epsTrailingTwelveMonths || 0;
    const currentPrice = quote?.regularMarketPrice || 0;
    
    // Calculate a reasonable P/E for fair value (industry average or historical)
    const currentPE = currentEPS > 0 ? currentPrice / currentEPS : 0;
    const fairValuePE = Math.min(Math.max(currentPE * 0.85, 12), 25); // Use 85% of current PE, capped between 12-25
    
    // Calculate fair value based on EPS and fair value P/E
    const baseFairValue = currentEPS > 0 ? currentEPS * fairValuePE : 0;
    const buyZoneMultiplier = 0.75; // 25% discount for buy zone

    // Process historical data
    const chartData: HistoricalDataPoint[] = [];
    
    for (const item of historicalData.quotes) {
      if (item.date && item.close !== null && item.close !== undefined) {
        const date = new Date(item.date);
        const price = item.close;
        
        // Calculate fair value and buy zone for this historical point
        // We use a simplified approach: scale fair value based on price ratio
        const priceRatio = currentPrice > 0 ? price / currentPrice : 1;
        const historicalFairValue = baseFairValue > 0 ? baseFairValue * priceRatio : null;
        const historicalBuyZone = historicalFairValue ? historicalFairValue * buyZoneMultiplier : null;
        
        // Estimate historical P/E
        const historicalPE = currentEPS > 0 ? price / currentEPS : null;
        
        chartData.push({
          date: date.toISOString().split('T')[0],
          price: Math.round(price * 100) / 100,
          fairValue: historicalFairValue ? Math.round(historicalFairValue * 100) / 100 : null,
          buyZone: historicalBuyZone ? Math.round(historicalBuyZone * 100) / 100 : null,
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
    console.error('Historical valuation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch historical data' }, { status: 500 });
  }
}
