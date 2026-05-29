"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import AmbientBubble from "@/components/AmbientBubble";
import MemoryEcho from "@/components/MemoryEcho";

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

// 柔和的纯色头像颜色方案
const AVATAR_COLORS = [
  '#FFB6C1', // 浅粉色
  '#A5D8FF', // 浅蓝色
  '#FFD591', // 浅黄色
  '#95DE64', // 浅绿色
  '#BDB2FF', // 浅紫色
  '#FFC6A5', // 浅橙色
];

// 根据昵称生成固定颜色（同一个昵称始终返回同一颜色）
function getAvatarColor(nickname: string): string {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    const char = nickname.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// 获取昵称首字符
function getAvatarInitial(nickname: string): string {
  if (!nickname || nickname.length === 0) return '?';
  
  // 处理中文昵称
  const firstChar = nickname.charAt(0);
  if (/[\u4e00-\u9fa5]/.test(firstChar)) {
    return firstChar;
  }
  
  // 处理英文昵称（取首字母大写）
  return firstChar.toUpperCase();
}

// 纯色圆形头像组件
function Avatar({ nickname, size = 'sm' }: { nickname: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const color = getAvatarColor(nickname);
  const initial = getAvatarInitial(nickname);
  
  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm',
    md: 'w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base',
    lg: 'w-12 h-12 text-base',
  };
  
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium text-white flex-shrink-0`}
      style={{ backgroundColor: color }}
    >
      {initial}
    </div>
  );
}

function MessageCard({ message, index, onClick }: { message: Message; index: number; onClick: (message: Message) => void }) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 animate-fade-in-up relative"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => onClick(message)}
    >
      {/* 置顶标识 */}
      {message.isPinned && (
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-orange-500 text-white text-[10px] rounded-full flex items-center gap-1 z-10 shadow-sm">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          置顶
        </div>
      )}
      
      {/* 图片区域 - 保持原比例 */}
      {message.image && (
        <div className="relative w-full">
          <img
            src={message.image}
            alt="祝福图片"
            className="w-full object-cover"
            style={{ width: '100%', display: 'block' }}
            onError={(e) => {
              console.error('❌ 卡片图片加载失败 - message.id:', message.id, 'src:', message.image);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
            onLoad={() => {
              console.log('✅ 卡片图片加载成功 - message.id:', message.id, 'src:', message.image);
            }}
          />
        </div>
      )}
      
      {/* 内容区域 */}
      <div className="p-3 sm:p-4">
        {/* 用户信息 */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar nickname={message.nickname} size="sm" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-800 text-xs sm:text-sm truncate">{message.nickname}</h3>
            <span className="text-[10px] text-gray-400">{message.time}</span>
          </div>
        </div>
        
        {/* 留言内容 - 根据是否有图片动态调整行数 */}
        <p className={`serif-text text-xs sm:text-sm leading-relaxed whitespace-pre-wrap overflow-hidden
          ${message.image 
            ? 'line-clamp-2 sm:line-clamp-3' 
            : 'line-clamp-3 sm:line-clamp-4'
          }`}
        >
          {message.content}
        </p>
        
        {/* 底部提示 */}
        <div className="mt-3 pt-3 border-t border-gray-50">
          <span className="text-[10px] text-gray-400">点击查看详情</span>
        </div>
      </div>
    </div>
  );
}

function ImagePreviewModal({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  useEffect(() => {
    // 禁止页面滚动
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 半透明背景 */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors z-10"
      >
        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      {/* 图片 */}
      <div className="relative z-10 max-w-[95vw] max-h-[90vh] sm:max-w-[90vw] sm:max-h-[85vh]">
        <img
          src={imageUrl}
          alt="预览图片"
          className="max-w-full max-h-[90vh] sm:max-h-[85vh] object-contain rounded-lg shadow-2xl"
          style={{ maxWidth: '95vw', maxHeight: '90vh' }}
        />
      </div>
    </div>
  );
}

function MessageDetailModal({ message, onClose, onImageClick }: { message: Message; onClose: () => void; onImageClick: (imageUrl: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl p-4 sm:p-5 max-w-sm sm:max-w-md w-full max-h-[90vh] sm:max-h-[85vh] shadow-xl border border-white/70 overflow-hidden flex flex-col">
        {/* 置顶标识 */}
        {message.isPinned && (
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 px-2 py-0.5 bg-orange-500 text-white text-[10px] rounded-full flex items-center gap-1 z-10">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            置顶
          </div>
        )}
        
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 flex-shrink-0">
          <Avatar nickname={message.nickname} size="md" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-medium text-gray-800 truncate">{message.nickname}</h3>
            <p className="text-[10px] sm:text-xs text-gray-500">{message.time}</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1 min-h-0">
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
            <p className="serif-text leading-relaxed text-xs sm:text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
        
        {message.image && (
          <div className="flex-shrink-0 mb-3 sm:mb-4">
            <div className="rounded-xl overflow-hidden bg-white border border-gray-100 cursor-pointer" onClick={() => message.image && onImageClick(message.image)}>
              <img
                src={message.image}
                alt="图片"
                className="w-full max-h-[200px] sm:max-h-[280px] object-contain"
                style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
                onError={(e) => {
                  console.error('❌ 弹窗图片加载失败 - message.id:', message.id, 'src:', message.image);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                onLoad={() => {
                  console.log('✅ 弹窗图片加载成功 - message.id:', message.id, 'src:', message.image);
                }}
              />
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-1">点击图片可放大查看</p>
          </div>
        )}
        
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-400 to-blue-300 text-white text-sm font-medium hover:shadow-lg transition-all flex-shrink-0"
        >
          关闭
        </button>
      </div>
    </div>
  );
}

function BreathingOrb({ style, color }: { style: React.CSSProperties; color: string }) {
  return <div className="breathing-orb" style={{ ...style, background: color }} />;
}

function LeaveMessageButton() {
  return (
    <Link
      href="/message"
      className="btn-primary px-8 py-3 rounded-full text-white text-sm tracking-wide relative z-20"
    >
      我想说说
    </Link>
  );
}

function HeroSection({ messages }: { messages: Message[] }) {
  const uniqueNames = new Set(messages.map(m => m.nickname.trim()).filter(Boolean));
  const participantCount = uniqueNames.size;
  const messageCount = messages.length;
  const hasStats = participantCount > 0 || messageCount > 0;

  return (
    <div className="relative h-[52vh] sm:h-[56vh] md:h-[60vh] mb-8 sm:mb-10 md:mb-12 overflow-hidden">
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f5f9fc] via-[#eff4f8] to-[#e8eef3]" />
      
      {/* 平铺整个 Hero 区域的图片 */}
      <div className="absolute inset-0">
        <Image
          src="/banner4.jpg"
          alt="演出氛围"
          fill
          className="object-cover saturate-[0.95] brightness-[0.98] scale-105 opacity-95"
          unoptimized
        />
        {/* 覆盖层 - 保护文字可读性 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(245,249,252,0.35)] via-[rgba(245,249,252,0.25)] to-[rgba(238,244,248,0.18)]" />
        {/* 左侧加强遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(245,249,252,0.18)] via-transparent to-transparent" />
        {/* 底部渐变 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(245,249,252,0.25)] via-transparent to-[rgba(245,249,252,0.12)]" />
      </div>

      {/* 柔和光晕 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-[rgba(168,197,217,0.12)] rounded-full blur-[100px] sm:blur-[120px]" />
        <div className="absolute bottom-[-80px] right-[-80px] w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] bg-[rgba(196,213,227,0.1)] rounded-full blur-[80px] sm:blur-[100px]" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-[rgba(202,218,232,0.06)] rounded-full blur-[120px] sm:blur-[150px]" />
      </div>

      {/* 舞台光效 */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/2 w-[500px] h-[500px] bg-gradient-to-br from-[rgba(255,235,205,0.12)] to-transparent rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-gradient-to-l from-[rgba(255,220,180,0.1)] to-transparent rounded-full blur-[80px]" />
      </div>

      {/* 内容层 */}
      <div className="relative z-10 h-full container mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex h-full items-center justify-end">
          {/* 左侧占位 */}
          <div className="hidden md:block md:w-9/12 lg:w-10/12" />

          {/* 右侧文字区域 */}
          <div className="w-full md:w-5/12 lg:w-1/2 flex flex-col justify-center py-8 md:py-0">
            <div className="max-w-md lg:max-w-lg animate-fade-in-up px-2 sm:px-4">
              {/* 文字区域背景遮罩 */}
              <div className="backdrop-blur-md bg-[rgba(245,249,252,0.75)] rounded-2xl p-6 sm:p-8 pb-8 sm:pb-10 border border-white/50 shadow-lg">
                <div className="w-12 h-px bg-gradient-to-r from-transparent via-[#6a8aa0] to-transparent mb-5" />
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-medium text-[#1a2a3a] tracking-[0.06em] mb-4 leading-[1.4] drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
                  大朋友小朋友
                </h1>
                <div className="w-12 h-px bg-gradient-to-r from-transparent via-[#6a8aa0] to-transparent mb-5" />
                <p className="text-sm sm:text-base md:text-lg font-normal text-[#3a5a75] tracking-wide mb-5 leading-relaxed drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                  把想念放在这里，让海风轻轻送给你
                </p>
                <div className="text-xs sm:text-sm font-light text-[#4a6a85] tracking-[0.1em] mb-8 leading-loose drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
                  未来的路还很长<br />我们都要加油
                </div>
                <div className="mt-2">
                  <LeaveMessageButton />
                </div>
                {hasStats && (
                  <p className="mt-5 text-[13px] sm:text-[14px] text-[#6a8aa0] leading-relaxed">
                    <span className="text-[#4a6a85] font-medium">{participantCount}</span>
                    {' 位小朋友来过这里'}
                    <span className="mx-2 text-[#9ab5c8]">·</span>
                    <span className="text-[#4a6a85] font-medium">{messageCount}</span>
                    {' 条祝福被轻轻留下'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-t from-[#f5f9fc] to-transparent" />
    </div>
  );
}

function FloatingMessages({ messages }: { messages: Message[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [displayMessages, setDisplayMessages] = useState<Message[]>([]);

  useEffect(() => {
    const count = Math.min(Math.floor(Math.random() * 4) + 5, messages.length);
    const shuffled = [...messages].sort(() => Math.random() - 0.5);
    setDisplayMessages(shuffled.slice(0, count));
  }, [messages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const animate = () => {
      if (!isHovering) {
        container.scrollLeft += 0.5;
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
          container.scrollLeft = 0;
        }
      }
      requestAnimationFrame(animate);
    };

    const animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isHovering]);

  if (displayMessages.length === 0) return null;

  return (
    <div className="relative mb-8 sm:mb-12 md:mb-16 overflow-hidden max-w-full">
      <div className="absolute inset-0 bg-gradient-to-r from-[#f5f9fc] via-transparent to-[#f5f9fc] pointer-events-none z-10 hidden sm:block" />
      
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg md:text-xl font-light text-[#5a7a94] tracking-wide">海风留言</h2>
      </div>
      
      <div
        ref={scrollContainerRef}
        className="flex gap-3 sm:gap-4 md:gap-6 px-4 sm:px-6 md:px-8 overflow-x-auto scrollbar-hide max-w-full"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{ scrollBehavior: 'smooth' }}
      >
        {[...displayMessages, ...displayMessages].map((message, index) => (
          <div
            key={`${message.id}-${index}`}
            className="flex-shrink-0 w-48 sm:w-56 md:w-64 glass-card-subtle rounded-xl p-3 sm:p-4 animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-2 mb-2">
                <Avatar nickname={message.nickname} size="xs" />
                <span className="text-[10px] sm:text-xs font-medium text-[#5a7a94] truncate">{message.nickname}</span>
              </div>
            <p className="serif-text text-[10px] sm:text-xs leading-relaxed line-clamp-2">
              {message.content}
            </p>
          </div>
        ))}
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

const MESSAGES_PER_PAGE = 15;

function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-4 z-[100] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-white/70 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
      aria-label="返回顶部"
    >
      <svg className="w-5 h-5 text-[#5a7a94]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [displayCount, setDisplayCount] = useState(MESSAGES_PER_PAGE);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  // 氛围组件状态联动
  const [isAmbientBubbleVisible, setIsAmbientBubbleVisible] = useState(false);
  const [isMemoryEchoVisible, setIsMemoryEchoVisible] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setError(null);
        const res = await fetch('/api/messages');
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Fetched messages:', data.length);
        // API 已经按置顶状态排序，直接使用返回的数据
        // 排序规则：置顶优先，置顶按时间倒序，普通留言按时间倒序
        setMessages(data);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        setError('加载失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedMessage) {
        setSelectedMessage(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMessage]);

  const displayedMessages = messages.slice(0, displayCount);
  const hasMore = displayCount < messages.length;

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + MESSAGES_PER_PAGE);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f9fc]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#a8c5d9] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#5a7a94] text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f9fc]">
        <div className="text-center px-4">
          <div className="w-12 h-12 rounded-full bg-[rgba(229,115,115,0.1)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#e57373]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[#5a7a94] text-base">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 rounded-full bg-gradient-to-r from-[#7faacc] to-[#a8c5d9] text-white text-sm hover:shadow-lg transition-all"
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-[#f5f9fc] overflow-x-hidden">
      <div className="atmosphere-glow" />

      <BreathingOrb
        style={{ width: '500px', height: '500px', left: '-15%', top: '5%', animationDelay: '1s' }}
        color="rgba(168, 197, 217, 0.25)"
      />
      <BreathingOrb
        style={{ width: '400px', height: '400px', right: '-10%', top: '35%', animationDelay: '3s' }}
        color="rgba(196, 213, 227, 0.2)"
      />
      <BreathingOrb
        style={{ width: '300px', height: '300px', left: '20%', bottom: '10%', animationDelay: '5s' }}
        color="rgba(168, 197, 217, 0.15)"
      />

      <div className="relative z-10">
        <HeroSection messages={messages} />
        
        <FloatingMessages messages={messages} />

        {/* 瀑布流布局 */}
        <div className="container mx-auto px-3 sm:px-4 pb-8 sm:pb-12">
          <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4">
            {displayedMessages.map((message, index) => (
              <div key={message.id} className="break-inside-avoid mb-3 sm:mb-4">
                <MessageCard 
                  message={message} 
                  index={index}
                  onClick={setSelectedMessage}
                />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-8 sm:mt-10">
              <button
                onClick={handleLoadMore}
                className="px-8 py-3 rounded-full bg-white/80 text-[#5a7a94] text-sm font-medium hover:bg-white hover:shadow-md transition-all border border-gray-100"
              >
                查看更多 ({messages.length - displayCount} 条)
              </button>
            </div>
          )}
        </div>

        {/* Footer 信息栏 */}
        <footer className="bg-white/50 border-t border-gray-100 py-6 sm:py-8 mt-8 sm:mt-12">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-500 transition-colors"
              >
                ICP备案号：滇ICP备2026010117号
              </a>
              <span className="hidden sm:inline">｜</span>
              <span>Version {process.env.NEXT_PUBLIC_APP_VERSION}</span>
              <span className="hidden sm:inline">｜</span>
              <span>信息举报邮箱：911359832@qq.com</span>
            </div>
            <div className="text-center text-[10px] text-gray-300 mt-3 sm:mt-4">
              本站内容仅供参考，如有侵权请联系删除
            </div>
          </div>
        </footer>
      </div>

      <BackToTopButton />
      
      {/* 氛围气泡和记忆回响联动 */}
      <AmbientBubble 
        isMemoryEchoVisible={isMemoryEchoVisible}
        onVisibilityChange={setIsAmbientBubbleVisible}
      />
      <MemoryEcho 
        messages={messages}
        isAmbientBubbleVisible={isAmbientBubbleVisible}
        onVisibilityChange={setIsMemoryEchoVisible}
      />

      {selectedMessage && (
        <MessageDetailModal 
          message={selectedMessage} 
          onClose={() => setSelectedMessage(null)} 
          onImageClick={(imageUrl) => setPreviewImage(imageUrl)}
        />
      )}
      
      {previewImage && (
        <ImagePreviewModal 
          imageUrl={previewImage} 
          onClose={() => setPreviewImage(null)} 
        />
      )}
    </div>
  );
}