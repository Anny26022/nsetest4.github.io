import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      message: "Test API endpoint is working",
      timestamp: new Date().toISOString()
    }
  });
}
