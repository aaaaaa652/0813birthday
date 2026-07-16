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

const AVATAR_COLORS = [
  '#FFB6C1',
  '#A5D8FF',
  '#FFD591',
  '#95DE64',
  '#BDB2FF',
  '#FFC6A5',
];

function getAvatarColor(nickname: string): string {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    const char = nickname.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getAvatarInitial(nickname: string): string {
  if (!nickname || nickname.length === 0) return '?';
  const firstChar = nickname.charAt(0);
  if (/[\u4e00-\u9fa5]/.test(firstChar)) {
    return firstChar;
  }
  return firstChar.toUpperCase();
}

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

type TabType = 'messages' | 'cards' | 'questions' | 'announcements';

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
  const [activeTab, setActiveTab] = useState<TabType>('messages');
  
  const router = useRouter();

  useEffect(() => {
    const sessionId = sessionStorage.getItem('admin_session');
    if (sessionId) {
      verifySession(sessionId);
    }
  }, []);

  useEffect(() => {
    if (authenticated && activeTab === 'messages') {
      fetchMessages();
    }
  }, [authenticated, activeTab]);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          setAuthenticated(true);
        }
      }
    } catch {
      sessionStorage.removeItem('admin_session');
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      setMessages(data);
    } catch {
      console.error("Failed to fetch messages");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoginLoading(true);
    
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const sessionId = Math.random().toString(36).substring(2, 15);
          sessionStorage.setItem('admin_session', sessionId);
          setAuthenticated(true);
        }
      } else {
        const data = await res.json();
        if (res.status === 429 && data.remainingMinutes) {
          setBanRemainingMinutes(data.remainingMinutes);
          setError(data.error || '登录尝试过于频繁');
        } else {
          setError(data.error || '登录失败');
        }
      }
    } catch {
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
      const sessionId = sessionStorage.getItem('admin_session');
      
      const res = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
        headers: { 'Content-Type': 'application/json' },
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
    } catch {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPinned: !currentPinned }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => prev.map(m => m.id === id ? data.message : m));
        setToast({ type: "success", message: currentPinned ? "取消置顶成功" : "置顶成功" });
      } else {
        const data = await res.json();
        setToast({ type: "error", message: data.error || "操作失败" });
      }
    } catch {
      setToast({ type: "error", message: "操作失败" });
    }
  };

  const filteredMessages = messages
    .filter((message) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return message.nickname.toLowerCase().includes(query) || message.content.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isPinned && b.isPinned) {
        const pinnedAtA = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
        const pinnedAtB = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
        return pinnedAtB - pinnedAtA;
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

  const tabs: { key: TabType; label: string }[] = [
    { key: 'messages', label: '留言管理' },
    { key: 'cards', label: '卡片管理' },
    { key: 'questions', label: '题目管理' },
    { key: 'announcements', label: '公告管理' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'cards':
        return <CardManagement />;
      case 'questions':
        return <QuestionManagement />;
      case 'announcements':
        return <AnnouncementManagement />;
      default:
        return (
          <>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message) => (
                  <div key={message.id} className="glass-card rounded-xl p-3 sm:p-4 relative">
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
                        <img src={message.image} alt="图片" className="w-full h-24 sm:h-32 object-cover" />
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
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f9fc] to-[#e8eef3] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-[#253040]">管理后台</h1>
            {activeTab === 'messages' && <p className="text-[#7a8a9a] text-sm mt-1">共 {messages.length} 条留言</p>}
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

        <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-[#7faacc] to-[#a8c5d9] text-white shadow-lg shadow-[rgba(127,172,204,0.3)]'
                  : 'bg-white/60 text-[#7a8a9a] hover:bg-white/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {toast && (
          <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:w-auto sm:px-4 sm:py-3 px-3 py-2 rounded-lg shadow-lg z-50 ${
            toast.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          } animate-fade-in text-sm`}>
            {toast.message}
          </div>
        )}

        {renderTabContent()}
      </div>
    </div>
  );
}

interface Card {
  id: number;
  image: string;
  imagePosition?: string;
  lyric: string[];
  blessing: string;
  source: string;
  status: 'enabled' | 'disabled';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

function CardManagement() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [formData, setFormData] = useState({
    image: null as File | null,
    lyric: '',
    blessing: '',
    source: '',
    imagePosition: 'center center',
    sortOrder: 0,
    status: 'enabled' as 'enabled' | 'disabled',
  });
  const [imagePreview, setImagePreview] = useState('');
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const sessionId = sessionStorage.getItem('admin_session');
      const res = await fetch('/api/admin/cards', {
        headers: { 'x-session-id': sessionId || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setCards(data);
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    }
    setLoading(false);
  };

  const handleOpenModal = (card?: Card) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        image: null,
        lyric: card.lyric.join('\n'),
        blessing: card.blessing,
        source: card.source,
        imagePosition: card.imagePosition || 'center center',
        sortOrder: card.sortOrder,
        status: card.status,
      });
      setImagePreview(card.image);
    } else {
      setEditingCard(null);
      setFormData({
        image: null,
        lyric: '',
        blessing: '',
        source: '',
        imagePosition: 'center center',
        sortOrder: 0,
        status: 'enabled',
      });
      setImagePreview('');
    }
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sessionId = sessionStorage.getItem('admin_session');
    
    const form = new FormData();
    if (formData.image) form.append('image', formData.image);
    form.append('lyric', formData.lyric);
    form.append('blessing', formData.blessing);
    form.append('source', formData.source);
    form.append('imagePosition', formData.imagePosition);
    form.append('sortOrder', formData.sortOrder.toString());
    form.append('status', formData.status);

    try {
      let res;
      if (editingCard) {
        res = await fetch(`/api/admin/cards/${editingCard.id}`, {
          method: 'PUT',
          headers: { 'x-session-id': sessionId || '' },
          body: form,
        });
      } else {
        res = await fetch('/api/admin/cards', {
          method: 'POST',
          headers: { 'x-session-id': sessionId || '' },
          body: form,
        });
      }

      if (res.ok) {
        setToast({ type: 'success', message: editingCard ? '更新成功' : '创建成功' });
        setShowModal(false);
        fetchCards();
      } else {
        const data = await res.json();
        setToast({ type: 'error', message: data.error || '操作失败' });
      }
    } catch (error) {
      setToast({ type: 'error', message: '操作失败' });
    }
  };

  const handleDelete = async (id: number) => {
    const sessionId = sessionStorage.getItem('admin_session');
    try {
      const res = await fetch(`/api/admin/cards/${id}`, {
        method: 'DELETE',
        headers: { 'x-session-id': sessionId || '' },
      });
      if (res.ok) {
        setToast({ type: 'success', message: '删除成功' });
        fetchCards();
      } else {
        const data = await res.json();
        setToast({ type: 'error', message: data.error || '删除失败' });
      }
    } catch (error) {
      setToast({ type: 'error', message: '删除失败' });
    }
    setShowDeleteConfirm(null);
  };

  const handleToggleStatus = async (id: number, currentStatus: 'enabled' | 'disabled') => {
    const sessionId = sessionStorage.getItem('admin_session');
    const form = new FormData();
    form.append('status', currentStatus === 'enabled' ? 'disabled' : 'enabled');
    
    try {
      const res = await fetch(`/api/admin/cards/${id}`, {
        method: 'PUT',
        headers: { 'x-session-id': sessionId || '' },
        body: form,
      });
      if (res.ok) {
        setToast({ type: 'success', message: currentStatus === 'enabled' ? '已停用' : '已启用' });
        fetchCards();
      } else {
        const data = await res.json();
        setToast({ type: 'error', message: data.error || '操作失败' });
      }
    } catch (error) {
      setToast({ type: 'error', message: '操作失败' });
    }
  };

  const filteredCards = cards.filter(card => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return card.lyric.some(l => l.toLowerCase().includes(query)) || 
           card.blessing.toLowerCase().includes(query);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative max-w-md flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索歌词或祝福词..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-sm"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="ml-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7faacc] to-[#a8c5d9] text-white text-sm font-medium hover:shadow-lg transition-all"
        >
          新增卡片
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-[#a8c5d9] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#7a8a9a] text-sm">加载中...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">图片</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">歌词</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">祝福词</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">状态</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">后台排序</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">更新时间</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map(card => (
                <tr key={card.id} className="border-b border-gray-100 hover:bg-white/30">
                  <td className="py-3 px-3">
                    <img src={card.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  </td>
                  <td className="py-3 px-3 max-w-xs truncate">
                    {card.lyric.slice(0, 2).join('')}
                  </td>
                  <td className="py-3 px-3">{card.blessing}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      card.status === 'enabled' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {card.status === 'enabled' ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="py-3 px-3">{card.sortOrder}</td>
                  <td className="py-3 px-3 text-xs text-gray-400">
                    {new Date(card.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenModal(card)}
                        className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-500 hover:bg-blue-100"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => window.open(card.image, '_blank')}
                        className="px-2 py-1 rounded text-xs bg-gray-50 text-gray-500 hover:bg-gray-100"
                      >
                        预览
                      </button>
                      <button
                        onClick={() => handleToggleStatus(card.id, card.status)}
                        className={`px-2 py-1 rounded text-xs ${
                          card.status === 'enabled' 
                            ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' 
                            : 'bg-green-50 text-green-500 hover:bg-green-100'
                        }`}
                      >
                        {card.status === 'enabled' ? '停用' : '启用'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(card.id)}
                        className="px-2 py-1 rounded text-xs bg-red-50 text-red-500 hover:bg-red-100"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-medium mb-4">{editingCard ? '编辑卡片' : '新增卡片'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">图片</label>
                {imagePreview && (
                  <img src={imagePreview} alt="预览" className="w-full h-32 object-cover rounded-lg mb-2" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">歌词或短句</label>
                <textarea
                  value={formData.lyric}
                  onChange={(e) => setFormData(prev => ({ ...prev, lyric: e.target.value }))}
                  placeholder="每行一句歌词"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">祝福词 *</label>
                <input
                  type="text"
                  value={formData.blessing}
                  onChange={(e) => setFormData(prev => ({ ...prev, blessing: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">来源</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">后台排序</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">仅影响后台列表展示，不影响前台随机发卡</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'enabled' | 'disabled' }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="enabled">启用</option>
                    <option value="disabled">停用</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#7faacc] to-[#a8c5d9] text-white rounded-lg text-sm"
                >
                  {editingCard ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="text-base font-medium mb-2">确认删除？</h4>
            <p className="text-sm text-gray-500 mb-4">删除后该卡片将不再参与随机展示</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          toast.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

interface Question {
  id: number;
  question: string;
  correctAnswer: string;
  otherAnswers: string[];
  hint: string;
  status: 'enabled' | 'disabled';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

function QuestionManagement() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    correctAnswer: '',
    otherAnswers: [''],
    hint: '',
    sortOrder: 0,
    status: 'enabled' as 'enabled' | 'disabled',
  });
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const sessionId = sessionStorage.getItem('admin_session');
      const res = await fetch('/api/admin/questions', {
        headers: { 'x-session-id': sessionId || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
    setLoading(false);
  };

  const handleOpenModal = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        question: question.question,
        correctAnswer: question.correctAnswer,
        otherAnswers: question.otherAnswers.length > 0 ? [...question.otherAnswers] : [''],
        hint: question.hint,
        sortOrder: question.sortOrder,
        status: question.status,
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        question: '',
        correctAnswer: '',
        otherAnswers: [''],
        hint: '',
        sortOrder: 0,
        status: 'enabled',
      });
    }
    setShowModal(true);
  };

  const handleAddAnswer = () => {
    setFormData(prev => ({ ...prev, otherAnswers: [...prev.otherAnswers, ''] }));
  };

  const handleRemoveAnswer = (index: number) => {
    if (formData.otherAnswers.length > 1) {
      setFormData(prev => ({
        ...prev,
        otherAnswers: prev.otherAnswers.filter((_, i) => i !== index),
      }));
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      otherAnswers: prev.otherAnswers.map((a, i) => i === index ? value : a),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sessionId = sessionStorage.getItem('admin_session');
    const data = {
      question: formData.question,
      correctAnswer: formData.correctAnswer,
      otherAnswers: formData.otherAnswers.filter(a => a.trim()),
      hint: formData.hint,
      sortOrder: formData.sortOrder,
      status: formData.status,
    };

    try {
      let res;
      if (editingQuestion) {
        res = await fetch(`/api/admin/questions/${editingQuestion.id}`, {
          method: 'PUT',
          headers: { 
            'x-session-id': sessionId || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 
            'x-session-id': sessionId || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        setToast({ type: 'success', message: editingQuestion ? '更新成功' : '创建成功' });
        setShowModal(false);
        fetchQuestions();
      } else {
        const resData = await res.json();
        setToast({ type: 'error', message: resData.error || '操作失败' });
      }
    } catch (error) {
      setToast({ type: 'error', message: '操作失败' });
    }
  };

  const handleDuplicate = async (question: Question) => {
    const sessionId = sessionStorage.getItem('admin_session');
    const data = {
      question: question.question + ' (副本)',
      correctAnswer: question.correctAnswer,
      otherAnswers: question.otherAnswers,
      hint: question.hint,
      sortOrder: question.sortOrder,
      status: 'disabled' as const,
    };

    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 
          'x-session-id': sessionId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setToast({ type: 'success', message: '复制成功' });
        fetchQuestions();
      } else {
        const resData = await res.json();
        setToast({ type: 'error', message: resData.error || '复制失败' });
      }
    } catch (error) {
      setToast({ type: 'error', message: '复制失败' });
    }
  };

  const handleDelete = async (id: number) => {
    const sessionId = sessionStorage.getItem('admin_session');
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
        headers: { 'x-session-id': sessionId || '' },
      });
      if (res.ok) {
        setToast({ type: 'success', message: '删除成功' });
        fetchQuestions();
      } else {
        const data = await res.json();
        setToast({ type: 'error', message: data.error || '删除失败' });
      }
    } catch (error) {
      setToast({ type: 'error', message: '删除失败' });
    }
    setShowDeleteConfirm(null);
  };

  const handleToggleStatus = async (id: number, currentStatus: 'enabled' | 'disabled') => {
    const sessionId = sessionStorage.getItem('admin_session');
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'PUT',
        headers: { 
          'x-session-id': sessionId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: currentStatus === 'enabled' ? 'disabled' : 'enabled' }),
      });
      if (res.ok) {
        setToast({ type: 'success', message: currentStatus === 'enabled' ? '已停用' : '已启用' });
        fetchQuestions();
      } else {
        const data = await res.json();
        setToast({ type: 'error', message: data.error || '操作失败' });
      }
    } catch (error) {
      setToast({ type: 'error', message: '操作失败' });
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative max-w-md flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索题目内容..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-sm"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="ml-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7faacc] to-[#a8c5d9] text-white text-sm font-medium hover:shadow-lg transition-all"
        >
          新增题目
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-[#a8c5d9] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#7a8a9a] text-sm">加载中...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">题目内容</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">提示词</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">状态</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">排序</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">更新时间</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map(q => (
                <tr key={q.id} className="border-b border-gray-100 hover:bg-white/30">
                  <td className="py-3 px-3 max-w-xs truncate">{q.question}</td>
                  <td className="py-3 px-3">{q.hint || '-'}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      q.status === 'enabled' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {q.status === 'enabled' ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="py-3 px-3">{q.sortOrder}</td>
                  <td className="py-3 px-3 text-xs text-gray-400">
                    {new Date(q.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenModal(q)}
                        className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-500 hover:bg-blue-100"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDuplicate(q)}
                        className="px-2 py-1 rounded text-xs bg-gray-50 text-gray-500 hover:bg-gray-100"
                      >
                        复制
                      </button>
                      <button
                        onClick={() => handleToggleStatus(q.id, q.status)}
                        className={`px-2 py-1 rounded text-xs ${
                          q.status === 'enabled' 
                            ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' 
                            : 'bg-green-50 text-green-500 hover:bg-green-100'
                        }`}
                      >
                        {q.status === 'enabled' ? '停用' : '启用'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(q.id)}
                        className="px-2 py-1 rounded text-xs bg-red-50 text-red-500 hover:bg-red-100"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-medium mb-4">{editingQuestion ? '编辑题目' : '新增题目'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">题目内容 *</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标准答案 *</label>
                <input
                  type="text"
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">其他可接受答案</label>
                {formData.otherAnswers.map((answer, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      placeholder={`答案 ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    {formData.otherAnswers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAnswer(index)}
                        className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddAnswer}
                  className="px-3 py-2 text-blue-500 hover:bg-blue-50 rounded-lg text-sm"
                >
                  + 添加答案
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">提示词</label>
                <input
                  type="text"
                  value={formData.hint}
                  onChange={(e) => setFormData(prev => ({ ...prev, hint: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">排序值</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'enabled' | 'disabled' }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="enabled">启用</option>
                    <option value="disabled">停用</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#7faacc] to-[#a8c5d9] text-white rounded-lg text-sm"
                >
                  {editingQuestion ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="text-base font-medium mb-2">确认删除？</h4>
            <p className="text-sm text-gray-500 mb-4">删除后该题目将不再用于验证</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          toast.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  position: 'homepage' | 'message' | 'popup';
  status: 'draft' | 'published' | 'disabled';
  isPinned: boolean;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
}

function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    position: 'homepage' as 'homepage' | 'message' | 'popup',
    status: 'draft' as 'draft' | 'published' | 'disabled',
    isPinned: false,
    startTime: '',
    endTime: '',
  });
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState<Announcement | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const sessionId = sessionStorage.getItem('admin_session');
      const res = await fetch('/api/admin/announcements', {
        headers: { 'x-session-id': sessionId || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
    setLoading(false);
  };

  const handleOpenModal = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        position: announcement.position,
        status: announcement.status,
        isPinned: announcement.isPinned,
        startTime: announcement.startTime || '',
        endTime: announcement.endTime || '',
      });
    } else {
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        content: '',
        position: 'homepage',
        status: 'draft',
        isPinned: false,
        startTime: '',
        endTime: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sessionId = sessionStorage.getItem('admin_session');
    
    const startTime = formData.startTime || null;
    const endTime = formData.endTime || null;
    
    if (startTime && endTime && startTime > endTime) {
      setToast({ type: 'error', message: '开始时间不能晚于结束时间' });
      return;
    }

    const data = {
      title: formData.title,
      content: formData.content,
      position: formData.position,
      status: formData.status,
      isPinned: formData.isPinned,
      startTime,
      endTime,
    };

    try {
      let res;
      if (editingAnnouncement) {
        res = await fetch(`/api/admin/announcements/${editingAnnouncement.id}`, {
          method: 'PUT',
          headers: { 
            'x-session-id': sessionId || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch('/api/admin/announcements', {
          method: 'POST',
          headers: { 
            'x-session-id': sessionId || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        setToast({ type: 'success', message: editingAnnouncement ? '更新成功' : '创建成功' });
        setShowModal(false);
        fetchAnnouncements();
      } else {
        const resData = await res.json();
        setToast({ type: 'error', message: resData.error || '操作失败' });
      }
    } catch (error) {
      setToast({ type: 'error', message: '操作失败' });
    }
  };

  const handleDelete = async (id: number) => {
    const sessionId = sessionStorage.getItem('admin_session');
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'x-session-id': sessionId || '' },
      });
      if (res.ok) {
        setToast({ type: 'success', message: '删除成功' });
        fetchAnnouncements();
      } else {
        const data = await res.json();
        setToast({ type: 'error', message: data.error || '删除失败' });
      }
    } catch (error) {
      setToast({ type: 'error', message: '删除失败' });
    }
    setShowDeleteConfirm(null);
  };

  const handleToggleStatus = async (id: number, currentStatus: 'draft' | 'published' | 'disabled') => {
    const sessionId = sessionStorage.getItem('admin_session');
    const newStatus = currentStatus === 'published' ? 'disabled' : 'published';
    
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PUT',
        headers: { 
          'x-session-id': sessionId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setToast({ type: 'success', message: newStatus === 'published' ? '已发布' : '已停用' });
        fetchAnnouncements();
      } else {
        const data = await res.json();
        setToast({ type: 'error', message: data.error || '操作失败' });
      }
    } catch (error) {
      setToast({ type: 'error', message: '操作失败' });
    }
  };

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'homepage': return '首页';
      case 'message': return '留言页面';
      case 'popup': return '弹窗公告';
      default: return position;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'published': return '已发布';
      case 'disabled': return '已停用';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-600';
      case 'draft': return 'bg-yellow-100 text-yellow-600';
      case 'disabled': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const filteredAnnouncements = announcements.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative max-w-md flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索公告标题..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-sm"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="ml-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7faacc] to-[#a8c5d9] text-white text-sm font-medium hover:shadow-lg transition-all"
        >
          新增公告
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-[#a8c5d9] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#7a8a9a] text-sm">加载中...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">公告标题</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">展示位置</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">状态</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">开始时间</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">结束时间</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">置顶</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">更新时间</th>
                <th className="text-left py-3 px-3 font-medium text-[#5a7a94]">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnnouncements.map(a => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-white/30">
                  <td className="py-3 px-3 max-w-xs truncate">{a.title}</td>
                  <td className="py-3 px-3">{getPositionLabel(a.position)}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(a.status)}`}>
                      {getStatusLabel(a.status)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs">{a.startTime ? new Date(a.startTime).toLocaleDateString() : '-'}</td>
                  <td className="py-3 px-3 text-xs">{a.endTime ? new Date(a.endTime).toLocaleDateString() : '-'}</td>
                  <td className="py-3 px-3">
                    {a.isPinned ? (
                      <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    ) : null}
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-400">
                    {new Date(a.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenModal(a)}
                        className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-500 hover:bg-blue-100"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleToggleStatus(a.id, a.status)}
                        className={`px-2 py-1 rounded text-xs ${
                          a.status === 'published'
                            ? 'bg-orange-50 text-orange-500 hover:bg-orange-100'
                            : a.status === 'draft'
                            ? 'bg-green-50 text-green-500 hover:bg-green-100'
                            : 'bg-green-50 text-green-500 hover:bg-green-100'
                        }`}
                      >
                        {a.status === 'published' ? '停用' : a.status === 'draft' ? '发布' : '发布'}
                      </button>
                      <button
                        onClick={() => setShowPreview(a)}
                        className="px-2 py-1 rounded text-xs bg-gray-50 text-gray-500 hover:bg-gray-100"
                      >
                        预览
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(a.id)}
                        className="px-2 py-1 rounded text-xs bg-red-50 text-red-500 hover:bg-red-100"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-medium mb-4">{editingAnnouncement ? '编辑公告' : '新增公告'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">公告标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">公告内容 *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">展示位置</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value as 'homepage' | 'message' | 'popup' }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="homepage">首页</option>
                    <option value="message">留言页面</option>
                    <option value="popup">弹窗公告</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'disabled' }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="draft">草稿</option>
                    <option value="published">已发布</option>
                    <option value="disabled">已停用</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                    className="w-4 h-4 text-[#7faacc] rounded"
                  />
                  <span className="text-sm text-gray-700">置顶</span>
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">开始时间（可选）</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">结束时间（可选）</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#7faacc] to-[#a8c5d9] text-white rounded-lg text-sm"
                >
                  {editingAnnouncement ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">公告预览</h3>
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-800 mb-2">{showPreview.title}</h4>
              <p className="text-sm text-gray-600">{showPreview.content}</p>
            </div>
            <div className="text-xs text-gray-500 mb-4">
              <p>展示位置：{getPositionLabel(showPreview.position)}</p>
              <p>状态：{getStatusLabel(showPreview.status)}</p>
              <p>开始时间：{showPreview.startTime ? new Date(showPreview.startTime).toLocaleString() : '立即生效'}</p>
              <p>结束时间：{showPreview.endTime ? new Date(showPreview.endTime).toLocaleString() : '长期有效'}</p>
            </div>
            <button
              onClick={() => setShowPreview(null)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="text-base font-medium mb-2">确认删除？</h4>
            <p className="text-sm text-gray-500 mb-4">删除后该公告将不再展示</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          toast.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
