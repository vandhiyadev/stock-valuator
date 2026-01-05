/**
 * Usage Tracking API
 * Tracks and limits analyses per day based on user tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Daily limits by tier
const DAILY_LIMITS: Record<string, number> = {
  admin: 999999, // Unlimited for admin (using large number since Infinity becomes null in JSON)
  free: 5,
  basic: 50,
  pro: 500,
};

// Get today's date in YYYY-MM-DD format
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// Check if user can perform analysis
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      // Allow anonymous users limited access
      return NextResponse.json({
        success: true,
        canAnalyze: true,
        remaining: 3,
        limit: 3,
        tier: 'anonymous',
      });
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

    const today = getToday();
    const limit = DAILY_LIMITS[user.tier] || 5;

    // Get or create usage record for today
    const usage = await prisma.usage.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
    });

    const used = usage?.count || 0;
    const remaining = Math.max(0, limit - used);

    return NextResponse.json({
      success: true,
      canAnalyze: remaining > 0,
      remaining,
      limit,
      used,
      tier: user.tier,
    });
  } catch (error) {
    console.error('Usage GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check usage' },
      { status: 500 }
    );
  }
}

// Increment usage count
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      // Anonymous users - tracked via IP/session (simplified for now)
      return NextResponse.json({ success: true });
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

    const today = getToday();
    const limit = DAILY_LIMITS[user.tier] || 5;

    // Upsert usage record
    const usage = await prisma.usage.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        userId: user.id,
        date: today,
        count: 1,
      },
    });

    const remaining = Math.max(0, limit - usage.count);

    return NextResponse.json({
      success: true,
      remaining,
      limit,
      used: usage.count,
    });
  } catch (error) {
    console.error('Usage POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}
