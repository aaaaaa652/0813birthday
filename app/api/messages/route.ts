import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

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
      const fileSize = imageFile.size;
      
      console.log('========== 图片上传日志 ==========');
      console.log('原始文件名:', originalFileName);
      console.log('原始MIME类型:', originalMimeType);
      console.log('文件大小:', fileSize, 'bytes');
      
      const fileBuffer = Buffer.from(await imageFile.arrayBuffer());
      const bytes = fileBuffer.slice(0, 32);
      
      console.log('文件头部字节:', Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      let detectedFormat: string | null = null;
      let detectedMimeType: string | null = null;
      
      // JPEG: FF D8 FF
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        detectedFormat = 'jpeg';
        detectedMimeType = 'image/jpeg';
        console.log('格式检测: JPEG (通过魔数 FF D8 FF)');
      }
      // PNG: 89 50 4E 47
      else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        detectedFormat = 'png';
        detectedMimeType = 'image/png';
        console.log('格式检测: PNG (通过魔数 89 50 4E 47)');
      }
      // WebP: 52 49 46 46 ... 57 45 42 50
      else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
               bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        detectedFormat = 'webp';
        detectedMimeType = 'image/webp';
        console.log('格式检测: WebP (通过魔数 52 49 46 46 ... 57 45 42 50)');
      }
      // HEIF/HEIC: ftyp box
      else if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
        const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
        console.log('ftyp brand:', brand);
        if (brand.startsWith('heic') || brand.startsWith('mif1') || brand.startsWith('heix') || brand.startsWith('hevc')) {
          detectedFormat = 'heic';
          detectedMimeType = 'image/heic';
          console.log('格式检测: HEIC (通过ftyp brand)');
        } else if (brand.startsWith('heif') || brand.startsWith('avif')) {
          detectedFormat = 'heif';
          detectedMimeType = 'image/heif';
          console.log('格式检测: HEIF (通过ftyp brand)');
        } else {
          console.log('格式检测: 未知ftyp brand -', brand);
        }
      }
      // GIF: 47 49 46 38
      else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
        detectedFormat = 'gif';
        detectedMimeType = 'image/gif';
        console.log('格式检测: GIF (通过魔数 47 49 46 38)');
      }
      // BMP: 42 4D
      else if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
        detectedFormat = 'bmp';
        detectedMimeType = 'image/bmp';
        console.log('格式检测: BMP (通过魔数 42 4D)');
      }
      else {
        console.log('格式检测: 未知格式，无法识别');
      }
      
      console.log('检测结果 - format:', detectedFormat, 'mimeType:', detectedMimeType);
      
      // HEIF/HEIC 拒绝
      if (detectedFormat === 'heic' || detectedFormat === 'heif') {
        console.log('结果: ❌ 检测到不支持的HEIF/HEIC格式，已阻止上传');
        console.log('===================================');
        return NextResponse.json({ error: '当前图片格式暂不支持，请关闭手机"高效图片/HEIF"后重新上传，或转换为 JPG 后上传' }, { status: 400 });
      }
      
      // 无法识别格式
      if (!detectedFormat || !detectedMimeType) {
        console.log('结果: ❌ 无法识别图片格式，已拒绝');
        console.log('===================================');
        return NextResponse.json({ error: '无法识别图片格式，请上传 jpg、jpeg、png 或 webp 格式' }, { status: 400 });
      }
      
      // 不支持的格式
      if (detectedFormat !== 'jpeg' && detectedFormat !== 'png' && detectedFormat !== 'webp') {
        console.log('结果: ❌ 检测到不支持的格式，已拒绝');
        console.log('===================================');
        return NextResponse.json({ error: '不支持的图片格式，请上传 jpg、jpeg、png 或 webp 格式' }, { status: 400 });
      }
      
      let correctExt = '';
      if (detectedFormat === 'jpeg') correctExt = '.jpg';
      else if (detectedFormat === 'png') correctExt = '.png';
      else if (detectedFormat === 'webp') correctExt = '.webp';
      
      const filename = `${uuidv4()}${correctExt}`;
      const filePath = path.join(UPLOADS_DIR, filename);
      const savedPath = `/api/uploads/${filename}`;
      
      console.log('生成文件名:', filename);
      console.log('保存路径:', savedPath);
      
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        console.log('创建上传目录完成');
      }
      
      try {
        const writeResult = fs.writeFileSync(filePath, fileBuffer);
        console.log('文件写入结果:', writeResult);
        console.log('文件是否已保存:', fs.existsSync(filePath));
        console.log('保存文件大小:', fs.statSync(filePath).size, 'bytes');
        
        imagePath = savedPath;
        console.log('结果: ✅ 图片上传保存成功');
        console.log('imagePath:', imagePath);
        console.log('写入messages.json的image字段:', imagePath);
      } catch (saveError) {
        console.error('结果: ❌ 图片保存失败:', saveError);
        console.log('===================================');
        return NextResponse.json({ error: '图片保存失败' }, { status: 500 });
      }
      console.log('===================================');
    } else {
      console.log('========== 图片上传日志 ==========');
      console.log('未选择图片或图片为空');
      console.log('imageFile:', imageFile);
      console.log('imageFile?.size:', imageFile?.size);
      console.log('imageFile?.name:', imageFile?.name);
      console.log('结果: 跳过图片上传');
      console.log('===================================');
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
