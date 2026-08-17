import { NextResponse } from 'next/server';
import { createAdminSession } from '@/lib/admin-session';

// 防爆破配置
const MAX_FAILED_ATTEMPTS = 5; // 最大失败次数
const BAN_DURATION = 10 * 60 * 1000; // 封禁时长：10分钟（毫秒）

// 存储IP失败记录 { ip: { attempts: number, lastAttempt: number, banUntil: number } }
const ipFailedAttempts = new Map<string, { attempts: number; lastAttempt: number; banUntil: number }>();

// 清理过期的封禁记录
function cleanupExpiredBans() {
  const now = Date.now();
  for (const [ip, record] of ipFailedAttempts.entries()) {
    if (record.banUntil > 0 && now > record.banUntil) {
      ipFailedAttempts.delete(ip);
    }
  }
}

// 获取客户端IP
function getClientIP(request: Request): string {
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  return clientIP.split(',')[0]?.trim() || clientIP;
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const ip = getClientIP(request);
    const now = Date.now();
    
    // 清理过期的封禁记录
    cleanupExpiredBans();
    
    // 从环境变量获取密码
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    
    if (!ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD 环境变量未设置');
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }
    
    // 获取该IP的失败记录
    const record = ipFailedAttempts.get(ip);
    
    // 检查是否被封禁
    if (record && record.banUntil > 0 && now < record.banUntil) {
      const remainingMinutes = Math.ceil((record.banUntil - now) / 60000);
      console.log(`========== 登录防爆破日志 ==========`);
      console.log(`IP: ${ip}`);
      console.log(`状态: 已封禁`);
      console.log(`剩余封禁时间: ${remainingMinutes} 分钟`);
      console.log(`===================================`);
      return NextResponse.json({ 
        error: `登录尝试过于频繁，请 ${remainingMinutes} 分钟后再试`,
        remainingMinutes 
      }, { status: 429 });
    }
    
    // 验证密码
    if (password === ADMIN_PASSWORD) {
      // 验证成功，清除该IP的失败记录
      ipFailedAttempts.delete(ip);
      const sessionId = createAdminSession();
      console.log(`========== 登录成功日志 ==========`);
      console.log(`IP: ${ip}`);
      console.log(`状态: 登录成功`);
      console.log(`===================================`);
      return NextResponse.json({ success: true, sessionId });
    } else {
      // 密码错误，记录失败次数
      const currentRecord = record || { attempts: 0, lastAttempt: 0, banUntil: 0 };
      const newAttempts = currentRecord.attempts + 1;
      const newBanUntil = newAttempts >= MAX_FAILED_ATTEMPTS ? now + BAN_DURATION : 0;
      
      ipFailedAttempts.set(ip, {
        attempts: newAttempts,
        lastAttempt: now,
        banUntil: newBanUntil
      });
      
      console.log(`========== 登录失败日志 ==========`);
      console.log(`IP: ${ip}`);
      console.log(`状态: 密码错误`);
      console.log(`失败次数: ${newAttempts}/${MAX_FAILED_ATTEMPTS}`);
      if (newBanUntil > 0) {
        console.log(`已触发封禁，封禁时长: 10 分钟`);
      }
      console.log(`===================================`);
      
      if (newBanUntil > 0) {
        return NextResponse.json({ 
          error: '登录尝试过于频繁，请 10 分钟后再试',
          remainingMinutes: 10 
        }, { status: 429 });
      }
      
      return NextResponse.json({ error: '管理员密码不正确' }, { status: 401 });
    }
  } catch (error) {
    console.error('管理员验证 API 错误:', error);
    return NextResponse.json({ error: '请求错误' }, { status: 500 });
  }
}
