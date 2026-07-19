import { NextRequest, NextResponse } from 'next/server';
import { connectDB, UserModel } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// POST /api/user/toggle — toggle own utility on/off
export async function POST(request: NextRequest) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { utility } = await request.json();
    if (!['electricity', 'water', 'gas'].includes(utility))
      return NextResponse.json({ message: 'Invalid utility' }, { status: 400 });

    await connectDB();
    const user = await UserModel.findById(payload.id);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const current = user.utilityStates?.[utility as 'electricity' | 'water' | 'gas'] ?? true;
    const newState = !current;

    await UserModel.findByIdAndUpdate(payload.id, {
      $set: { [`utilityStates.${utility}`]: newState },
    });

    return NextResponse.json({ utility, state: newState });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
