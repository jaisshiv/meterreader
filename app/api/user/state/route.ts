import { NextRequest, NextResponse } from 'next/server';
import { connectDB, UserModel } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/user/state — returns utility states + mock consumption for logged-in user
export async function GET(request: NextRequest) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const user = await UserModel.findById(payload.id).select('utilityStates');
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const states = user.utilityStates ?? { electricity: true, water: true, gas: true };
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return NextResponse.json({
      states,
      currentUsage: {
        electricity: { value: +(12 + Math.random() * 6).toFixed(1), unit: 'kWh', bill: +(8 + Math.random() * 5).toFixed(2) },
        water:       { value: +(110 + Math.random() * 50).toFixed(0), unit: 'L',   bill: +(3 + Math.random() * 2).toFixed(2) },
        gas:         { value: +(5 + Math.random() * 4).toFixed(1),   unit: 'm³',  bill: +(6 + Math.random() * 4).toFixed(2) },
      },
      history: {
        electricity: days.map((d) => ({ day: d, value: +(10 + Math.random() * 10).toFixed(1) })),
        water:       days.map((d) => ({ day: d, value: +(100 + Math.random() * 80).toFixed(0) })),
        gas:         days.map((d) => ({ day: d, value: +(4 + Math.random() * 6).toFixed(1) })),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
