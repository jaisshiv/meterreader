import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'gridchain-dev-secret';

export interface TokenPayload { id: string; role: string; email: string; }

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(req: NextRequest): TokenPayload | null {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as TokenPayload; }
  catch { return null; }
}
