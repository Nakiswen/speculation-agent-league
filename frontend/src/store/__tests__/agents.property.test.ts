import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createStore } from 'jotai';
import { agentsAtom, sortedAgentsAtom } from '@/store/agents';
import type { Agent, AgentStrategy, RankDirection } from '@/types';

/**
 * Agent 生成器：生成符合 Agent 接口的随机数据
 * 使用智能约束确保生成的数据在合理范围内
 */
const agentStrategyArb = fc.constantFrom<AgentStrategy>(
  'momentum',
  'mean-revert',
  'random',
  'conservative',
  'aggressive',
);

const rankDirectionArb = fc.constantFrom<RankDirection>('up', 'down', 'stable');

const agentArb: fc.Arbitrary<Agent> = fc
  .record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    strategyTag: fc.string({ minLength: 1, maxLength: 15 }),
    strategy: agentStrategyArb,
    avatarUrl: fc.constant('/avatar.svg'),
    roi: fc.double({ min: -100, max: 500, noNaN: true, noDefaultInfinity: true }),
    stability: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
    survivalBonus: fc.constantFrom<0 | 1>(0, 1),
    score: fc.double({ min: -100, max: 500, noNaN: true, noDefaultInfinity: true }),
    rank: fc.integer({ min: 1, max: 100 }),
    rankChange: fc.record({
      direction: rankDirectionArb,
      delta: fc.integer({ min: 0, max: 10 }),
    }),
    streak: fc.record({
      type: fc.constantFrom<'win' | 'lose' | 'none'>('win', 'lose', 'none'),
      count: fc.integer({ min: 0, max: 50 }),
    }),
    uptime: fc.string({ minLength: 1, maxLength: 10 }),
    winRate: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
  });

/**
 * Property 6: Leaderboard 排序不变量
 * **Validates: Requirements 7.4, 12.3**
 *
 * For any Agent 列表，经过 sortedAgentsAtom 派生后的列表中，
 * 每个 Agent 的 Score 应大于等于其后一个 Agent 的 Score（降序排列不变量）。
 *
 * Feature: speculation-agent-league, Property 6: Leaderboard sort invariant
 */
describe('Property 6: Leaderboard 排序不变量', () => {
  it('sortedAgentsAtom 应始终按 Score 降序排列', () => {
    fc.assert(
      fc.property(
        fc.array(agentArb, { minLength: 0, maxLength: 20 }),
        (agents) => {
          const store = createStore();
          store.set(agentsAtom, agents);

          const sorted = store.get(sortedAgentsAtom);

          // 排序后长度应与原始列表一致
          expect(sorted).toHaveLength(agents.length);

          // 降序不变量：每个元素的 score >= 下一个元素的 score
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].score).toBeGreaterThanOrEqual(sorted[i + 1].score);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('排序不应丢失或新增任何 Agent', () => {
    fc.assert(
      fc.property(
        fc.array(agentArb, { minLength: 0, maxLength: 20 }),
        (agents) => {
          const store = createStore();
          store.set(agentsAtom, agents);

          const sorted = store.get(sortedAgentsAtom);

          // 排序后的 id 集合应与原始列表完全一致
          const originalIds = agents.map((a) => a.id).sort();
          const sortedIds = sorted.map((a) => a.id).sort();
          expect(sortedIds).toEqual(originalIds);
        },
      ),
      { numRuns: 100 },
    );
  });
});
