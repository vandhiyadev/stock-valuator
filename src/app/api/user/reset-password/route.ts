import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST - Change password (for logged in users)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        success: false, 
        error: 'Current password and new password are required' 
      }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ 
        success: false, 
        error: 'New password must be at least 8 characters' 
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.password) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update password' }, { status: 500 });
  }
}
