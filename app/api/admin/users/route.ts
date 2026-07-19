import { NextRequest, NextResponse } from 'next/server';
import { connectDB, UserModel } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/users — admin only: all users + their utility states
export async function GET(request: NextRequest) {
  const payload = verifyToken(request);
  if (!payload || payload.role !== 'admin')
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    await connectDB();
    const users = await UserModel.find({}).select('-password').lean();

    const result = users.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      address: u.address || '',
      utilityAccountNumber: u.utilityAccountNumber || '',
      states: u.utilityStates ?? { electricity: true, water: true, gas: true },
    }));

    return NextResponse.json({ users: result });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
