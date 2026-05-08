import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

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
    
    if (message.image) {
      const imagePath = path.join(process.cwd(), 'public', message.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('Deleted image:', imagePath);
      }
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
