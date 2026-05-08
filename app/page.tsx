"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface Message {
  id: number;
  nickname: string;
  content: string;
  avatar: string;
  time: string;
  image: string | null;
  createdAt: string;
}

function MessageCard({ message, index, onClick }: { message: Message; index: number; onClick: (message: Message) => void }) {
  return (
    <div
      className="glass-card glass-card-hover rounded-xl p-3 sm:p-4 card-hover-lift animate-fade-in-up cursor-pointer flex flex-col h-[260px] sm:h-[280px]"
      style={{ animationDelay: `${index * 0.06}s` }}
      onClick={() => onClick(message)}
    >
      {/* 顶部信息区 */}
      <div className="flex items-center gap-2 mb-2 sm:mb-2.5 flex-shrink-0">
        <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0 shadow-sm">
          <Image
            src={message.avatar}
            alt={message.nickname}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="font-medium text-[#4a6a8a] text-[11px] sm:text-xs truncate">{message.nickname}</h3>
          <span className="text-[10px] sm:text-[11px] text-[#a0aec0]">{message.time}</span>
        </div>
      </div>

      {/* 留言预览区 - 轻预览模式 */}
      <div className="flex-1 min-h-0 mb-2 sm:mb-3">
        <p className="text-[#5a6a7a] text-[11px] sm:text-xs leading-[1.6] line-clamp-3 overflow-hidden break-all">
          {message.content}
        </p>
      </div>

      {/* 图片预览区 - 作为情绪配图 */}
      <div className="flex-shrink-0">
        {message.image ? (
          <div className="w-full h-[60px] sm:h-[70px] rounded-lg overflow-hidden">
            <Image
              src={message.image}
              alt="祝福图片"
              width={280}
              height={70}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[rgba(168,197,217,0.2)] to-transparent" />
        )}
      </div>

      {/* 操作区 */}
      <div className="flex-shrink-0 text-center mt-2 sm:mt-2.5">
        <span className="text-[10px] text-[#7faacc]/70 font-normal">查看详情</span>
      </div>
    </div>
  );
}

function MessageDetailModal({ message, onClose }: { message: Message; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl p-4 sm:p-5 max-w-sm sm:max-w-md w-full max-h-[90vh] sm:max-h-[85vh] shadow-xl border border-white/70 overflow-hidden flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 flex-shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shadow-sm flex-shrink-0">
            <Image
              src={message.avatar}
              alt={message.nickname}
              width={40}
              height={40}
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-medium text-gray-800 truncate">{message.nickname}</h3>
            <p className="text-[10px] sm:text-xs text-gray-500">{message.time}</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1 min-h-0">
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
            <p className="text-gray-700 leading-relaxed text-xs sm:text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
        
        {message.image && (
          <div className="flex-shrink-0 mb-3 sm:mb-4">
            <div className="rounded-xl overflow-hidden bg-white border border-gray-100">
              <Image
                src={message.image}
                alt="图片"
                width={400}
                height={280}
                className="w-full max-h-[200px] sm:max-h-[280px] object-contain"
                unoptimized
              />
            </div>
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

function HeroSection() {
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
          className="object-cover saturate-[0.95] brightness-[0.98] scale-105 opacity-92"
          unoptimized
        />
        {/* 覆盖层 - 保护文字可读性 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(245,249,252,0.45)] via-[rgba(245,249,252,0.35)] to-[rgba(238,244,248,0.28)]" />
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
              <div className="backdrop-blur-sm bg-[rgba(245,249,252,0.45)] rounded-2xl p-6 sm:p-8 border border-white/30 shadow-md">
                <div className="w-12 h-px bg-gradient-to-r from-transparent via-[#7a9cb8] to-transparent mb-5" />
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-medium text-[#253545] tracking-[0.06em] mb-4 leading-[1.4] drop-shadow-sm">
                  大朋友小朋友
                </h1>
                <div className="w-12 h-px bg-gradient-to-r from-transparent via-[#7a9cb8] to-transparent mb-5" />
                <p className="text-sm sm:text-base md:text-lg font-normal text-[#4a6a85] tracking-wide mb-5 leading-relaxed drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                  把想念放在这里，让海风轻轻送给你
                </p>
                <div className="text-xs sm:text-sm font-light text-[#5a7a94] tracking-[0.1em] mb-8 leading-loose drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
                  未来的路还很长<br />我们都要加油
                </div>
                <div className="mt-2">
                  <LeaveMessageButton />
                </div>
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
    // 从全部留言中随机抽取 5~8 条
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
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-[#a8c5d9] to-[#c5d6e3] flex items-center justify-center">
                <span className="text-[10px] sm:text-xs text-white font-medium">{message.nickname.slice(0, 1)}</span>
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-[#5a7a94] truncate">{message.nickname}</span>
            </div>
            <p className="text-[#5a6a7a] text-[10px] sm:text-xs leading-relaxed line-clamp-2">
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

const MESSAGES_PER_PAGE = 12;

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
        // 按时间倒序排序，优先使用 time 字段（更可靠），其次 createdAt
        const sortedData = [...data].sort((a: Message, b: Message) => {
          // 将中文时间格式转换为时间戳
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
            // ISO 格式
            return new Date(timeStr).getTime();
          };
          const timeA = parseTime(a);
          const timeB = parseTime(b);
          if (timeB !== timeA) return timeB - timeA;
          return b.id - a.id; // 时间相同时按 id 排序
        });
        setMessages(sortedData);
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
        <HeroSection />
        
        <FloatingMessages messages={messages} />

        <div className="container mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {displayedMessages.map((message, index) => (
              <MessageCard 
                key={message.id} 
                message={message} 
                index={index}
                onClick={setSelectedMessage}
              />
            ))}
          </div>

          {hasMore && (
            <div className="text-center mb-6 sm:mb-8">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2.5 rounded-xl bg-white/60 text-[#5a7a94] text-sm font-medium hover:bg-white/80 transition-all border border-[#c5d6e3]"
              >
                查看更多 ({messages.length - displayCount} 条)
              </button>
            </div>
          )}

          <div className="text-center mb-6 sm:mb-8">
            <LeaveMessageButton />
          </div>

          <footer className="text-center text-[#a0aec0] text-[10px] sm:text-xs mt-8 sm:mt-12">
            <p>Made with care</p>
          </footer>
        </div>
      </div>

      {selectedMessage && (
        <MessageDetailModal 
          message={selectedMessage} 
          onClose={() => setSelectedMessage(null)} 
        />
      )}

      <BackToTopButton />
    </div>
  );
}
