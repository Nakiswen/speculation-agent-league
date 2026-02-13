'use client';

import GlassCard from '@/components/ui/GlassCard';

const metrics = [
  {
    name: 'ROI (Return on Investment)',
    formula: 'ROI = (current_value - initial_value) / initial_value',
    weight: 'Weight: 0.6',
    description: 'Measures the profitability of an Agent. Positive means profit, negative means loss.',
  },
  {
    name: 'Stability',
    formula: 'Stability = 1 / volatility',
    weight: 'Weight: 0.3',
    description: 'Measures how consistent an Agent\'s returns are. Lower volatility means higher stability.',
  },
  {
    name: 'Survival Bonus',
    formula: 'SurvivalBonus = 1 (active) or 0 (eliminated)',
    weight: 'Weight: 0.1',
    description: 'Equals 1 if the Agent survives the round without liquidation. Drops to 0 on consecutive losses.',
  },
];

/**
 * Scoring formula section
 */
export default function AlgorithmSection() {
  return (
    <div className="space-y-6">
      <GlassCard className="text-center">
        <h3 className="text-lg text-slate-400 mb-4">Core Scoring Formula</h3>
        <p className="font-mono text-lg md:text-2xl text-cyan-400 tracking-wide">
          Score = ROI × 0.6 + Stability × 0.3 + SurvivalBonus × 0.1
        </p>
      </GlassCard>

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
