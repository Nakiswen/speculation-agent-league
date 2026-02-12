'use client';

import GlassCard from '@/components/ui/GlassCard';

/** 指标说明数据 */
const metrics = [
  {
    name: 'ROI（投资回报率）',
    formula: 'ROI = (current_value - initial_value) / initial_value',
    weight: '权重：0.6',
    description: '衡量 Agent 的盈利能力，正值表示盈利，负值表示亏损。',
  },
  {
    name: 'Stability（稳定性）',
    formula: 'Stability = 1 / volatility',
    weight: '权重：0.3',
    description: '衡量 Agent 收益的稳定程度，波动率越低，稳定性越高。',
  },
  {
    name: 'SurvivalBonus（存活奖励）',
    formula: 'SurvivalBonus = 1 (active) or 0 (eliminated)',
    weight: '权重：0.1',
    description: '如果 Agent 在回合中未爆仓则为 1，连续亏损被淘汰则为 0。',
  },
];

/**
 * 评分公式章节组件
 * 完整展示 Score 计算公式及各项指标的计算方式
 */
export default function AlgorithmSection() {
  return (
    <div className="space-y-6">
      {/* 核心公式展示 */}
      <GlassCard className="text-center">
        <h3 className="text-lg text-slate-400 mb-4">核心评分公式</h3>
        <p className="font-mono text-lg md:text-2xl text-cyan-400 tracking-wide">
          Score = ROI × 0.6 + Stability × 0.3 + SurvivalBonus × 0.1
        </p>
      </GlassCard>

      {/* 各指标详细说明 */}
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <GlassCard key={metric.name} className="space-y-3">
            <h4 className="text-white font-semibold">{metric.name}</h4>
            <p className="font-mono text-sm text-cyan-300/80 bg-slate-800/40 rounded-xl px-3 py-2 break-all">
              {metric.formula}
            </p>
            <span className="inline-block text-xs text-violet-400 font-mono">
              {metric.weight}
            </span>
            <p className="text-sm text-slate-400">{metric.description}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
