import { NextRequest, NextResponse } from 'next/server';
import { connectDB, UserModel } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// POST /api/admin/toggle — admin toggles any user's utility
export async function POST(request: NextRequest) {
  const payload = verifyToken(request);
  if (!payload || payload.role !== 'admin')
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const { userId, utility } = await request.json();
    if (!userId || !['electricity', 'water', 'gas'].includes(utility))
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });

    await connectDB();
    const user = await UserModel.findById(userId);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const current = user.utilityStates?.[utility as 'electricity' | 'water' | 'gas'] ?? true;
    const newState = !current;

    await UserModel.findByIdAndUpdate(userId, {
      $set: { [`utilityStates.${utility}`]: newState },
    });

    return NextResponse.json({ userId, utility, state: newState });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
