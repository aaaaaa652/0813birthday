"use client";

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

interface SiteStatsProps {
  messages: Message[];
}

export default function SiteStats({ messages }: SiteStatsProps) {
  // 统计参与人数（按昵称去重）
  const uniqueNames = new Set(messages.map(m => m.nickname.trim()).filter(Boolean));
  const participantCount = uniqueNames.size;

  // 统计留言数量
  const messageCount = messages.length;

  // 空数据处理
  const hasData = participantCount > 0 || messageCount > 0;

  if (!hasData) {
    return (
      <div className="container mx-auto px-5 sm:px-6 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center">
          <span className="text-sm sm:text-base text-[#7a9cb8]">
            还在等待第一位小朋友
          </span>
          <span className="hidden sm:inline text-[#a8c5d9]">·</span>
          <span className="text-sm sm:text-base text-[#7a9cb8]">
            祝福正在路上
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-5 sm:px-6 py-4 sm:py-5">
      <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-white/40 backdrop-blur-sm border border-white/40 shadow-[0_1px_4px_rgba(168,197,217,0.15)]">
        <span className="text-center">
          <span className="text-[20px] sm:text-[24px] md:text-[26px] font-medium text-[#4a6a85]">
            {participantCount}
          </span>
          <span className="text-[13px] sm:text-[14px] text-[#7a9cb8] ml-1.5">
            位小朋友来过这里
          </span>
        </span>
        <span className="w-px h-4 bg-[#c8d8e6] hidden sm:block" />
        <span className="text-center">
          <span className="text-[20px] sm:text-[24px] md:text-[26px] font-medium text-[#4a6a85]">
            {messageCount}
          </span>
          <span className="text-[13px] sm:text-[14px] text-[#7a9cb8] ml-1.5">
            条祝福被轻轻留下
          </span>
        </span>
      </div>
    </div>
  );
}