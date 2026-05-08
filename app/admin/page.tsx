"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Message {
  id: number;
  nickname: string;
  content: string;
  avatar: string;
  time: string;
  image: string | null;
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const router = useRouter();

  useEffect(() => {
    if (authenticated) {
      fetchMessages();
    }
  }, [authenticated]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError("");
    } else {
      setError("密码错误，请重试");
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
        setToast({ type: "success", message: "删除成功" });
      } else {
        setToast({ type: "error", message: "删除失败" });
      }
    } catch (err) {
      console.error("Delete error:", err);
      setToast({ type: "error", message: "删除失败" });
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  const filteredMessages = messages.filter((message) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      message.nickname.toLowerCase().includes(query) ||
      message.content.toLowerCase().includes(query)
    );
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f9fc] to-[#e8eef3] p-4">
        <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#a8c5d9] to-[#7faacc] flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-[#253040] mb-2">管理员登录</h2>
          <p className="text-sm text-[#7a8a9a] mb-6">请输入管理员密码</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="请输入密码"
              className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-[#253040] placeholder-[#a0aec0] focus:outline-none focus:border-[#a8c5d9] focus:ring-1 focus:ring-[#a8c5d9] transition-all"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7faacc] to-[#a8c5d9] text-white text-sm font-medium hover:shadow-lg transition-all"
            >
              登录
            </button>
          </form>
          
          <p className="text-xs text-[#a0aec0] mt-6">
            <button 
              onClick={() => router.push("/")}
              className="text-[#7faacc] hover:underline"
            >
              返回祝福墙
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f9fc] to-[#e8eef3]">
      <div className="atmosphere-glow" />
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-[#253040]">管理中心</h1>
            <p className="text-xs sm:text-sm text-[#7a8a9a] mt-1">共 {messages.length} 条留言</p>
          </div>
          <button
            onClick={() => {
              setAuthenticated(false);
              setPassword("");
            }}
            className="px-3 sm:px-4 py-2 rounded-lg bg-white/60 text-[#5a7a94] text-xs sm:text-sm hover:bg-white/80 transition-all w-fit"
          >
            退出登录
          </button>
        </div>

        <div className="mb-4 sm:mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索昵称或留言内容..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-[#253040] placeholder-[#a0aec0] focus:outline-none focus:border-[#a8c5d9] focus:ring-1 focus:ring-[#a8c5d9] transition-all text-sm"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0aec0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {toast && (
          <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:w-auto sm:px-4 sm:py-3 px-3 py-2 rounded-lg shadow-lg z-50 ${
            toast.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          } animate-fade-in text-sm`}>
            {toast.message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredMessages.map((message) => (
            <div 
              key={message.id} 
              className="glass-card rounded-xl p-3 sm:p-4 relative"
            >
              <div className="flex items-start gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0 shadow-sm">
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
                  <h3 className="text-xs sm:text-sm font-medium text-[#253040] truncate">{message.nickname}</h3>
                  <p className="text-[10px] sm:text-xs text-[#9aabba]">{message.time}</p>
                </div>
              </div>
              
              <p className="text-xs sm:text-sm text-[#4a5568] leading-relaxed mb-2.5 sm:mb-3 line-clamp-3">
                {message.content}
              </p>
              
              {message.image && (
                <div className="mb-2.5 sm:mb-3 rounded-lg overflow-hidden">
                  <Image
                    src={message.image}
                    alt="图片"
                    width={300}
                    height={200}
                    className="w-full h-24 sm:h-32 object-cover"
                    unoptimized
                  />
                </div>
              )}
              
              <button
                onClick={() => setShowConfirm(message.id)}
                className="w-full py-2 rounded-lg bg-red-50 text-red-500 text-xs sm:text-sm hover:bg-red-100 transition-all"
              >
                删除留言
              </button>

              {showConfirm === message.id && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-xl flex items-center justify-center p-4 z-10">
                  <div className="bg-white rounded-xl p-4 sm:p-5 text-center max-w-xs w-full">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h4 className="text-sm sm:text-base font-medium text-gray-800 mb-2">确认删除？</h4>
                    <p className="text-xs sm:text-sm text-gray-500 mb-4">此操作无法撤销</p>
                    <div className="flex gap-2 sm:gap-3">
                      <button
                        onClick={() => setShowConfirm(null)}
                        className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs sm:text-sm hover:bg-gray-200 transition-all"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleDelete(message.id)}
                        disabled={loading}
                        className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs sm:text-sm hover:bg-red-600 transition-all disabled:opacity-50"
                      >
                        {loading ? "删除中..." : "确认删除"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredMessages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgba(168,197,217,0.2)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#a8c5d9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[#7a8a9a]">
              {searchQuery ? "没有找到相关留言" : "暂无留言"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
