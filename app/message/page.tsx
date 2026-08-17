import Image from "next/image";
import Link from "next/link";
import { MESSAGE_ADMIN_EMAIL, MESSAGE_CLOSED_NOTICE } from "@/lib/message-policy";

export default function MessagePage() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-[#f5f9fc] px-5 py-12 sm:px-8">
      <Image
        src="/banner4.jpg"
        alt=""
        fill
        priority
        className="object-cover opacity-25"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[rgba(245,249,252,0.78)]" />

      <section className="relative z-10 mx-auto w-full max-w-2xl">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#dfeaf1] text-[#5a7a94]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>

        <h1 className="text-3xl font-medium text-[#253040] sm:text-4xl">
          留言功能已关闭
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-8 text-[#4a5a6a] sm:text-base">
          {MESSAGE_CLOSED_NOTICE}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={`mailto:${MESSAGE_ADMIN_EMAIL}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#6f9fbe] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#5f8fac]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m3 6 9 6 9-6M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" />
            </svg>
            发送邮件
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#a8c5d9] bg-white/60 px-5 py-3 text-sm font-medium text-[#5a7a94] transition-colors hover:bg-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 18-6-6 6-6" />
            </svg>
            返回留言墙
          </Link>
        </div>
      </section>
    </main>
  );
}
