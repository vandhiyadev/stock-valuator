import { NextResponse } from 'next/server';
import { yahooClient } from '@/lib/api/yahoo-client';

export async function GET() {
  try {
    // Test basic quote
    const quote = await yahooClient.getBasicQuote('AAPL');
    
    // Test chart data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const chart = await yahooClient.getChart('AAPL', startDate, endDate, '1d');
    
    return NextResponse.json({
      success: true,
      quoteAvailable: !!quote,
      quotePrice: (quote as any)?.regularMarketPrice,
      chartAvailable: !!chart,
      chartDataPoints: chart?.quotes?.length || 0,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
