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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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

  const isWechat = () => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('micromessenger');
  };

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    
    setIsSaving(true);
    setErrorMessage(null);

    try {
      // 等待图片加载完成
      const images = cardRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      }));

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true
      });

      const imageDataUrl = canvas.toDataURL("image/png");
      const now = new Date();
      const fileName = `thank-you-card-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.png`;

      if (isMobile()) {
        // 移动端：显示预览，提示长按保存
        setPreviewImage(imageDataUrl);
      } else {
        // PC端：直接下载
        const link = document.createElement("a");
        link.download = fileName;
        link.href = imageDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Image capture failed:", error);
      // 尝试降级方案：使用 canvas 直接绘制
      try {
        await fallbackSaveImage();
      } catch (fallbackError) {
        console.error("Fallback capture failed:", fallbackError);
        setErrorMessage("图片生成失败，请截图保存");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // 降级方案：手动创建canvas绘制
  const fallbackSaveImage = async () => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Canvas context not available');
    
    // 绘制白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const now = new Date();
    const fileName = `thank-you-card-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.png`;

    if (isMobile()) {
      setPreviewImage(canvas.toDataURL("image/png"));
    } else {
      const link = document.createElement("a");
      link.download = fileName;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

  return (
    <>
      {/* 图片预览弹窗 - 移动端使用 */}
      {previewImage && (
        <div className="fixed inset-0 z-[101] flex flex-col items-center justify-center p-6 bg-black/80">
          <div className="relative max-h-[75vh] overflow-auto">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white text-sm bg-black/30 px-4 py-2 rounded-lg hover:bg-black/50 transition-colors z-10"
            >
              关闭
            </button>
            <img
              src={previewImage}
              alt="预览图片"
              className="max-w-[90vw] max-h-[70vh] object-contain rounded-lg"
            />
          </div>
          <div className="text-center mt-4 text-white text-sm space-y-2">
            <p>长按图片保存到相册</p>
            {isWechat() && (
              <p className="text-white/70 text-xs">
                如无法保存，请长按图片或使用系统截图
              </p>
            )}
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/5">
        {/* 背景层 - 点击关闭 */}
        <div
          className="absolute inset-0 bg-black/65"
          onClick={onClose}
        />

        {/* 卡片主体 - 像印刷品一样的质感 */}
        <div className="relative z-10 flex flex-col items-center">
          {/* 可截图的卡片本体 */}
          <div 
            ref={cardRef}
            className="bg-white max-w-[400px] sm:max-w-[480px] w-[90vw] rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* 图片区域 - 横图，约占卡片35-40% */}
            <div className="relative p-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <img
                  src={data.image}
                  alt="卡片图片"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: data.imagePosition || "center center" }}
                />
              
              {/* 电影感渐变遮罩 - 主要在底部和右侧 */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.15) 80%, rgba(0,0,0,0.25) 100%)'
                }}
              />
              
              {/* 细边框 - 距离图片边缘16px */}
              <div className="absolute inset-[16px] border border-white/50 pointer-events-none" />
              
              {/* 日期 - 右下角 */}
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

            {/* 内容区域 - 适度留白 */}
            <div className="px-6 sm:px-8 py-6 sm:py-8">
              {/* 歌词区域 - 提升可读性 */}
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

              {/* 分隔线 - 短横线 */}
              <div className="flex justify-center mb-6">
                <div className="w-8 h-[1px] bg-gray-200" />
              </div>

              {/* 祝福语 - 视觉中心 */}
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

              {/* THANK YOU - 极淡 */}
              <div className="text-center pb-1">
                <p className="text-[9px] tracking-[0.5em] text-gray-150" style={{ fontWeight: 300 }}>
                  THANK YOU
                </p>
              </div>
            </div>
          </div>

          {/* 保存图片按钮 - 不在截图范围内 */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleSaveImage}
              disabled={isSaving}
              className="px-6 py-2.5 bg-gray-800 text-white text-sm rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "生成中..." : "保存图片"}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white/80 text-gray-600 text-sm rounded-full hover:bg-white transition-colors"
            >
              关闭
            </button>
          </div>

          {/* 错误提示 */}
          {errorMessage && (
            <div className="mt-4 text-red-400 text-sm">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </>
  );
}