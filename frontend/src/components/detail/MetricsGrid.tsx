'use client';

import type { Agent } from '@/types';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { getPnlColorClass } from '@/lib/color-mapping';
import { formatScore } from '@/lib/score-engine';

interface MetricsGridProps {
  agent: Agent;
}

/**
 * 指标网格组件
 * 2x2 布局展示 ROI、Stability、Survival 状态、Win Rate
 */
export default function MetricsGrid({ agent }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* ROI */}
      <GlassCard className="p-4">
        <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">ROI</p>
        <p className={`font-mono text-xl font-bold ${getPnlColorClass(agent.roi)}`}>
          {agent.roi > 0 ? '+' : ''}
          {agent.roi.toFixed(1)}%
        </p>
      </GlassCard>

      {/* Stability */}
      <GlassCard className="p-4">
        <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">Stability</p>
        <p className="font-mono text-xl font-bold text-white">
          {formatScore(agent.stability)}
        </p>
      </GlassCard>

      {/* Survival */}
      <GlassCard className="p-4">
        <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">Survival</p>
        <div className="mt-1">
          <StatusBadge
            status={agent.survivalBonus === 1 ? 'active' : 'eliminated'}
            label={agent.survivalBonus === 1 ? 'Active' : 'Eliminated'}
          />
        </div>
      </GlassCard>

      {/* Win Rate */}
      <GlassCard className="p-4">
        <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">Win Rate</p>
        <p className="font-mono text-xl font-bold text-white">
          {agent.winRate.toFixed(1)}%
        </p>
      </GlassCard>
    </div>
  );
}
