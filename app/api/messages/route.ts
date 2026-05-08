import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

interface Message {
  id: number;
  nickname: string;
  content: string;
  avatar: string;
  time: string;
  image: string | null;
  createdAt: string;
}

function readMessages(): Message[] {
  try {
    if (!fs.existsSync(MESSAGES_FILE)) {
      console.log('Messages file not found:', MESSAGES_FILE);
      return [];
    }
    const data = fs.readFileSync(MESSAGES_FILE, 'utf-8');
    const json = JSON.parse(data);
    return json.messages || [];
  } catch (error) {
    console.error('Error reading messages:', error);
    return [];
  }
}

function writeMessages(messages: Message[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify({ messages }, null, 2));
  } catch (error) {
    console.error('Error writing messages:', error);
  }
}

export async function GET() {
  console.log('GET /api/messages called');
  let messages = readMessages();
  // 按时间倒序排序，优先使用 time 字段
  messages = messages.sort((a, b) => {
    const parseTime = (msg: Message) => {
      const timeStr = msg.time || msg.createdAt;
      if (!timeStr) return 0;
      // 处理 "YYYY-MM-DD HH:MM" 格式
      if (timeStr.includes('-') && timeStr.includes(':') && !timeStr.includes('T')) {
        const [datePart, timePart] = timeStr.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute] = timePart.split(':').map(Number);
        return new Date(year, month - 1, day, hour, minute).getTime();
      }
      return new Date(timeStr).getTime();
    };
    const timeA = parseTime(a);
    const timeB = parseTime(b);
    if (timeB !== timeA) return timeB - timeA;
    return b.id - a.id;
  });
  console.log('Messages found:', messages.length);
  return new NextResponse(JSON.stringify(messages), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    console.log('POST /api/messages called');
    
    // List all form data entries
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File - ${value.name}, ${value.size} bytes, ${value.type}`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
    
    const nickname = formData.get('nickname') as string;
    const content = formData.get('content') as string;
    const imageFile = formData.get('image') as File | null;
    
    console.log('Extracted values:');
    console.log('Nickname:', nickname);
    console.log('Content:', content?.substring(0, 50) + (content?.length > 50 ? '...' : ''));
    console.log('Image file:', imageFile);
    console.log('Image size:', imageFile?.size);
    console.log('Image name:', imageFile?.name);
    console.log('Image type:', imageFile?.type);
    
    if (!nickname?.trim()) {
      return NextResponse.json({ error: '昵称不能为空' }, { status: 400 });
    }
    
    if (!content?.trim()) {
      return NextResponse.json({ error: '留言内容不能为空' }, { status: 400 });
    }
    
    const messages = readMessages();
    const maxId = messages.length > 0 ? Math.max(...messages.map(m => m.id)) : 0;
    
    let imagePath: string | null = null;
    
    if (imageFile && imageFile.size > 0 && imageFile.name) {
      const originalFileName = imageFile.name;
      const originalMimeType = imageFile.type || 'unknown';
      console.log('原始文件名:', originalFileName);
      console.log('原始MIME类型:', originalMimeType);
      
      // 后端二次校验 MIME 类型
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const unsupportedMimeTypes = ['image/heic', 'image/heif', 'image/avif', 'image/hif', 'image/heics', 'image/heif-sequence'];
      
      if (unsupportedMimeTypes.includes(originalMimeType)) {
        console.log('检测到不支持的HEIF/HEIC格式，已阻止上传');
        return NextResponse.json({ error: '当前图片格式暂不支持，请关闭手机"高效图片/HEIF"后重新上传，或转换为 JPG 后上传' }, { status: 400 });
      }
      
      if (!allowedMimeTypes.includes(originalMimeType)) {
        console.log('MIME类型不在允许列表中，已拒绝');
        return NextResponse.json({ error: '不支持的图片格式，请上传 jpg、jpeg、png 或 webp 格式' }, { status: 400 });
      }
      
      // 根据真实 MIME 类型生成正确的扩展名
      let correctExt = '';
      if (originalMimeType === 'image/jpeg') correctExt = '.jpg';
      else if (originalMimeType === 'image/png') correctExt = '.png';
      else if (originalMimeType === 'image/webp') correctExt = '.webp';
      
      if (!correctExt) {
        console.log('无法识别MIME类型对应的扩展名');
        return NextResponse.json({ error: '不支持的图片格式，请上传 jpg、jpeg、png 或 webp 格式' }, { status: 400 });
      }
      
      const filename = `${uuidv4()}${correctExt}`;
      const filePath = path.join(UPLOADS_DIR, filename);
      const savedPath = `/uploads/${filename}`;
      
      console.log('最终保存文件名:', filename);
      console.log('保存路径:', savedPath);
      
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        console.log('创建上传目录完成');
      }
      
      try {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        imagePath = savedPath;
        console.log('图片上传保存成功');
      } catch (saveError) {
        console.error('图片保存失败:', saveError);
        return NextResponse.json({ error: '图片保存失败' }, { status: 500 });
      }
    }
    
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newMessage: Message = {
      id: maxId + 1,
      nickname,
      content,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${nickname}${Date.now()}`,
      time: timeStr,
      image: imagePath,
      createdAt: now.toISOString()
    };
    
    messages.unshift(newMessage);
    writeMessages(messages);
    
    console.log('Message saved successfully');
    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
