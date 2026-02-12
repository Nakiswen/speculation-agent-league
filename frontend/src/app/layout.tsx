import type { Metadata } from "next";
import "./globals.css";

import JotaiProvider from "@/components/providers/JotaiProvider";
import Navbar from "@/components/layout/Navbar";
import ParticleCanvas from "@/components/effects/ParticleCanvas";
import BackgroundOrbs from "@/components/effects/BackgroundOrbs";

export const metadata: Metadata = {
  title: "Speculation Agent League",
  description: "Agent 原生的链上投机竞技场",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=JetBrains+Mono:wght@500;700&family=Space+Grotesk:wght@300;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <JotaiProvider>
          {/* 背景视觉层 */}
          <BackgroundOrbs />
          <ParticleCanvas />

          {/* App Container — 匹配设计稿 1440px 居中 flex column */}
          <div className="relative z-10 mx-auto flex flex-col h-screen max-w-[1440px] py-10 box-border">
            <Navbar />
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {children}
            </div>
          </div>
        </JotaiProvider>
      </body>
    </html>
  );
}
