import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    console.log('GET /api/uploads/:filename called');
    console.log('请求的文件名:', filename);
    
    // 安全检查：只允许字母、数字、连字符、下划线和点
    const safeFilename = filename.replace(/[^a-zA-Z0-9\-_.]/g, '');
    if (safeFilename !== filename) {
      console.log('❌ 文件名包含非法字符，已拒绝');
      return new NextResponse('Invalid filename', { status: 400 });
    }
    
    const filePath = path.join(UPLOADS_DIR, safeFilename);
    console.log('完整文件路径:', filePath);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.log('❌ 文件不存在:', filePath);
      return new NextResponse('File not found', { status: 404 });
    }
    
    // 读取文件
    const fileBuffer = fs.readFileSync(filePath);
    const fileStats = fs.statSync(filePath);
    console.log('文件大小:', fileStats.size, 'bytes');
    
    // 根据扩展名确定 Content-Type
    const ext = path.extname(safeFilename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.bmp') {
      contentType = 'image/bmp';
    }
    
    console.log('✅ 文件读取成功，Content-Type:', contentType);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStats.size.toString(),
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('❌ 读取文件失败:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
