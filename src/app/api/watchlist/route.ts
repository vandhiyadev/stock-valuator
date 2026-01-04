/**
 * Watchlist API Routes
 * GET /api/watchlist - Get user's watchlist
 * POST /api/watchlist - Add stock to watchlist
 * DELETE /api/watchlist - Remove stock from watchlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Get user's watchlist
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        watchlist: {
          orderBy: { addedAt: 'desc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      watchlist: user?.watchlist || [],
    });
  } catch (error) {
    console.error('Watchlist GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

// Add stock to watchlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { symbol, name, exchange } = await request.json();

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { watchlist: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check watchlist limit based on tier (admin has no limits)
    const limits: Record<string, number> = {
      admin: Infinity,
      free: 10,
      basic: 50,
      pro: 200,
    };
    const limit = limits[user.tier] || 10;

    if (user.tier !== 'admin' && user.watchlist.length >= limit) {
      return NextResponse.json(
        { success: false, error: `Watchlist limit reached (${limit} stocks). Upgrade to add more.` },
        { status: 403 }
      );
    }

    // Add to watchlist
    const watchlistItem = await prisma.watchlist.upsert({
      where: {
        userId_symbol: {
          userId: user.id,
          symbol: symbol.toUpperCase(),
        },
      },
      update: {
        name,
        exchange,
      },
      create: {
        userId: user.id,
        symbol: symbol.toUpperCase(),
        name,
        exchange,
      },
    });

    return NextResponse.json({
      success: true,
      item: watchlistItem,
    });
  } catch (error) {
    console.error('Watchlist POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}

// Remove from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { symbol } = await request.json();

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    await prisma.watchlist.deleteMany({
      where: {
        userId: user.id,
        symbol: symbol.toUpperCase(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Removed from watchlist',
    });
  } catch (error) {
    console.error('Watchlist DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}
