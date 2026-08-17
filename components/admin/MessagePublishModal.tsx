"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  MAX_MESSAGE_CONTENT_LENGTH,
  MAX_MESSAGE_IMAGE_SIZE,
  MAX_MESSAGE_NICKNAME_LENGTH,
} from "@/lib/message-policy";

export interface PublishedMessage {
  id: number;
  nickname: string;
  content: string;
  avatar: string;
  time: string;
  image: string | null;
  isPinned: boolean;
  pinnedAt: string | null;
}

interface MessagePublishModalProps {
  onClose: () => void;
  onPublished: (message: PublishedMessage) => void;
  onSessionExpired: () => void;
}

export default function MessagePublishModal({
  onClose,
  onPublished,
  onSessionExpired,
}: MessagePublishModalProps) {
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setError("");

    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    if (file.size > MAX_MESSAGE_IMAGE_SIZE) {
      setError("图片大小超过限制，请上传 5MB 以内的图片");
      event.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const normalizedNickname = nickname.trim();
    const normalizedContent = content.trim();

    if (!normalizedNickname) {
      setError("请输入昵称");
      return;
    }
    if (!normalizedContent) {
      setError("请输入留言内容");
      return;
    }

    const sessionId = sessionStorage.getItem("admin_session");
    if (!sessionId) {
      onSessionExpired();
      return;
    }

    const formData = new FormData();
    formData.append("nickname", normalizedNickname);
    formData.append("content", normalizedContent);
    if (imageFile) {
      formData.append("image", imageFile, imageFile.name);
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "x-session-id": sessionId },
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        onPublished(data.message);
        onClose();
        return;
      }

      if (response.status === 401) {
        onSessionExpired();
        return;
      }

      setError(data.error || "发布失败");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="关闭发布留言弹窗"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-message-title"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 id="publish-message-title" className="text-lg font-medium text-[#253040]">
              发布留言
            </h2>
            <p className="mt-1 text-xs text-[#7a8a9a]">发布后立即展示在留言墙</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#7a8a9a] transition-colors hover:bg-gray-100"
            title="关闭"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="message-nickname" className="mb-2 block text-sm font-medium text-gray-700">
              昵称
            </label>
            <input
              id="message-nickname"
              type="text"
              required
              autoFocus
              maxLength={MAX_MESSAGE_NICKNAME_LENGTH}
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-[#253040] outline-none transition focus:border-[#7faacc] focus:ring-1 focus:ring-[#7faacc]"
              placeholder="请输入昵称"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="message-content" className="text-sm font-medium text-gray-700">
                留言内容
              </label>
              <span className="text-xs text-gray-400">
                {content.length}/{MAX_MESSAGE_CONTENT_LENGTH}
              </span>
            </div>
            <textarea
              id="message-content"
              required
              rows={6}
              maxLength={MAX_MESSAGE_CONTENT_LENGTH}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm leading-relaxed text-[#253040] outline-none transition focus:border-[#7faacc] focus:ring-1 focus:ring-[#7faacc]"
              placeholder="请输入留言内容"
            />
          </div>

          <div>
            <label htmlFor="message-image" className="mb-2 block text-sm font-medium text-gray-700">
              图片（可选，最多 1 张）
            </label>
            {imagePreview && (
              <div className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                <Image
                  src={imagePreview}
                  alt="留言图片预览"
                  width={640}
                  height={320}
                  unoptimized
                  className="h-40 w-full object-contain"
                />
              </div>
            )}
            <input
              id="message-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#edf4f8] file:px-3 file:py-1.5 file:text-sm file:text-[#5a7a94]"
            />
            <p className="mt-1.5 text-xs text-gray-400">支持 JPG、PNG、WebP，大小不超过 5MB</p>
          </div>

          {error && (
            <div role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-[#6f9fbe] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5f8fac] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "发布中..." : "确认发布"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
