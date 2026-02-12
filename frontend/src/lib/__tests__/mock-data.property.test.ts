import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getMockAgents, getMockTrades, getMockRoiHistory } from '../mock-data';
import type { Agent, TradeRecord, RoiDataPoint } from '@/types';

/**
 * Property 4: Agent 数据字段完整性
 * Validates: Requirements 4.2, 4.5
 *
 * For any Mock_Data_Service 生成的 Agent 对象，该对象应包含所有必需字段：
 * id、name、strategyTag、strategy、avatarUrl、roi、stability、survivalBonus、
 * score、rank、rankChange（含 direction 和 delta）、streak（含 type 和 count）、
 * uptime、winRate。
 */
describe('Feature: speculation-agent-league, Property 4: Agent data field completeness', () => {
  const agents: Agent[] = getMockAgents();

  it('每个 Agent 应包含所有必需字段且类型正确', () => {
    const validStrategies = ['momentum', 'mean-revert', 'random', 'conservative', 'aggressive'] as const;
    const validRankDirections = ['up', 'down', 'stable'] as const;
    const validStreakTypes = ['win', 'lose', 'none'] as const;

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: agents.length - 1 }),
        (index) => {
          const agent = agents[index];

          // 顶层字符串字段
          expect(typeof agent.id).toBe('string');
          expect(agent.id.length).toBeGreaterThan(0);

          expect(typeof agent.name).toBe('string');
          expect(agent.name.length).toBeGreaterThan(0);

          expect(typeof agent.strategyTag).toBe('string');
          expect(agent.strategyTag.length).toBeGreaterThan(0);

          expect(typeof agent.strategy).toBe('string');
          expect(validStrategies).toContain(agent.strategy);

          expect(typeof agent.avatarUrl).toBe('string');
          expect(agent.avatarUrl.length).toBeGreaterThan(0);

          // 数值字段
          expect(typeof agent.roi).toBe('number');
          expect(Number.isFinite(agent.roi)).toBe(true);

          expect(typeof agent.stability).toBe('number');
          expect(Number.isFinite(agent.stability)).toBe(true);

          expect(typeof agent.survivalBonus).toBe('number');
          expect([0, 1]).toContain(agent.survivalBonus);

          expect(typeof agent.score).toBe('number');
          expect(Number.isFinite(agent.score)).toBe(true);

          expect(typeof agent.rank).toBe('number');
          expect(agent.rank).toBeGreaterThanOrEqual(1);

          // rankChange 嵌套对象
          expect(agent.rankChange).toBeDefined();
          expect(typeof agent.rankChange.direction).toBe('string');
          expect(validRankDirections).toContain(agent.rankChange.direction);
          expect(typeof agent.rankChange.delta).toBe('number');
          expect(Number.isFinite(agent.rankChange.delta)).toBe(true);

          // streak 嵌套对象
          expect(agent.streak).toBeDefined();
          expect(typeof agent.streak.type).toBe('string');
          expect(validStreakTypes).toContain(agent.streak.type);
          expect(typeof agent.streak.count).toBe('number');
          expect(Number.isInteger(agent.streak.count)).toBe(true);
          expect(agent.streak.count).toBeGreaterThanOrEqual(0);

          // uptime 和 winRate
          expect(typeof agent.uptime).toBe('string');
          expect(agent.uptime.length).toBeGreaterThan(0);

          expect(typeof agent.winRate).toBe('number');
          expect(Number.isFinite(agent.winRate)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 5: Mock 数据字段完整性
 * Validates: Requirements 4.3, 4.4
 *
 * For any Mock_Data_Service 生成的交易记录，该记录应包含所有必需字段：
 * id、timestamp、agentId、agentName、action、asset、pnl、txHash。
 * For any ROI 数据点，该数据点应包含 timestamp 和 value 字段。
 */
describe('Feature: speculation-agent-league, Property 5: Mock data field completeness', () => {
  const trades: TradeRecord[] = getMockTrades();
  const agents = getMockAgents();
  const agentIds = agents.map((a) => a.id);

  it('每条交易记录应包含所有必需字段且类型正确', () => {
    const validActions = ['buy', 'sell'] as const;

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: trades.length - 1 }),
        (index) => {
          const trade = trades[index];

          expect(typeof trade.id).toBe('string');
          expect(trade.id.length).toBeGreaterThan(0);

          expect(typeof trade.timestamp).toBe('number');
          expect(Number.isFinite(trade.timestamp)).toBe(true);
          expect(trade.timestamp).toBeGreaterThan(0);

          expect(typeof trade.agentId).toBe('string');
          expect(trade.agentId.length).toBeGreaterThan(0);

          expect(typeof trade.agentName).toBe('string');
          expect(trade.agentName.length).toBeGreaterThan(0);

          expect(typeof trade.action).toBe('string');
          expect(validActions).toContain(trade.action);

          expect(typeof trade.asset).toBe('string');
          expect(trade.asset.length).toBeGreaterThan(0);

          expect(typeof trade.pnl).toBe('number');
          expect(Number.isFinite(trade.pnl)).toBe(true);

          expect(typeof trade.txHash).toBe('string');
          expect(trade.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('每个 Agent 的 ROI 数据点应包含 timestamp 和 value 字段', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: agentIds.length - 1 }),
        (agentIndex) => {
          const agentId = agentIds[agentIndex];
          const roiPoints: RoiDataPoint[] = getMockRoiHistory(agentId);

          expect(roiPoints.length).toBeGreaterThan(0);

          for (const point of roiPoints) {
            expect(typeof point.timestamp).toBe('number');
            expect(Number.isFinite(point.timestamp)).toBe(true);
            expect(point.timestamp).toBeGreaterThan(0);

            expect(typeof point.value).toBe('number');
            expect(Number.isFinite(point.value)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
