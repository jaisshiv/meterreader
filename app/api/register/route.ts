import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB, UserModel } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { name, email, phone, password, walletAddress, address, utilityAccountNumber, role } = await request.json();

    if (!name || !email || !password)
      return NextResponse.json({ message: 'Name, email, and password are required' }, { status: 400 });

    const existing = await UserModel.findOne({ email });
    if (existing)
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      name, email, phone, password: hashed,
      walletAddress, address, utilityAccountNumber,
      role: role || 'customer',
    });

    const token = signToken({ id: String(user._id), role: user.role, email: user.email });
    return NextResponse.json(
      { token, user: { id: String(user._id), name: user.name, role: user.role, email: user.email } },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ message: 'Registration failed', error: err.message }, { status: 500 });
  }
}
