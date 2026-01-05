import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import YahooFinance from 'yahoo-finance2';

// Initialize Yahoo Finance client (required for v3.x)
const yahooFinance = new YahooFinance();

// GET - Fetch user's portfolio
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { portfolio: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Fetch current prices for portfolio items
    const portfolioWithPrices = await Promise.all(
      user.portfolio.map(async (item) => {
        try {
          const quote = await yahooFinance.quote(item.symbol) as {
            regularMarketPrice?: number;
            regularMarketChange?: number;
            regularMarketChangePercent?: number;
          } | null;
          
          const currentPrice = quote?.regularMarketPrice || 0;
          const currentValue = currentPrice * item.quantity;
          const costBasis = item.avgCost * item.quantity;
          const gainLoss = currentValue - costBasis;
          const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
          
          return {
            id: item.id,
            symbol: item.symbol,
            name: item.name,
            quantity: item.quantity,
            avgCost: item.avgCost,
            currentPrice,
            currentValue,
            costBasis,
            gainLoss,
            gainLossPercent,
            dayChange: quote?.regularMarketChange || 0,
            dayChangePercent: quote?.regularMarketChangePercent || 0,
          };
        } catch (err) {
          console.error(`Error fetching ${item.symbol}:`, err);
          return {
            id: item.id,
            symbol: item.symbol,
            name: item.name,
            quantity: item.quantity,
            avgCost: item.avgCost,
            currentPrice: 0,
            currentValue: 0,
            costBasis: item.avgCost * item.quantity,
            gainLoss: 0,
            gainLossPercent: 0,
            dayChange: 0,
            dayChangePercent: 0,
          };
        }
      })
    );

    // Calculate totals
    const totalValue = portfolioWithPrices.reduce((sum, item) => sum + item.currentValue, 0);
    const totalCost = portfolioWithPrices.reduce((sum, item) => sum + item.costBasis, 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return NextResponse.json({
      success: true,
      portfolio: portfolioWithPrices,
      summary: {
        totalValue,
        totalCost,
        totalGainLoss,
        totalGainLossPercent,
        holdings: portfolioWithPrices.length,
      },
    });
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}

// POST - Add to portfolio
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { symbol, name, quantity, avgCost } = await request.json();

    if (!symbol || quantity <= 0 || avgCost <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check if stock already exists in portfolio
    const existing = await prisma.portfolio.findFirst({
      where: { userId: user.id, symbol: symbol.toUpperCase() },
    });

    if (existing) {
      // Update existing - calculate new average cost
      const totalQuantity = existing.quantity + quantity;
      const totalCost = (existing.quantity * existing.avgCost) + (quantity * avgCost);
      const newAvgCost = totalCost / totalQuantity;

      await prisma.portfolio.update({
        where: { id: existing.id },
        data: {
          quantity: totalQuantity,
          avgCost: newAvgCost,
        },
      });
    } else {
      // Create new
      await prisma.portfolio.create({
        data: {
          userId: user.id,
          symbol: symbol.toUpperCase(),
          name: name || symbol,
          quantity,
          avgCost,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Portfolio add error:', error);
    return NextResponse.json({ success: false, error: 'Failed to add to portfolio' }, { status: 500 });
  }
}

// DELETE - Remove from portfolio
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    await prisma.portfolio.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Portfolio delete error:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove from portfolio' }, { status: 500 });
  }
}
