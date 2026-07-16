"use client";

import { useState, useEffect } from "react";

interface ServerQuestion {
  id: number;
  question: string;
  hint: string;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuizModal({ isOpen, onClose, onSuccess }: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState<ServerQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastQuestionId, setLastQuestionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRandomQuestion = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/questions/random');
      if (res.ok) {
        const data = await res.json();
        if (data.question) {
          setCurrentQuestion(data.question);
          setLastQuestionId(data.question.id);
        } else {
          console.error('Question data is empty');
        }
      } else {
        console.error('Failed to fetch question');
      }
    } catch (error) {
      console.error('Error fetching question:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchRandomQuestion();
      setAnswer("");
      setError("");
      setIsVerifying(false);
      setShowSuccess(false);
    }
  }, [isOpen]);

  const handleVerify = async () => {
    if (!answer.trim()) {
      setError("请输入答案");
      return;
    }

    if (!currentQuestion) {
      setError("题目加载失败，请重试");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const res = await fetch('/api/questions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: currentQuestion.id, answer: answer.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.correct) {
          setTimeout(() => {
            setShowSuccess(true);
            setIsVerifying(false);
            sessionStorage.setItem('quizVerified', 'true');
            setTimeout(() => {
              onSuccess();
            }, 800);
          }, 500);
        } else {
          setError("答案好像不太对，再想想");
          setIsVerifying(false);
        }
      } else {
        const data = await res.json();
        setError(data.error || '验证失败');
        setIsVerifying(false);
      }
    } catch (error) {
      setError("网络错误，请重试");
      setIsVerifying(false);
    }
  };

  const handleChangeQuestion = () => {
    setAnswer("");
    setError("");
    fetchRandomQuestion();
  };

  // 点击背景关闭
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* 半透明背景 */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* 弹窗内容 */}
      <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-xl border border-white/60 overflow-hidden animate-fade-in-up">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 标题区域 */}
        <div className="text-center mb-5">
          <h3 className="text-lg sm:text-xl font-medium text-[#253040] mb-2">
            写下想说的话之前
          </h3>
          <p className="text-sm text-[#7a8a9a] flex items-center justify-center gap-1">
            先完成一个小小的默契验证
            <span className="text-xl">✨</span>
          </p>
        </div>

        {/* 验证成功状态 */}
        {showSuccess ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#52b788] to-[#40916c] flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[#52b788] font-medium mb-1">验证通过</p>
            <p className="text-[#7a8a9a] text-sm">正在打开留言本...</p>
          </div>
        ) : (
          <>
            {/* 题目 */}
            <div className="mb-4">
              <p className="text-[#253040] text-sm sm:text-base font-light mb-2">
                Q：{currentQuestion?.question}
              </p>
              <p className="text-[#7a8a9a] text-xs sm:text-sm">
                提示：{currentQuestion?.hint}
              </p>
            </div>

            {/* 答案输入 */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleVerify();
                  }
                }}
                placeholder="输入答案..."
                className="flex-1 px-3 sm:px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-[#253040] placeholder-[#a0aec0] focus:outline-none focus:border-[#a8c5d9] focus:ring-1 focus:ring-[#a8c5d9] transition-all text-sm"
                disabled={isVerifying}
                autoFocus
              />
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7faacc] to-[#a8c5d9] text-white text-sm font-medium hover:shadow-lg hover:shadow-[rgba(127,172,204,0.3)] transition-all disabled:opacity-50 flex items-center gap-1"
              >
                {isVerifying ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    验证中
                  </>
                ) : (
                  '确定'
                )}
              </button>
            </div>

            {/* 错误提示和换一题 */}
            <div className="flex items-center justify-between">
              {error && (
                <span className="text-[#e57373] text-xs sm:text-sm">{error}</span>
              )}
              <button
                onClick={handleChangeQuestion}
                className="flex items-center gap-1 text-[#7a8a9a] text-xs sm:text-sm hover:text-[#5a7a94] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                换一题
              </button>
            </div>
          </>
        )}

        {/* 底部装饰线 */}
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#a8c5d9] to-transparent mx-auto mt-5" />
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
