"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

function getImageFormatFromMagic(bytes: Uint8Array): { format: string | null; mimeType: string | null } {
  if (bytes.length < 12) {
    return { format: null, mimeType: null };
  }

  const uint8 = bytes;

  // JPEG: FF D8 FF
  if (uint8[0] === 0xFF && uint8[1] === 0xD8 && uint8[2] === 0xFF) {
    return { format: 'jpeg', mimeType: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47
  if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47) {
    return { format: 'png', mimeType: 'image/png' };
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (uint8[0] === 0x52 && uint8[1] === 0x49 && uint8[2] === 0x46 && uint8[3] === 0x46 &&
      uint8[8] === 0x57 && uint8[9] === 0x45 && uint8[10] === 0x42 && uint8[11] === 0x50) {
    return { format: 'webp', mimeType: 'image/webp' };
  }

  // HEIF/HEIC/AVIF: ftyp box at offset 4
  if (uint8[4] === 0x66 && uint8[5] === 0x74 && uint8[6] === 0x79 && uint8[7] === 0x70) {
    const brand = String.fromCharCode(uint8[8], uint8[9], uint8[10], uint8[11]);
    if (brand.startsWith('heic') || brand.startsWith('mif1') || brand.startsWith('heix') || brand.startsWith('hevc')) {
      return { format: 'heic', mimeType: 'image/heic' };
    }
    if (brand.startsWith('heif') || brand.startsWith('avif')) {
      return { format: 'heif', mimeType: 'image/heif' };
    }
  }

  // GIF: 47 49 46 38
  if (uint8[0] === 0x47 && uint8[1] === 0x49 && uint8[2] === 0x46 && uint8[3] === 0x38) {
    return { format: 'gif', mimeType: 'image/gif' };
  }

  // BMP: 42 4D
  if (uint8[0] === 0x42 && uint8[1] === 0x4D) {
    return { format: 'bmp', mimeType: 'image/bmp' };
  }

  return { format: null, mimeType: null };
}

function ConfirmModal({ onClose, onConfirm, loading }: { onClose: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-xl border border-white/60 overflow-hidden">
        <h3 className="text-lg sm:text-xl font-medium text-[#253040] mb-4 text-center">
          留言前的小提醒
        </h3>
        
        <div className="text-[#5a6a7a] text-xs sm:text-sm leading-relaxed space-y-3 mb-6">
          <p>这里是歌迷朋友留下心意的地方。</p>
          <p>请尽量留下真诚、友善、温柔的留言。</p>
          <p className="font-medium text-[#4a6a8a]">为了让这里保持安静和干净，请不要发布：</p>
          <ul className="list-none space-y-1.5 pl-2">
            <li className="flex items-start gap-2">
              <span className="text-[#a8c5d9] mt-0.5">·</span>
              <span>CP向内容</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#a8c5d9] mt-0.5">·</span>
              <span>谣言或不实信息</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#a8c5d9] mt-0.5">·</span>
              <span>攻击、引战或阴阳怪气内容</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#a8c5d9] mt-0.5">·</span>
              <span>涉及隐私的信息</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#a8c5d9] mt-0.5">·</span>
              <span>与宋老师无关的内容</span>
            </li>
          </ul>
          <p className="text-[#7a8a9a] text-xs">不合适的留言可能会被管理员删除。</p>
        </div>

        <div className="flex gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-3 py-2.5 rounded-xl border border-[#a8c5d9] text-[#5a7a94] text-xs sm:text-sm font-medium hover:bg-[rgba(168,197,217,0.1)] transition-all disabled:opacity-50"
          >
            返回修改
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#7faacc] to-[#a8c5d9] text-white text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-[rgba(127,172,204,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                提交中...
              </>
            ) : (
              '我已知晓，确认提交'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessagePage() {
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) {
      setSelectedFile(null);
      setImagePreview(null);
      return;
    }

    console.log('========== 前端图片选择日志 ==========');
    console.log('文件名:', file.name);
    console.log('文件大小:', file.size, 'bytes');
    console.log('MIME类型:', file.type);
    
    const fileBuffer = await file.slice(0, 32).arrayBuffer();
    const bytes = new Uint8Array(fileBuffer);
    console.log('文件头部字节:', Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
    
    const { format, mimeType } = getImageFormatFromMagic(bytes);
    console.log('魔数检测结果 - format:', format, 'mimeType:', mimeType);
    
    if (format === 'heic' || format === 'heif') {
      console.log('❌ 检测到HEIC/HEIF格式，已阻止');
      setError('当前图片格式暂不支持，请关闭手机"高效图片/HEIF"后重新上传，或转换为 JPG 后上传');
      target.value = '';
      return;
    }
    
    if (!format || !mimeType) {
      console.log('❌ 无法识别图片格式');
      setError('无法识别图片格式，请上传 jpg、jpeg、png 或 webp 格式');
      target.value = '';
      return;
    }
    
    if (format !== 'jpeg' && format !== 'png' && format !== 'webp') {
      console.log('❌ 不支持的格式:', format);
      setError('图片格式不支持，请上传 jpg、jpeg、png 或 webp 格式');
      target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      console.log('❌ 文件大小超过限制');
      setError('图片大小超过限制，请上传 5MB 以内的图片');
      target.value = '';
      return;
    }

    let correctExt = '';
    if (format === 'jpeg') correctExt = '.jpg';
    else if (format === 'png') correctExt = '.png';
    else if (format === 'webp') correctExt = '.webp';
    
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const correctFileName = correctExt ? `${baseName}${correctExt}` : file.name;
    console.log('修正后的文件名:', correctFileName);
    
    const renamedFile = new File([file], correctFileName, { type: mimeType });
    
    setSelectedFile(renamedFile);
    setError('');
    console.log('✅ 图片选择通过，等待提交');
    console.log('========================================');
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const MAX_NICKNAME_LENGTH = 12;
  const MAX_CONTENT_LENGTH = 500;

  const validateForm = () => {
    if (!nickname.trim()) {
      setError("请输入昵称");
      return false;
    }
    
    if (nickname.length > MAX_NICKNAME_LENGTH) {
      setError(`昵称不能超过 ${MAX_NICKNAME_LENGTH} 个字符`);
      return false;
    }
    
    if (!content.trim()) {
      setError("请输入祝福内容");
      return false;
    }
    
    if (content.length > MAX_CONTENT_LENGTH) {
      setError(`留言内容不能超过 ${MAX_CONTENT_LENGTH} 个字`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (validateForm()) {
      setShowConfirm(true);
    }
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('nickname', nickname.trim());
      formData.append('content', content.trim());
      
      if (selectedFile) {
        formData.append('image', selectedFile, selectedFile.name);
      }
      
      const res = await fetch('/api/messages', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || '提交失败');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setSelectedFile(null);
  };

  return (
    <div className="min-h-screen relative bg-[#f5f9fc] overflow-x-hidden">
      <div className="atmosphere-glow" />

      <div className="absolute top-[-50px] left-[-50px] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-[rgba(168,197,217,0.18)] rounded-full blur-[100px] sm:blur-[120px]" />
      <div className="absolute bottom-[-40px] right-[-40px] w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] bg-[rgba(196,213,227,0.15)] rounded-full blur-[80px] sm:blur-[100px]" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-lg mx-auto">
          <div className="glass-card rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-12 sm:w-16 h-px bg-gradient-to-r from-transparent via-[#a8c5d9] to-transparent mx-auto mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-medium text-[#253040] tracking-wide">
                留下你的祝福
              </h2>
              <div className="w-12 sm:w-16 h-px bg-gradient-to-r from-transparent via-[#a8c5d9] to-transparent mx-auto mt-3 sm:mt-4" />
            </div>

            {showSuccess ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#a8c5d9] to-[#7faacc] flex items-center justify-center">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[#4a6a8a] text-base sm:text-lg font-light">提交成功</p>
                <p className="text-[#7a8a9a] text-sm mt-2">即将返回祝福墙...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-[#5a7a94] text-sm font-medium mb-2">昵称</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      setError("");
                    }}
                    placeholder="请输入你的昵称"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[rgba(255,255,255,0.6)] border border-[rgba(255,255,255,0.4)] text-[#253040] placeholder-[#a0aec0] focus:outline-none focus:border-[#a8c5d9] focus:ring-1 focus:ring-[#a8c5d9] transition-all text-sm sm:text-base"
                    maxLength={MAX_NICKNAME_LENGTH}
                  />
                </div>

                <div>
                  <label className="block text-[#5a7a94] text-sm font-medium mb-2">祝福内容</label>
                  <textarea
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      setError("");
                    }}
                    placeholder="写下你想说的话..."
                    rows={4}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[rgba(255,255,255,0.6)] border border-[rgba(255,255,255,0.4)] text-[#253040] placeholder-[#a0aec0] focus:outline-none focus:border-[#a8c5d9] focus:ring-1 focus:ring-[#a8c5d9] transition-all resize-none text-sm sm:text-base"
                    maxLength={MAX_CONTENT_LENGTH}
                  />
                  <div className="text-right text-xs text-[#a0aec0] mt-1">{content.length}/{MAX_CONTENT_LENGTH}</div>
                </div>

                <div>
                  <label className="block text-[#5a7a94] text-sm font-medium mb-2">上传图片（可选）</label>
                  <div className="relative">
                    {imagePreview ? (
                      <div className="relative rounded-xl overflow-hidden bg-[rgba(255,255,255,0.4)]">
                        <div className="aspect-[4/3]">
                          <Image
                            src={imagePreview}
                            alt="预览"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-28 sm:h-32 border-2 border-dashed border-[#c5d6e3] rounded-xl hover:border-[#a8c5d9] hover:bg-[rgba(168,197,217,0.1)] transition-all">
                        <div className="flex flex-col items-center justify-center pt-3 sm:pt-4">
                          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#a8c5d9] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs sm:text-sm text-[#7a8a9a]">点击上传图片（可选）</p>
                          <p className="text-[10px] sm:text-xs text-[#a0aec0] mt-1">支持 jpg / jpeg / png / webp，5MB 以内</p>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      style={{ minHeight: '112px' }}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-[#e57373] text-xs sm:text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {error}
                  </div>
                )}

                <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
                  <Link
                    href="/"
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-[#a8c5d9] text-[#5a7a94] text-xs sm:text-sm font-medium hover:bg-[rgba(168,197,217,0.1)] transition-all text-center"
                  >
                    返回祝福墙
                  </Link>
                  <button
                    type="submit"
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#7faacc] to-[#a8c5d9] text-white text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-[rgba(127,172,204,0.3)] transition-all flex items-center justify-center gap-2"
                  >
                    提交祝福
                  </button>
                </div>
              </form>
            )}
          </div>

          <footer className="text-center text-[#a0aec0] text-xs mt-8">
            <p>Made with care</p>
          </footer>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal 
          onClose={() => setShowConfirm(false)} 
          onConfirm={handleConfirmSubmit}
          loading={loading}
        />
      )}
    </div>
  );
}
