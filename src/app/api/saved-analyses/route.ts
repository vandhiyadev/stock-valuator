import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET - Fetch user's saved analyses
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const analyses = await prisma.savedAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { savedAt: 'desc' },
      take: 50, // Limit to 50 most recent
    });

    return NextResponse.json({ success: true, analyses });
  } catch (error) {
    console.error('Error fetching saved analyses:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch analyses' }, { status: 500 });
  }
}

// POST - Save a new analysis
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check limits based on tier
    const limits: Record<string, number> = {
      free: 5,
      basic: 25,
      pro: 100,
      admin: Infinity,
    };

    const maxSaved = limits[user.tier] || 5;
    
    if (maxSaved !== Infinity) {
      const currentCount = await prisma.savedAnalysis.count({
        where: { userId: user.id },
      });

      if (currentCount >= maxSaved) {
        return NextResponse.json({
          success: false,
          error: `You've reached your limit of ${maxSaved} saved analyses. Upgrade to save more!`,
        }, { status: 400 });
      }
    }

    const body = await request.json();
    const { symbol, name, data, notes } = body;

    if (!symbol || !data) {
      return NextResponse.json({ success: false, error: 'Symbol and data are required' }, { status: 400 });
    }

    // Check if already saved (update if exists)
    const existing = await prisma.savedAnalysis.findFirst({
      where: { userId: user.id, symbol },
    });

    if (existing) {
      const updated = await prisma.savedAnalysis.update({
        where: { id: existing.id },
        data: {
          name,
          data: JSON.stringify(data),
          notes,
          savedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, analysis: updated, updated: true });
    }

    const analysis = await prisma.savedAnalysis.create({
      data: {
        userId: user.id,
        symbol,
        name,
        data: JSON.stringify(data),
        notes,
      },
    });

    return NextResponse.json({ success: true, analysis, created: true });
  } catch (error) {
    console.error('Error saving analysis:', error);
    return NextResponse.json({ success: false, error: 'Failed to save analysis' }, { status: 500 });
  }
}

// DELETE - Remove a saved analysis
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { id, symbol } = body;

    if (id) {
      await prisma.savedAnalysis.deleteMany({
        where: { id, userId: user.id },
      });
    } else if (symbol) {
      await prisma.savedAnalysis.deleteMany({
        where: { symbol, userId: user.id },
      });
    } else {
      return NextResponse.json({ success: false, error: 'ID or symbol required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete analysis' }, { status: 500 });
  }
}
