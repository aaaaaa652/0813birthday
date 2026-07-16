import { NextResponse } from 'next/server';
import { readAnnouncements } from '@/data/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const position = searchParams.get('position') || 'homepage';
  
  const now = new Date().toISOString();
  const announcements = readAnnouncements().filter(a => {
    if (a.isDeleted) return false;
    if (a.status !== 'published') return false;
    if (a.position !== position) return false;
    
    if (a.startTime && a.startTime > now) return false;
    if (a.endTime && a.endTime < now) return false;
    
    return true;
  });

  announcements.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return NextResponse.json({ success: true, announcements }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}