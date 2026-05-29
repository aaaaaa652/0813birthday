"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface Message {
  id: number;
  content: string;
  createdAt: string;
  isPinned: boolean;
}

interface MemoryEchoProps {
  messages: Message[];
  isAmbientBubbleVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
}

function formatTimeAgo(dateString: string): string {
  const createdAt = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const hour = createdAt.getHours();
    if (hour >= 23 || hour < 5) return '昨晚深夜';
    return '今天';
  } else if (diffDays === 1) {
    const hour = createdAt.getHours();
    if (hour >= 23 || hour < 5) return '昨天深夜';
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} 周前`;
  } else if (diffDays < 365) {
    return `${Math.floor(diffDays / 30)} 个月前`;
  } else {
    return '很久以前';
  }
}

function containsOnlyEmoji(content: string): boolean {
  const emojiPattern = /[\u2700-\u27bf]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2600-\u26FF]|[\u25C0-\u25FF]|[\uFE00-\uFE0F]|[\u1F000-\u1F6FF]/g;
  const emojiMatches = content.match(emojiPattern);
  if (!emojiMatches) return false;
  const emojiLength = emojiMatches.join('').length;
  return emojiLength / content.length > 0.8;
}

function filterMessages(messages: Message[]): Message[] {
  return messages.filter(msg => {
    if (msg.isPinned) return false;
    const content = msg.content.trim();
    if (!content || content.length < 15) return false;
    if (containsOnlyEmoji(content)) return false;
    const spamKeywords = ['测试', '广告', '推广', '刷', '垃圾'];
    const lowerContent = content.toLowerCase();
    if (spamKeywords.some(kw => lowerContent.includes(kw))) return false;
    return true;
  });
}

function getRandomPosition(): { top: string; left: string; transform: string } {
  const positions = [
    { top: '62%', left: '12%', transform: 'translate(-50%, -50%)' },
    { top: '68%', left: '55%', transform: 'translate(-50%, -50%)' },
    { top: '38%', left: '82%', transform: 'translate(-50%, -50%)' },
    { top: '78%', left: '18%', transform: 'translate(-50%, -50%)' },
    { top: '52%', left: '88%', transform: 'translate(-50%, -50%)' },
    { top: '48%', left: '14%', transform: 'translate(-50%, -50%)' },
  ];
  return positions[Math.floor(Math.random() * positions.length)];
}

export default function MemoryEcho({ messages, isAmbientBubbleVisible, onVisibilityChange }: MemoryEchoProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [position, setPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
  const [timeAgo, setTimeAgo] = useState('');

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expandedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getRandomMessage = useCallback(() => {
    const filtered = filterMessages(messages);
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
  }, [messages]);

  const showEcho = useCallback(() => {
    if (isAmbientBubbleVisible) {
      const retryDelay = 5000 + Math.random() * 5000;
      delayRef.current = setTimeout(showEcho, retryDelay);
      return;
    }

    const message = getRandomMessage();
    if (!message) return;

    setCurrentMessage(message);
    setTimeAgo(formatTimeAgo(message.createdAt));
    setPosition(getRandomPosition());
    setIsVisible(true);
    setIsExpanded(false);
    onVisibilityChange(true);

    const duration = 8000 + Math.random() * 4000;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onVisibilityChange(false);
        const delay = 40000 + Math.random() * 50000;
        delayRef.current = setTimeout(showEcho, delay);
      }, 1500);
    }, duration);
  }, [getRandomMessage, isAmbientBubbleVisible, onVisibilityChange]);

  useEffect(() => {
    const initialDelay = 20000 + Math.random() * 10000;
    delayRef.current = setTimeout(showEcho, initialDelay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (delayRef.current) clearTimeout(delayRef.current);
      if (expandedTimeoutRef.current) clearTimeout(expandedTimeoutRef.current);
    };
  }, [showEcho]);

  useEffect(() => {
    if (isAmbientBubbleVisible && isVisible) {
      setIsVisible(false);
      setTimeout(() => {
        onVisibilityChange(false);
      }, 1500);
    }
  }, [isAmbientBubbleVisible, isVisible, onVisibilityChange]);

  const handleClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      if (expandedTimeoutRef.current) clearTimeout(expandedTimeoutRef.current);
      expandedTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onVisibilityChange(false);
          const delay = 40000 + Math.random() * 50000;
          delayRef.current = setTimeout(showEcho, delay);
        }, 1500);
      }, 10000);
    } else {
      setIsVisible(false);
      setTimeout(() => {
        onVisibilityChange(false);
        const delay = 40000 + Math.random() * 50000;
        delayRef.current = setTimeout(showEcho, delay);
      }, 1500);
    }
  };

  if (!isVisible || !currentMessage) return null;

  const truncatedContent = currentMessage.content.length > 50
    ? currentMessage.content.slice(0, 50) + '……'
    : currentMessage.content;

  return (
    <div
      className="fixed z-30 cursor-pointer select-none"
      style={{
        top: position.top,
        left: position.left,
        transform: position.transform,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1), transform 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
        maxWidth: isExpanded ? '300px' : '240px',
      }}
      onClick={handleClick}
    >
      <div
        className={`relative transition-all duration-700 ${
          isExpanded ? 'scale-100' : 'scale-100 hover:scale-[1.02]'
        }`}
        style={{
          background: 'rgba(255, 255, 255, 0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '20px',
          padding: isExpanded ? '18px 20px 16px' : '14px 16px 12px',
          boxShadow: '0 8px 32px rgba(166, 196, 215, 0.15), 0 2px 8px rgba(166, 196, 215, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
        }}
      >
        <div
          className="absolute w-1.5 h-1.5 rounded-full opacity-40"
          style={{
            background: 'linear-gradient(135deg, #a8c5d9, #d4e5ed)',
            top: '-4px',
            right: '20px',
          }}
        />

        <div className="text-[10px] text-[#9ab5c8] mb-2.5 tracking-wider">
          <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>风捎来的</span>
          <span className="mx-1.5 opacity-50">·</span>
          <span>{timeAgo}</span>
        </div>

        <p
          className="text-[13px] leading-relaxed"
          style={{
            fontFamily: '"Noto Serif SC", "Songti SC", STSong, serif',
            color: '#4a6a85',
            fontWeight: 350,
            letterSpacing: '0.03em',
            whiteSpace: isExpanded ? 'pre-wrap' : 'normal',
          }}
        >
          {isExpanded ? currentMessage.content : truncatedContent}
        </p>

        {currentMessage.content.length > 50 && (
          <div className="mt-2.5 text-right">
            <span className="text-[10px]" style={{ color: '#b0c8d8' }}>
              {isExpanded ? '收起' : '轻轻展开'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}