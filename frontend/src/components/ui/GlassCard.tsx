'use client';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 玻璃态卡片组件
 * Ethereal Glass 风格：半透明背景 + 模糊 + 细边框
 * 悬停时亮度提升至 brightness(1.05)，200ms 过渡
 * 入场动画：280ms cubic-bezier(0.22,1,0.36,1)
 */
export default function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`animate-glass-enter bg-white/[0.04] backdrop-blur-[40px] border border-white/[0.08] rounded-3xl p-6 transition-[filter] duration-200 ease-in-out hover:brightness-[1.05] ${className}`}
    >
      {children}
    </div>
  );
}
