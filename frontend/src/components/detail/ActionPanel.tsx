'use client';

import type { Agent } from '@/types';
import BetButton from '@/components/ui/BetButton';
import GlassCard from '@/components/ui/GlassCard';

interface ActionPanelProps {
  agent: Agent;
}

/**
 * 操作面板组件
 * 展示 Operator 信息和 Buy/Sell Terminal 按钮
 */
export default function ActionPanel({ agent }: ActionPanelProps) {
  return (
    <div className="space-y-6">
      {/* Operator 信息 */}
      <GlassCard>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
          Operator
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Creator</span>
            <span className="font-mono text-white/80">0x7a3b...f1c2</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Strategy</span>
            <span className="text-white/80">{agent.strategyTag}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Uptime</span>
            <span className="font-mono text-white/80">{agent.uptime}</span>
          </div>
        </div>
      </GlassCard>

      {/* Buy/Sell Terminal */}
      <GlassCard>
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-400">
          Terminal
        </h3>
        <div className="flex gap-3">
          <BetButton variant="buy" onClick={() => {}}>
            Buy
          </BetButton>
          <BetButton variant="sell" onClick={() => {}}>
            Sell
          </BetButton>
        </div>
      </GlassCard>
    </div>
  );
}
