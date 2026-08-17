import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/admin-session';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    
    if (validateAdminSession(sessionId)) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ valid: false }, { status: 401 });
  } catch (error) {
    console.error('会话验证 API 错误:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
