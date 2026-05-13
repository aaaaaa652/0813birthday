import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    
    // 简单的会话验证（实际生产环境应使用更安全的方案）
    // 这里我们验证sessionId是否存在且格式正确
    if (sessionId && sessionId.length > 0) {
      // 在真实应用中，这里应该从数据库或Redis验证session
      // 为简化，我们只检查sessionId是否存在
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ valid: false }, { status: 401 });
    }
  } catch (error) {
    console.error('会话验证 API 错误:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}