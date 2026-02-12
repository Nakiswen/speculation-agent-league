'use client';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

/**
 * 骨架屏组件
 * 脉冲动画 + 200ms cross-fade 过渡（通过 CSS transition 实现内容加载切换）
 */
export default function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/[0.06] transition-opacity duration-200 ease-in-out ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="加载中"
    />
  );
}
