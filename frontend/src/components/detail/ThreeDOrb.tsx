'use client';

import type { AgentStrategy } from '@/types';

interface ThreeDOrbProps {
  /** Agent 策略类型，决定球体颜色主题 */
  strategy: AgentStrategy;
  /** 球体直径，默认 120px */
  size?: number;
}

/** 策略类型对应的颜色主题 */
const strategyColors: Record<AgentStrategy, { inner: string; outer: string }> = {
  momentum: { inner: '#00F0FF', outer: '#0066FF' },
  'mean-revert': { inner: '#A855F7', outer: '#7000FF' },
  random: { inner: '#F59E0B', outer: '#D97706' },
  conservative: { inner: '#10B981', outer: '#059669' },
  aggressive: { inner: '#EF4444', outer: '#DC2626' },
};

/**
 * 3D 球体视觉组件
 * MVP 阶段：使用 CSS 径向渐变 + 脉冲动画实现球体效果
 * 通过 Agent 策略类型决定颜色主题
 */
export default function ThreeDOrb({ strategy, size = 120 }: ThreeDOrbProps) {
  const colors = strategyColors[strategy];

  return (
    <div className="flex items-center justify-center">
      <div
        className="rounded-full animate-[orbPulse_3s_ease-in-out_infinite]"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 35% 35%, ${colors.inner}, ${colors.outer} 60%, transparent 80%)`,
          boxShadow: `0 0 40px ${colors.inner}40, 0 0 80px ${colors.outer}20`,
        }}
      />
    </div>
  );
}
