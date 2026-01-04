import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.tier !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    // Get all users with counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        createdAt: true,
        _count: {
          select: {
            watchlist: true,
            usage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get stats
    const totalUsers = await prisma.user.count();
    const totalAnalyses = await prisma.usage.count();
    
    // Today's analyses - using date field (YYYY-MM-DD format)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAnalyses = await prisma.usage.count({
      where: {
        date: todayStr,
      },
    });

    // Tier breakdown
    const tierCounts = await prisma.user.groupBy({
      by: ['tier'],
      _count: true,
    });
    const tierBreakdown: Record<string, number> = {};
    tierCounts.forEach((t) => {
      tierBreakdown[t.tier] = t._count;
    });

    return NextResponse.json({
      success: true,
      users,
      stats: {
        totalUsers,
        totalAnalyses,
        todayAnalyses,
        tierBreakdown,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
