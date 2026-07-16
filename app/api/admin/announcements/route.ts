import { NextResponse } from 'next/server';
import { readAnnouncements, writeAnnouncements } from '@/data/store';
import type { Announcement } from '@/data/types';

function validateSession(request: Request): boolean {
  const sessionId = request.headers.get('x-session-id');
  return !!sessionId && sessionId.length > 0;
}

export async function GET(request: Request) {
  if (!validateSession(request)) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  const announcements = readAnnouncements().filter(a => !a.isDeleted);
  announcements.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  
  return NextResponse.json(announcements);
}

export async function POST(request: Request) {
  if (!validateSession(request)) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  try {
    const { title, content, position, status, isPinned, startTime, endTime } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: '公告标题不能为空' }, { status: 400 });
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: '公告内容不能为空' }, { status: 400 });
    }

    if (startTime && endTime && startTime > endTime) {
      return NextResponse.json({ error: '开始时间不能晚于结束时间' }, { status: 400 });
    }

    const announcements = readAnnouncements();
    const maxId = announcements.length > 0 ? Math.max(...announcements.map(a => a.id)) : 0;
    const now = new Date().toISOString();

    const newAnnouncement: Announcement = {
      id: maxId + 1,
      title: title.trim(),
      content: content.trim(),
      position: (position as Announcement['position']) || 'homepage',
      status: (status as Announcement['status']) || 'draft',
      isPinned: isPinned || false,
      startTime: startTime || null,
      endTime: endTime || null,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    announcements.push(newAnnouncement);
    writeAnnouncements(announcements);

    return NextResponse.json({ success: true, announcement: newAnnouncement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}