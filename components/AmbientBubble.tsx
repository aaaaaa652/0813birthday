"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// 通用文案池
const generalMessages = [
  "有人正在写一段很长的话…",
  "有人删删改改了很多次",
  "有人刚刚留下了一句悄悄话",
  "有人写到一半又停下来了",
  "有人上传了一张舍不得删的照片",
  "有人已经盯着输入框很久了",
  "有人好像想说什么，又没说出口",
  "有人刚刚按下了发送",
  "有人悄悄看了很久",
  "有人把一句话删掉又重新写了一遍",
  "有人正在认真组织语言",
  "有人留下了一段关于你的回忆",
  "有人在这里停留了很久",
  "有人刚刚打开了相册",
  "有人正在偷偷想念一个人",
  "有人把情绪藏进了留言里",
  "有人想留下点什么",
  "有人反复看了很多遍才发送",
  "有人正在认真写一封信",
  "有人正在想念你",
  "有人在等一句回应",
  "有人刚刚保存了一张卡片",
  "有人把回忆留在了这里",
  "有人想把今天记录下来",
  "有人正在犹豫要不要发送",
  "有人刚刚点开了留言框",
  "这里刚刚多了一句温柔的话",
  "有人轻轻留下了一句话",
];

// 深夜模式文案池（23:00 - 05:00）
const nightMessages = [
  "今晚好像很多人睡不着",
  "有人在深夜留下了一句话",
  "夜深了，也欢迎你留下心事",
  "有人正在认真写一封信",
  "有人好像想说什么，又没说出口",
];

interface AmbientBubbleProps {
  isMemoryEchoVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
}

export default function AmbientBubble({ isMemoryEchoVisible, onVisibilityChange }: AmbientBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [dotPulse, setDotPulse] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 获取随机消息
  const getRandomMessage = useCallback(() => {
    const hour = new Date().getHours();
    const isNight = hour >= 23 || hour < 5;

    const pool = isNight 
      ? [...nightMessages, ...generalMessages.slice(0, 10)] 
      : generalMessages;

    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  // 显示气泡
  const showBubble = useCallback(() => {
    // 如果记忆回响正在显示，则延迟后重试
    if (isMemoryEchoVisible) {
      const retryDelay = 5000 + Math.random() * 5000;
      delayRef.current = setTimeout(showBubble, retryDelay);
      return;
    }

    setMessage(getRandomMessage());
    setIsVisible(true);
    setDotPulse(true);
    onVisibilityChange(true);

    // 4-6秒后消失
    const duration = 4000 + Math.random() * 2000;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setDotPulse(false);
      setTimeout(() => {
        onVisibilityChange(false);
        // 20-60秒后再次出现
        const delay = 20000 + Math.random() * 40000;
        delayRef.current = setTimeout(showBubble, delay);
      }, 700);
    }, duration);
  }, [getRandomMessage, isMemoryEchoVisible, onVisibilityChange]);

  // 初始化和清理
  useEffect(() => {
    // 初始延迟 10-20 秒后首次出现
    const initialDelay = 10000 + Math.random() * 10000;
    delayRef.current = setTimeout(showBubble, initialDelay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (delayRef.current) clearTimeout(delayRef.current);
    };
  }, [showBubble]);

  // 监听记忆回响状态变化
  useEffect(() => {
    if (isMemoryEchoVisible && isVisible) {
      // 如果记忆回响出现，当前气泡提前消失
      setIsVisible(false);
      setTimeout(() => {
        onVisibilityChange(false);
      }, 700);
    }
  }, [isMemoryEchoVisible, isVisible, onVisibilityChange]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-6 sm:bottom-28 sm:right-8 z-40">
      <div
        className="group flex items-center gap-3.5 px-5 py-4 bg-white/75 backdrop-blur-lg rounded-2xl shadow-xl shadow-black/10 border border-white/60 transition-all duration-700 ease-out"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.92)",
          transitionTimingFunction: isVisible ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* 呼吸小圆点 */}
        <div className="relative">
          <div
            className={`w-2.5 h-2.5 rounded-full bg-green-400 transition-all duration-2000 ${
              dotPulse ? "animate-pulse" : ""
            }`}
            style={{
              boxShadow: dotPulse 
                ? "0 0 10px 3px rgba(74, 222, 128, 0.5)" 
                : "0 0 6px rgba(74, 222, 128, 0.35)",
              opacity: dotPulse ? 1 : 0.55,
            }}
          />
        </div>

        {/* 文案内容 */}
        <p
          className="text-sm sm:text-base text-gray-600 font-light max-w-[240px] sm:max-w-[280px] leading-relaxed"
          style={{
            fontFamily: "SimSun, STSong, serif",
            letterSpacing: "0.03em",
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
