import { NextResponse } from 'next/server';
import { successResponse } from '@/lib/api-response';

export async function GET() {
  return NextResponse.json(successResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }));
}
