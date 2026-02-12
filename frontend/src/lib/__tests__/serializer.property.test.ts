import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { serializeAgent, deserializeAgent } from '../serializer';
import type { Agent, AgentStrategy, RankDirection } from '@/types';

/**
 * 构建一个智能的 Agent arbitrary，约束到有效的输入空间
 */
const agentStrategyArb: fc.Arbitrary<AgentStrategy> = fc.constantFrom(
  'momentum',
  'mean-revert',
  'random',
  'conservative',
  'aggressive',
);

const rankDirectionArb: fc.Arbitrary<RankDirection> = fc.constantFrom(
  'up',
  'down',
  'stable',
);

const streakTypeArb: fc.Arbitrary<'win' | 'lose' | 'none'> = fc.constantFrom(
  'win',
  'lose',
  'none',
);

const survivalBonusArb: fc.Arbitrary<0 | 1> = fc.constantFrom(0 as const, 1 as const);

/**
 * JSON 安全的 double 生成器
 * 排除 -0，因为 JSON.stringify(-0) === "0"，往返后 -0 变为 0，
 * 这是 JSON 规范的固有行为，不影响业务语义。
 */
const jsonSafeDouble = (opts: { min: number; max: number }) =>
  fc
    .double({ ...opts, noNaN: true, noDefaultInfinity: true })
    .map((v) => (Object.is(v, -0) ? 0 : v));

/**
 * 生成有效的 Agent 对象
 * 使用 JSON 安全的数值范围，避免 NaN/Infinity/-0 导致序列化问题
 */
const agentArb: fc.Arbitrary<Agent> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  strategyTag: fc.string({ minLength: 1, maxLength: 50 }),
  strategy: agentStrategyArb,
  avatarUrl: fc.string({ minLength: 1, maxLength: 200 }),
  roi: jsonSafeDouble({ min: -1e6, max: 1e6 }),
  stability: jsonSafeDouble({ min: 0, max: 1e6 }),
  survivalBonus: survivalBonusArb,
  score: jsonSafeDouble({ min: -1e6, max: 1e6 }),
  rank: fc.integer({ min: 1, max: 1000 }),
  rankChange: fc.record({
    direction: rankDirectionArb,
    delta: fc.integer({ min: 0, max: 100 }),
  }),
  streak: fc.record({
    type: streakTypeArb,
    count: fc.integer({ min: 0, max: 1000 }),
  }),
  uptime: fc.string({ minLength: 1, maxLength: 50 }),
  winRate: jsonSafeDouble({ min: 0, max: 1 }),
});

/**
 * Property 3: Agent 序列化往返一致性
 * **Validates: Requirements 6.1, 6.2, 6.3**
 *
 * Feature: speculation-agent-league, Property 3: Agent serialization round-trip
 *
 * For any 有效的 Agent 对象，执行 deserializeAgent(serializeAgent(agent))
 * 应产生与原始 Agent 对象深度相等的结果。
 */
describe('Property 3: Agent 序列化往返一致性', () => {
  it('deserializeAgent(serializeAgent(agent)) 应与原始 Agent 深度相等', () => {
    fc.assert(
      fc.property(agentArb, (agent) => {
        const roundTripped = deserializeAgent(serializeAgent(agent));
        expect(roundTripped).toEqual(agent);
      }),
      { numRuns: 100 },
    );
  });
});
