import { NextRequest, NextResponse } from 'next/server';
import { connectDB, UserModel } from '@/lib/db';

export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    const totalUsers = await UserModel.countDocuments({ role: { $ne: 'admin' } });

    return NextResponse.json({
      metrics: [
        { label: 'Live meters',              value: '3.2K',  trend: '+14%' },
        { label: 'AI alerts',               value: '148',   trend: '+9%'  },
        { label: 'Blockchain verifications', value: '97.4%', trend: '+2.1%' },
        { label: 'Revenue uplift',           value: '$84K',  trend: '+11%' },
      ],
      alerts: [
        { id: 1, title: 'Water leak near Aurora District',    level: 'high'   },
        { id: 2, title: 'Power anomaly detected on feeder 12', level: 'medium' },
        { id: 3, title: 'Gas pressure drop — Zone C',         level: 'low'    },
      ],
      totalUsers,
    });
  } catch {
    // If DB not connected, return static data
    return NextResponse.json({
      metrics: [
        { label: 'Live meters',              value: '3.2K',  trend: '+14%' },
        { label: 'AI alerts',               value: '148',   trend: '+9%'  },
        { label: 'Blockchain verifications', value: '97.4%', trend: '+2.1%' },
        { label: 'Revenue uplift',           value: '$84K',  trend: '+11%' },
      ],
      alerts: [
        { id: 1, title: 'Water leak near Aurora District',    level: 'high'   },
        { id: 2, title: 'Power anomaly detected on feeder 12', level: 'medium' },
        { id: 3, title: 'Gas pressure drop — Zone C',         level: 'low'    },
      ],
      totalUsers: 0,
    });
  }
}
