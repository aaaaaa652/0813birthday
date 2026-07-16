import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readCards, writeCards } from '@/data/store';
import type { Card } from '@/data/types';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

function validateSession(request: Request): boolean {
  const sessionId = request.headers.get('x-session-id');
  return !!sessionId && sessionId.length > 0;
}

export async function GET(request: Request) {
  if (!validateSession(request)) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  const cards = readCards().filter(c => !c.isDeleted);
  cards.sort((a, b) => a.sortOrder - b.sortOrder || b.id - a.id);
  
  return NextResponse.json(cards);
}

export async function POST(request: Request) {
  if (!validateSession(request)) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    
    const imageFile = formData.get('image') as File | null;
    const lyric = formData.get('lyric') as string;
    const blessing = formData.get('blessing') as string;
    const source = formData.get('source') as string;
    const imagePosition = formData.get('imagePosition') as string;
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;
    const status = (formData.get('status') as string) || 'enabled';

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: '请上传图片' }, { status: 400 });
    }

    if (!blessing?.trim()) {
      return NextResponse.json({ error: '祝福词不能为空' }, { status: 400 });
    }

    let imagePath = '';
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
        return NextResponse.json({ error: '不支持的图片格式，请上传 jpg、jpeg、png 或 webp 格式' }, { status: 400 });
      }

      const ext = detectedFormat === 'jpeg' ? '.jpg' : `.${detectedFormat}`;
      const now = new Date();
      const timestamp = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      const randomStr = Math.random().toString(36).substring(2, 8);
      const filename = `${timestamp}_${randomStr}${ext}`;
      const filePath = path.join(UPLOADS_DIR, filename);
      
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      
      fs.writeFileSync(filePath, fileBuffer);
      imagePath = `/api/uploads/${filename}`;
    }

    const cards = readCards();
    const maxId = cards.length > 0 ? Math.max(...cards.map(c => c.id)) : 0;
    const now = new Date().toISOString();

    const newCard: Card = {
      id: maxId + 1,
      image: imagePath,
      imagePosition: imagePosition || 'center center',
      lyric: lyric ? lyric.split('\n').filter(l => l.trim()) : [],
      blessing: blessing.trim(),
      source: source?.trim() || '',
      status: status === 'enabled' ? 'enabled' : 'disabled',
      sortOrder,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    cards.push(newCard);
    writeCards(cards);

    return NextResponse.json({ success: true, card: newCard });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}