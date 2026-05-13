import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
}

function readMessages(): Message[] {
  try {
    if (!fs.existsSync(MESSAGES_FILE)) {
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
    }
    
    const { sessionId } = body;
    
    // 简单的会话验证
    if (!sessionId || sessionId.length === 0) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    const { id } = await params;
    const messageId = parseInt(id);
    
    if (isNaN(messageId)) {
      return NextResponse.json({ error: '无效的留言ID' }, { status: 400 });
    }
    
    const messages = readMessages();
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex === -1) {
      return NextResponse.json({ error: '留言不存在' }, { status: 404 });
    }
    
    const message = messages[messageIndex];
    
    // 删除关联的图片文件
    if (message.image) {
      // 从 /api/uploads/xxx.jpg 提取文件名
      const filename = message.image.replace('/api/uploads/', '');
      const imagePath = path.join(UPLOADS_DIR, filename);
      
      console.log('========== 删除图片日志 ==========');
      console.log('message.image:', message.image);
      console.log('提取的文件名:', filename);
      console.log('完整图片路径:', imagePath);
      
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log('✅ 图片文件已删除:', imagePath);
        } catch (deleteError) {
          console.error('❌ 删除图片文件失败:', deleteError);
        }
      } else {
        console.log('⚠️ 图片文件不存在，跳过删除:', imagePath);
      }
      console.log('===================================');
    }
    
    messages.splice(messageIndex, 1);
    writeMessages(messages);
    
    console.log('Message deleted successfully:', messageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}