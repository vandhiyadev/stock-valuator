/**
 * Stock Analysis API Route
 * GET /api/analyze?symbol=AAPL
 * 
 * Now uses Yahoo Finance API (no API key required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeStock } from '@/lib/api/stock-analysis';

export async function GET(request: NextRequest) {
  try {

    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Validate symbol format
    // Supports: US stocks (AAPL), Indian NSE (RELIANCE.NS), BSE (RELIANCE.BO), 
    // London (VOD.L), etc.
    const cleanSymbol = symbol.toUpperCase().trim();
    if (!/^[A-Z0-9]{1,20}(\.[A-Z]{1,3})?$/.test(cleanSymbol)) {
      return NextResponse.json(
        { success: false, error: 'Invalid symbol format. Use formats like: AAPL, RELIANCE.NS, TCS.BO' },
        { status: 400 }
      );
    }

    console.log(`Analyzing stock: ${cleanSymbol}`);

    const analysis = await analyzeStock(cleanSymbol);

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: `Could not analyze ${cleanSymbol}. Check if the symbol is valid.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
