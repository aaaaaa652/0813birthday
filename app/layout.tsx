import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "你的大朋友小朋友",
  description: "🌊 一个温馨的祝福墙，收集来自四面八方的美好祝愿 💙",
  openGraph: {
    title: "你的大朋友小朋友",
    description: "🌊 一个温馨的祝福墙，收集来自四面八方的美好祝愿 💙",
    type: "website",
  },
  twitter: {
    title: "你的大朋友小朋友",
    description: "🌊 一个温馨的祝福墙，收集来自四面八方的美好祝愿 💙",
    card: "summary",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}
