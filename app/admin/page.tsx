"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id: number;
  nickname: string;
  content: string;
  avatar: string;
  time: string;
  image: string | null;
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

// 根据昵称生成固定颜色
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
  const firstChar = nickname.charAt(0);
  if (/[\u4e00-\u9fa5]/.test(firstChar)) {
    return firstChar;
  }
  return firstChar.toUpperCase();
}

// 纯色圆形头像组件
function Avatar({ nickname, size = 'sm' }: { nickname: string; size?: 'xs' | 'sm' | 'md' }) {
  const color = getAvatarColor(nickname);
  const initial = getAvatarInitial(nickname);
  
  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm',
    md: 'w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base',
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

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [banRemainingMinutes, setBanRemainingMinutes] = useState<number | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    // 检查是否已有登录状态
    const sessionId = sessionStorage.getItem('admin_session');
    if (sessionId) {
      // 验证会话是否有效
      verifySession(sessionId);
    }
  }, []);

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

  useEffect(() => {
    if (banRemainingMinutes !== null && banRemainingMinutes > 0) {
      const timer = setInterval(() => {
        setBanRemainingMinutes(prev => {
          if (prev === null || prev <= 0.1) {
            setBanRemainingMinutes(null);
            return null;
          }
          return prev - 0.1;
        });
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [banRemainingMinutes]);

  const verifySession = async (sessionId: string) => {
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          setAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('会话验证失败:', error);
      sessionStorage.removeItem('admin_session');
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoginLoading(true);
    
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // 登录成功，保存会话
          const sessionId = Math.random().toString(36).substring(2, 15);
          sessionStorage.setItem('admin_session', sessionId);
          setAuthenticated(true);
        }
      } else {
        const data = await res.json();
        if (res.status === 429 && data.remainingMinutes) {
          // 被封禁，显示倒计时
          setBanRemainingMinutes(data.remainingMinutes);
          setError(data.error || '登录尝试过于频繁');
        } else {
          setError(data.error || '登录失败');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('登录失败，请稍后重试');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_session');
    setAuthenticated(false);
    setPassword('');
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      // 获取会话ID
      const sessionId = sessionStorage.getItem('admin_session');
      
      const res = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
        setToast({ type: "success", message: "删除成功" });
      } else {
        const data = await res.json();
        if (res.status === 401) {
          setToast({ type: "error", message: "会话已过期，请重新登录" });
          sessionStorage.removeItem('admin_session');
          setAuthenticated(false);
        } else {
          setToast({ type: "error", message: data.error || "删除失败" });
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
      setToast({ type: "error", message: "删除失败" });
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  const handleTogglePin = async (id: number, currentPinned: boolean) => {
    try {
      const res = await fetch('/api/messages', {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, isPinned: !currentPinned }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => prev.map(m => 
          m.id === id ? data.message : m
        ));
        setToast({ 
          type: "success", 
          message: currentPinned ? "取消置顶成功" : "置顶成功" 
        });
      } else {
        const data = await res.json();
        setToast({ type: "error", message: data.error || "操作失败" });
      }
    } catch (err) {
      console.error("Pin error:", err);
      setToast({ type: "error", message: "操作失败" });
    }
  };

  const filteredMessages = messages
    .filter((message) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        message.nickname.toLowerCase().includes(query) ||
        message.content.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isPinned && b.isPinned) {
        return new Date(b.pinnedAt || b.time).getTime() - new Date(a.pinnedAt || a.time).getTime();
      }
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f9fc] to-[#e8eef3] p-4">
        <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#a8c5d9] to-[#7faacc] flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </div>
          <h1 className="text-xl font-medium text-[#253040] mb-2">管理员登录</h1>
          <p className="text-[#7a8a9a] text-sm mb-6">请输入管理员密码</p>
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-500 text-sm">
              {error}
              {banRemainingMinutes !== null && (
                <span className="block mt-1 text-xs text-red-400">
                  剩余时间：{Math.ceil(banRemainingMinutes)} 分钟
                </span>
              )}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 text-[#253040] placeholder-[#a0aec0] focus:outline-none focus:border-[#a8c5d9] focus:ring-1 focus:ring-[#a8c5d9] transition-all"
              autoFocus
            />
            <button
              type="submit"
              disabled={loginLoading || !password.trim() || banRemainingMinutes !== null}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7faacc] to-[#a8c5d9] text-white font-medium hover:shadow-lg hover:shadow-[rgba(127,172,204,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>
          
          <p className="text-[#a0aec0] text-xs mt-4">
            提示：密码由服务器配置
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f9fc] to-[#e8eef3] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-[#253040]">管理后台</h1>
            <p className="text-[#7a8a9a] text-sm mt-1">共 {messages.length} 条留言</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-white/60 text-[#7a8a9a] text-sm hover:bg-white/80 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            退出
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="relative max-w-md mb-4 sm:mb-6">
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

        {/* Toast 通知 */}
        {toast && (
          <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:w-auto sm:px-4 sm:py-3 px-3 py-2 rounded-lg shadow-lg z-50 ${
            toast.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          } animate-fade-in text-sm`}>
            {toast.message}
          </div>
        )}

        {/* 留言列表 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((message) => (
              <div 
                key={message.id} 
                className="glass-card rounded-xl p-3 sm:p-4 relative"
              >
                {/* 置顶标识 */}
                {message.isPinned && (
                  <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 px-2 py-0.5 bg-orange-500 text-white text-[10px] sm:text-xs rounded-full flex items-center gap-1 z-10">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    置顶
                  </div>
                )}
                
                <div className="flex items-start gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
                  <Avatar nickname={message.nickname} size="md" />
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
                    <img
                      src={message.image}
                      alt="图片"
                      className="w-full h-24 sm:h-32 object-cover"
                    />
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTogglePin(message.id, message.isPinned)}
                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm transition-all ${
                      message.isPinned 
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                        : 'bg-blue-50 text-blue-500 hover:bg-blue-100'
                    }`}
                  >
                    {message.isPinned ? '取消置顶' : '置顶'}
                  </button>
                  <button
                    onClick={() => setShowConfirm(message.id)}
                    className="flex-1 py-2 rounded-lg bg-red-50 text-red-500 text-xs sm:text-sm hover:bg-red-100 transition-all"
                  >
                    删除留言
                  </button>
                </div>

                {/* 删除确认弹窗 */}
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
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs sm:text-sm hover:bg-gray-50 transition-all"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleDelete(message.id)}
                          disabled={loading}
                          className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-xs sm:text-sm hover:bg-red-600 transition-all disabled:opacity-50"
                        >
                          {loading ? '删除中...' : '确认删除'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 sm:py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[#7a8a9a] text-sm">没有找到相关留言</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}