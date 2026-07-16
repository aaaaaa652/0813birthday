import { NextResponse } from 'next/server';
import { readAnnouncements, writeAnnouncements } from '@/data/store';

function validateSession(request: Request): boolean {
  const sessionId = request.headers.get('x-session-id');
  return !!sessionId && sessionId.length > 0;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateSession(request)) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const announcementId = parseInt(id);
    
    if (isNaN(announcementId)) {
      return NextResponse.json({ error: '无效的公告ID' }, { status: 400 });
    }

    const announcements = readAnnouncements();
    const announcementIndex = announcements.findIndex(a => a.id === announcementId && !a.isDeleted);
    
    if (announcementIndex === -1) {
      return NextResponse.json({ error: '公告不存在' }, { status: 404 });
    }

    const { title, content, position, status, isPinned, startTime, endTime } = await request.json();
    const now = new Date().toISOString();
    const targetAnnouncement = announcements[announcementIndex];

    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json({ error: '公告标题不能为空' }, { status: 400 });
      }
      targetAnnouncement.title = title.trim();
    }

    if (content !== undefined) {
      if (!content.trim()) {
        return NextResponse.json({ error: '公告内容不能为空' }, { status: 400 });
      }
      targetAnnouncement.content = content.trim();
    }

    if (startTime !== undefined && endTime !== undefined && startTime > endTime) {
      return NextResponse.json({ error: '开始时间不能晚于结束时间' }, { status: 400 });
    }

    if (position !== undefined) {
      targetAnnouncement.position = position as 'homepage' | 'message' | 'popup';
    }

    if (status !== undefined) {
      targetAnnouncement.status = status as 'draft' | 'published' | 'disabled';
    }

    if (isPinned !== undefined) {
      targetAnnouncement.isPinned = isPinned;
    }

    if (startTime !== undefined) {
      targetAnnouncement.startTime = startTime || null;
    }

    if (endTime !== undefined) {
      targetAnnouncement.endTime = endTime || null;
    }

    targetAnnouncement.updatedAt = now;
    writeAnnouncements(announcements);

    return NextResponse.json({ success: true, announcement: targetAnnouncement });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateSession(request)) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const announcementId = parseInt(id);
    
    if (isNaN(announcementId)) {
      return NextResponse.json({ error: '无效的公告ID' }, { status: 400 });
    }

    const announcements = readAnnouncements();
    const announcementIndex = announcements.findIndex(a => a.id === announcementId && !a.isDeleted);
    
    if (announcementIndex === -1) {
      return NextResponse.json({ error: '公告不存在' }, { status: 404 });
    }

    announcements[announcementIndex].isDeleted = true;
    announcements[announcementIndex].updatedAt = new Date().toISOString();
    writeAnnouncements(announcements);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}