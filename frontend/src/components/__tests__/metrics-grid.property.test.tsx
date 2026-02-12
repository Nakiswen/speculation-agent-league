import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { render, within } from '@testing-library/react';
import MetricsGrid from '../detail/MetricsGrid';
import type { Agent, AgentStrategy, RankDirection } from '@/types';

/**
 * Property 10: Metrics Grid 字段完整性
 * **Validates: Requirements 8.5**
 *
 * For any Agent 对象，Metrics Grid 渲染后应包含 ROI、Stability、Survival 状态和 Win Rate 四项指标，
 * 且每项指标的值应与 Agent 对象中的对应字段一致。
 *
 * Feature: speculation-agent-league, Property 10: Metrics grid completeness
 */

/** 智能 Agent 生成器：约束到合理的输入空间 */
const agentArbitrary: fc.Arbitrary<Agent> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  strategyTag: fc.string({ minLength: 1, maxLength: 20 }),
  strategy: fc.constantFrom<AgentStrategy>(
    'momentum',
    'mean-revert',
    'random',
    'conservative',
    'aggressive',
  ),
  avatarUrl: fc.webUrl(),
  roi: fc.double({ min: -999, max: 999, noNaN: true, noDefaultInfinity: true }),
  stability: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
  survivalBonus: fc.constantFrom<0 | 1>(0, 1),
  score: fc.double({ min: -500, max: 500, noNaN: true, noDefaultInfinity: true }),
  rank: fc.integer({ min: 1, max: 100 }),
  rankChange: fc.record({
    direction: fc.constantFrom<RankDirection>('up', 'down', 'stable'),
    delta: fc.integer({ min: 0, max: 50 }),
  }),
  streak: fc.record({
    type: fc.constantFrom<'win' | 'lose' | 'none'>('win', 'lose', 'none'),
    count: fc.integer({ min: 0, max: 20 }),
  }),
  uptime: fc.string({ minLength: 1, maxLength: 10 }),
  winRate: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
});


/**
 * 辅助函数：根据标签文本找到对应的 GlassCard 容器，然后在其中查找值
 * 避免当 ROI 和 Win Rate 值相同时（如都是 0.0%）出现多元素匹配问题
 */
function getCardByLabel(container: HTMLElement, label: string): HTMLElement {
  const labels = container.querySelectorAll('p');
  for (const p of labels) {
    if (p.textContent === label) {
      // 返回最近的 GlassCard 父容器（含 rounded-3xl 的 div）
      const card = p.closest('div[class*="rounded-3xl"]');
      if (card) return card as HTMLElement;
    }
  }
  throw new Error(`未找到标签为 "${label}" 的卡片`);
}

describe('Property 10: Metrics Grid 字段完整性', () => {
  it('渲染后应包含 ROI、Stability、Survival 状态和 Win Rate，且值与 Agent 对象一致', () => {
    fc.assert(
      fc.property(agentArbitrary, (agent) => {
        const { container, unmount } = render(<MetricsGrid agent={agent} />);

        // 1. ROI 卡片：值为 `{roi > 0 ? '+' : ''}{roi.toFixed(1)}%`
        const roiCard = getCardByLabel(container, 'ROI');
        const expectedRoi = `${agent.roi > 0 ? '+' : ''}${agent.roi.toFixed(1)}%`;
        expect(within(roiCard).getByText(expectedRoi)).toBeInTheDocument();

        // 2. Stability 卡片：值为 `stability.toFixed(1)`
        const stabilityCard = getCardByLabel(container, 'Stability');
        const expectedStability = agent.stability.toFixed(1);
        expect(within(stabilityCard).getByText(expectedStability)).toBeInTheDocument();

        // 3. Survival 卡片：survivalBonus === 1 → "Active"，0 → "Eliminated"
        const survivalCard = getCardByLabel(container, 'Survival');
        const expectedSurvival = agent.survivalBonus === 1 ? 'Active' : 'Eliminated';
        expect(within(survivalCard).getByText(expectedSurvival)).toBeInTheDocument();

        // 4. Win Rate 卡片：值为 `{winRate.toFixed(1)}%`
        const winRateCard = getCardByLabel(container, 'Win Rate');
        const expectedWinRate = `${agent.winRate.toFixed(1)}%`;
        expect(within(winRateCard).getByText(expectedWinRate)).toBeInTheDocument();

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
