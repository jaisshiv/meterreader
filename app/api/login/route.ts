import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB, UserModel } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email, password, walletAddress } = await request.json();

    let user;

    if (walletAddress) {
      // Wallet login flow
      user = await UserModel.findOne({ walletAddress });
      if (!user) {
        return NextResponse.json({ message: 'No user registered with this wallet address' }, { status: 404 });
      }
    } else {
      // Standard email login flow
      if (!email || !password) {
        return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
      }
      user = await UserModel.findOne({ email: email.toLowerCase() });
      if (!user) {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      }
    }

    const token = signToken({ id: String(user._id), role: user.role, email: user.email || '' });
    return NextResponse.json({
      token,
      user: { id: String(user._id), name: user.name, role: user.role, email: user.email },
    });
  } catch (err: any) {
    return NextResponse.json({ message: 'Login failed', error: err.message }, { status: 500 });
  }
}
