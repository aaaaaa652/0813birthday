"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";

export interface ThankYouCardData {
  image: string;
  imagePosition?: string;
  lyric: string[];
  blessing: string;
  source: string;
}

interface ThankYouCardProps {
  data: ThankYouCardData;
  onClose: () => void;
}

export default function ThankYouCard({ data, onClose }: ThankYouCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  useEffect(() => {
    const generateImage = async () => {
      if (!cardRef.current) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const images = cardRef.current.querySelectorAll('img');
        await Promise.all(Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = () => resolve(null);
            img.onerror = () => {
              console.warn('Image load failed, continuing anyway');
              resolve(null);
            };
          });
        }));

        await new Promise(resolve => requestAnimationFrame(resolve));

        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: cardRef.current.scrollWidth,
          windowHeight: cardRef.current.scrollHeight,
          onclone: (clonedDoc) => {
            const clonedCard = clonedDoc.body.querySelector('[data-card-ref]') as HTMLElement | null;
            if (clonedCard) {
              clonedCard.style.transform = 'none';
              clonedCard.style.opacity = '1';
            }
          }
        });

        const dataUrl = canvas.toDataURL("image/png");
        setImageDataUrl(dataUrl);
      } catch (error) {
        console.error("Image capture failed:", error);
        setErrorMessage("图片生成失败，请截图保存");
      } finally {
        setIsLoading(false);
      }
    };

    generateImage();
  }, []);

  const handleClose = () => {
    onClose();
  };

  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65">
      {/* 背景层 - 点击关闭 */}
      <div
        className="absolute inset-0"
        onClick={handleClose}
      />

      {/* 内容区域 */}
      <div className="relative z-10 flex flex-col items-center p-4">
        {/* 加载状态 */}
        {isLoading && (
          <div className="text-white text-lg">
            正在生成卡片...
          </div>
        )}

        {/* 生成成功 - 显示图片 */}
        {imageDataUrl && !isLoading && (
          <div className="flex flex-col items-center">
            <img
              src={imageDataUrl}
              alt="感谢卡片"
              className="max-w-[90vw] max-h-[70vh] object-contain rounded-2xl shadow-2xl"
              style={{ touchAction: 'manipulation' }}
            />
            <div className="text-center mt-4 sm:mt-6 text-white text-sm space-y-1 px-4">
              <p>长按图片保存到相册</p>
              {!isMobile() && (
                <p className="text-white/50 text-xs">
                  或右键图片选择「另存为」
                </p>
              )}
            </div>
          </div>
        )}

        {/* 生成失败 - 显示原卡片 */}
        {!imageDataUrl && !isLoading && errorMessage && (
          <div className="flex flex-col items-center">
            {/* 可截图的卡片本体 */}
            <div
              ref={cardRef}
              data-card-ref="true"
              className="bg-white max-w-[400px] sm:max-w-[480px] w-[90vw] rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* 图片区域 */}
              <div className="relative p-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                  <img
                    src={data.image}
                    alt="卡片图片"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: data.imagePosition || "center center" }}
                  />

                  {/* 电影感渐变遮罩 */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.15) 80%, rgba(0,0,0,0.25) 100%)'
                    }}
                  />

                  {/* 细边框 */}
                  <div className="absolute inset-[16px] border border-white/50 pointer-events-none" />

                  {/* 日期 */}
                  <div className="absolute bottom-4 right-4">
                    <div
                      className="text-white"
                      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                    >
                      <div
                        className="text-[36px] sm:text-[42px] tracking-tight"
                        style={{ fontWeight: 200 }}
                      >
                        {day}
                      </div>
                      <div
                        className="text-[9px] tracking-[0.5em] mt-1"
                        style={{ fontWeight: 300, opacity: 0.85 }}
                      >
                        {month}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 内容区域 */}
              <div className="px-6 sm:px-8 py-6 sm:py-8">
                {/* 歌词区域 */}
                <div className="mb-8">
                  {data.lyric.map((line, index) => (
                    <p
                      key={index}
                      className="text-gray-500 text-xs sm:text-sm"
                      style={{ lineHeight: '1.8', fontWeight: 350, letterSpacing: '0.02em' }}
                    >
                      {line}
                    </p>
                  ))}
                </div>

                {/* 分隔线 */}
                <div className="flex justify-center mb-6">
                  <div className="w-8 h-[1px] bg-gray-200" />
                </div>

                {/* 祝福语 */}
                <div className="text-center mb-3">
                  <p
                    className="text-xl sm:text-2xl text-gray-700"
                    style={{ fontWeight: 300, letterSpacing: '0.08em' }}
                  >
                    {data.blessing}
                  </p>
                </div>

                {/* 歌曲名 */}
                <div className="text-center mb-5">
                  <p className="text-[10px] sm:text-xs text-gray-400" style={{ fontWeight: 300 }}>
                    {data.source}
                  </p>
                </div>

                {/* THANK YOU */}
                <div className="text-center pb-1">
                  <p className="text-[9px] tracking-[0.5em] text-gray-150" style={{ fontWeight: 300 }}>
                    THANK YOU
                  </p>
                </div>

                {/* 版权声明 */}
                <div className="text-right pr-2 pb-2">
                  <p className="text-[8px] text-gray-300" style={{ fontWeight: 300 }}>
                    图片来自网络，侵删，邮箱见底部
                  </p>
                </div>
              </div>
            </div>

            {/* 错误提示 */}
            <div className="mt-4 text-red-300 text-sm">
              {errorMessage}
            </div>
          </div>
        )}

        {/* 关闭按钮 */}
        {!isLoading && (
          <button
            onClick={handleClose}
            className="mt-6 px-8 py-2.5 bg-white/80 text-gray-600 text-sm rounded-full hover:bg-white transition-colors"
          >
            关闭
          </button>
        )}
      </div>
    </div>
  );
}
