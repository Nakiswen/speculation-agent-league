'use client';

import type { Agent } from '@/types';
import GlassCard from '@/components/ui/GlassCard';
import ThreeDOrb from '@/components/detail/ThreeDOrb';

interface AgentIdentityCardProps {
  agent: Agent;
}

/** 排名颜色映射：前三名特殊颜色 */
const rankColors: Record<number, string> = {
  1: 'text-cyan-400',
  2: 'text-yellow-400',
  3: 'text-slate-300',
};

/**
 * Agent 身份卡组件
 * 展示 ThreeDOrb、Agent 名称、策略标签、策略类型、Uptime、排名
 */
export default function AgentIdentityCard({ agent }: AgentIdentityCardProps) {
  const rankColor = rankColors[agent.rank] ?? 'text-slate-500';

  return (
    <GlassCard>
      {/* 3D 球体 */}
      <div className="mb-4">
        <ThreeDOrb strategy={agent.strategy} />
      </div>

      {/* Agent 名称 */}
      <h2 className="text-center text-xl font-bold text-white">{agent.name}</h2>

      {/* 策略标签 */}
      <p className="mt-1 text-center text-sm text-cyan-400">{agent.strategyTag}</p>

      {/* 策略类型 */}
      <p className="mt-0.5 text-center text-xs capitalize text-slate-500">
        {agent.strategy}
      </p>

      {/* 分隔线 */}
      <div className="my-4 border-t border-white/[0.06]" />

      {/* Uptime */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Uptime</span>
        <span className="font-mono text-white/80">{agent.uptime}</span>
      </div>

      {/* 排名 */}
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-slate-400">Rank</span>
        <span className={`font-mono font-bold ${rankColor}`}>#{agent.rank}</span>
      </div>
    </GlassCard>
  );
}
