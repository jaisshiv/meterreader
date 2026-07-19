import mongoose, { Schema, Model } from 'mongoose';

// ─── DB Connection (cached for serverless) ─────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var _mongoCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

if (!global._mongoCache) {
  global._mongoCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (global._mongoCache.conn) return global._mongoCache.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable not set');
  if (!global._mongoCache.promise) {
    global._mongoCache.promise = mongoose.connect(uri, { bufferCommands: false });
  }
  global._mongoCache.conn = await global._mongoCache.promise;
  return global._mongoCache.conn;
}

// ─── User Model ─────────────────────────────────────────────────────────────
export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  walletAddress?: string;
  address?: string;
  utilityAccountNumber?: string;
  role: string;
  utilityStates: { electricity: boolean; water: boolean; gas: boolean };
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: String,
  email: { type: String, unique: true, index: true },
  phone: String,
  password: String,
  walletAddress: String,
  address: String,
  utilityAccountNumber: String,
  role: { type: String, default: 'customer' },
  utilityStates: {
    electricity: { type: Boolean, default: true },
    water: { type: Boolean, default: true },
    gas: { type: Boolean, default: true },
  },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', userSchema);
