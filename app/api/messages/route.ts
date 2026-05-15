import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// IP限流配置
const RATE_LIMIT_WINDOW = 30000; // 30秒
const RATE_LIMIT_MAX_REQUESTS = 1; // 最多1次

// 存储IP访问记录 { ip: lastRequestTime }
const ipAccessRecords = new Map<string, number>();

interface Message {
  id: number;
  nickname: string;
  content: string;
  avatar: string;
  time: string;
  image: string | null;
  createdAt: string;
  isPinned: boolean;
  pinnedAt: string | null;
}

function readMessages(): Message[] {
  try {
    if (!fs.existsSync(MESSAGES_FILE)) {
      console.log('Messages file not found, creating empty file:', MESSAGES_FILE);
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify({ messages: [] }, null, 2));
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

// 检测字符串中是否包含 Emoji
function containsEmoji(str: string): boolean {
  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{200D}]/u;
  return emojiRegex.test(str);
}

export async function GET() {
  console.log('GET /api/messages called');
  let messages = readMessages();
  // 排序规则：
  // 1. 置顶留言（isPinned = true）排在最前
  // 2. 置顶留言按 pinnedAt 倒序
  // 3. 普通留言按 time/createdAt 倒序
  messages = messages.sort((a, b) => {
    // 置顶优先级
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // 都是置顶或都是普通，按对应时间倒序
    if (a.isPinned && b.isPinned) {
      // 置顶留言按 pinnedAt 倒序
      const pinnedAtA = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
      const pinnedAtB = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
      return pinnedAtB - pinnedAtA;
    }
    
    // 普通留言按时间倒序，优先使用 time 字段
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
    // 获取客户端IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const ip = clientIP.split(',')[0]?.trim() || clientIP;
    
    const now = Date.now();
    
    console.log('========== 提交日志 ==========');
    console.log('IP:', ip);
    console.log('提交时间:', new Date(now).toLocaleString('zh-CN'));
    
    // IP限流检查
    const lastRequestTime = ipAccessRecords.get(ip);
    if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_WINDOW) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_WINDOW - (now - lastRequestTime)) / 1000);
      console.log('是否被限流: 是 (剩余', remainingSeconds, '秒)');
      console.log('===============================');
      return NextResponse.json({ 
        error: '留言太快啦，稍微休息一下再发送吧～',
        remainingSeconds 
      }, { status: 429 });
    }
    
    console.log('是否被限流: 否');
    
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
    
    // 检测昵称中是否包含 Emoji
    if (containsEmoji(nickname)) {
      return NextResponse.json({ error: '昵称不能包含表情符号' }, { status: 400 });
    }
    
    if (!content?.trim()) {
      return NextResponse.json({ error: '留言内容不能为空' }, { status: 400 });
    }
    
    // 检查内容是否为纯空格
    if (!content.trim()) {
      return NextResponse.json({ error: '留言内容不能为空' }, { status: 400 });
    }
    
    // 记录IP访问时间（验证通过后记录）
    ipAccessRecords.set(ip, now);
    
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
      
      const now = new Date();
      const timestamp = now.getFullYear() + 
                       String(now.getMonth() + 1).padStart(2, '0') + 
                       String(now.getDate()).padStart(2, '0');
      const randomStr = Math.random().toString(36).substring(2, 8);
      const filename = `${timestamp}_${randomStr}${correctExt}`;
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
    
    const currentDate = new Date();
    const timeStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')} ${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
    
    const newMessage: Message = {
      id: maxId + 1,
      nickname,
      content,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${nickname}${Date.now()}`,
      time: timeStr,
      image: imagePath,
      createdAt: currentDate.toISOString(),
      isPinned: false,
      pinnedAt: null
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

export async function PUT(request: Request) {
  try {
    const { id, isPinned } = await request.json();
    
    const messages = readMessages();
    const messageIndex = messages.findIndex(m => m.id === id);
    
    if (messageIndex === -1) {
      return NextResponse.json({ error: '留言不存在' }, { status: 404 });
    }
    
    const now = new Date().toISOString();
    
    messages[messageIndex] = {
      ...messages[messageIndex],
      isPinned: isPinned,
      pinnedAt: isPinned ? now : null
    };
    
    writeMessages(messages);
    
    return NextResponse.json({ success: true, message: messages[messageIndex] });
  } catch (error) {
    console.error('Error toggling pin:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
