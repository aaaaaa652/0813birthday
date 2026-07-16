import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readCards, writeCards } from '@/data/store';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

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
    const cardId = parseInt(id);
    
    if (isNaN(cardId)) {
      return NextResponse.json({ error: '无效的卡片ID' }, { status: 400 });
    }

    const cards = readCards();
    const cardIndex = cards.findIndex(c => c.id === cardId && !c.isDeleted);
    
    if (cardIndex === -1) {
      return NextResponse.json({ error: '卡片不存在' }, { status: 404 });
    }

    const formData = await request.formData();
    const card = cards[cardIndex];
    const now = new Date().toISOString();

    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
      const fileBuffer = Buffer.from(await imageFile.arrayBuffer());
      const bytes = fileBuffer.slice(0, 32);
      
      let detectedFormat: string | null = null;
      
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        detectedFormat = 'jpeg';
      } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        detectedFormat = 'png';
      } else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
                 bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        detectedFormat = 'webp';
      }

      if (!detectedFormat) {
        return NextResponse.json({ error: '不支持的图片格式' }, { status: 400 });
      }

      const ext = detectedFormat === 'jpeg' ? '.jpg' : `.${detectedFormat}`;
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomStr = Math.random().toString(36).substring(2, 8);
      const filename = `${timestamp}_${randomStr}${ext}`;
      const filePath = path.join(UPLOADS_DIR, filename);
      
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      
      fs.writeFileSync(filePath, fileBuffer);
      card.image = `/api/uploads/${filename}`;
    }

    const lyric = formData.get('lyric') as string;
    if (lyric !== undefined) {
      card.lyric = lyric ? lyric.split('\n').filter(l => l.trim()) : [];
    }

    const blessing = formData.get('blessing') as string;
    if (blessing !== undefined) {
      if (!blessing.trim()) {
        return NextResponse.json({ error: '祝福词不能为空' }, { status: 400 });
      }
      card.blessing = blessing.trim();
    }

    const source = formData.get('source') as string;
    if (source !== undefined) {
      card.source = source?.trim() || '';
    }

    const imagePosition = formData.get('imagePosition') as string;
    if (imagePosition !== undefined) {
      card.imagePosition = imagePosition || 'center center';
    }

    const sortOrder = formData.get('sortOrder') as string;
    if (sortOrder !== undefined) {
      card.sortOrder = parseInt(sortOrder) || 0;
    }

    const status = formData.get('status') as string;
    if (status !== undefined) {
      card.status = status === 'enabled' ? 'enabled' : 'disabled';
    }

    card.updatedAt = now;
    writeCards(cards);

    return NextResponse.json({ success: true, card });
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateSession(request)) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const cardId = parseInt(id);
    
    if (isNaN(cardId)) {
      return NextResponse.json({ error: '无效的卡片ID' }, { status: 400 });
    }

    const cards = readCards();
    const cardIndex = cards.findIndex(c => c.id === cardId && !c.isDeleted);
    
    if (cardIndex === -1) {
      return NextResponse.json({ error: '卡片不存在' }, { status: 404 });
    }

    cards[cardIndex].isDeleted = true;
    cards[cardIndex].updatedAt = new Date().toISOString();
    writeCards(cards);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}