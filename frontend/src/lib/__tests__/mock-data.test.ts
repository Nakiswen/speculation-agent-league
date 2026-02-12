import { describe, it, expect } from 'vitest';
import {
  getMockAgents,
  getMockTrades,
  getMockRoiHistory,
  getMockRound,
  getMockLeaguePulse,
} from '../mock-data';
import { calculateScore } from '../score-engine';

describe('getMockAgents', () => {
  const agents = getMockAgents();

  it('应返回 5 个预定义 Agent', () => {
    expect(agents).toHaveLength(5);
  });

  it('应包含所有预定义 Agent 名称', () => {
    const names = agents.map((a) => a.name);
    expect(names).toContain('MomentumBot');
    expect(names).toContain('MeanRevertBot');
    expect(names).toContain('RandomBot');
    expect(names).toContain('ConservativeBot');
    expect(names).toContain('AggroBot');
  });

  it('应按 Score 降序排列', () => {
    for (let i = 0; i < agents.length - 1; i++) {
      expect(agents[i].score).toBeGreaterThanOrEqual(agents[i + 1].score);
    }
  });

  it('排名应从 1 到 5 连续分配', () => {
    const ranks = agents.map((a) => a.rank).sort((a, b) => a - b);
    expect(ranks).toEqual([1, 2, 3, 4, 5]);
  });

  it('Score 应使用 calculateScore 正确计算', () => {
    for (const agent of agents) {
      const expected = calculateScore({
        roi: agent.roi,
        stability: agent.stability,
        survivalBonus: agent.survivalBonus,
      });
      expect(agent.score).toBeCloseTo(expected);
    }
  });

  it('每个 Agent 应包含所有必需字段', () => {
    for (const agent of agents) {
      expect(agent.id).toBeTruthy();
      expect(agent.name).toBeTruthy();
      expect(agent.strategyTag).toBeTruthy();
      expect(agent.strategy).toBeTruthy();
      expect(agent.avatarUrl).toBeTruthy();
      expect(typeof agent.roi).toBe('number');
      expect(typeof agent.stability).toBe('number');
      expect([0, 1]).toContain(agent.survivalBonus);
      expect(typeof agent.score).toBe('number');
      expect(typeof agent.rank).toBe('number');
      expect(agent.rankChange).toBeDefined();
      expect(['up', 'down', 'stable']).toContain(agent.rankChange.direction);
      expect(typeof agent.rankChange.delta).toBe('number');
      expect(agent.streak).toBeDefined();
      expect(['win', 'lose', 'none']).toContain(agent.streak.type);
      expect(typeof agent.streak.count).toBe('number');
      expect(agent.uptime).toBeTruthy();
      expect(typeof agent.winRate).toBe('number');
    }
  });

  it('每个 Agent 的策略类型应有效', () => {
    const validStrategies = ['momentum', 'mean-revert', 'random', 'conservative', 'aggressive'];
    for (const agent of agents) {
      expect(validStrategies).toContain(agent.strategy);
    }
  });
});


describe('getMockTrades', () => {
  const trades = getMockTrades();

  it('应返回约 20 条交易记录', () => {
    expect(trades.length).toBeGreaterThanOrEqual(15);
    expect(trades.length).toBeLessThanOrEqual(25);
  });

  it('每条交易记录应包含所有必需字段', () => {
    for (const trade of trades) {
      expect(trade.id).toBeTruthy();
      expect(typeof trade.timestamp).toBe('number');
      expect(trade.agentId).toBeTruthy();
      expect(trade.agentName).toBeTruthy();
      expect(['buy', 'sell']).toContain(trade.action);
      expect(trade.asset).toBeTruthy();
      expect(typeof trade.pnl).toBe('number');
      expect(trade.txHash).toBeTruthy();
      expect(trade.txHash).toMatch(/^0x[0-9a-f]{64}$/);
    }
  });

  it('交易记录应覆盖所有 5 个 Agent', () => {
    const agentIds = new Set(trades.map((t) => t.agentId));
    expect(agentIds.size).toBe(5);
  });

  it('交易记录的 agentName 应与 agentId 对应', () => {
    const agents = getMockAgents();
    const idToName = new Map(agents.map((a) => [a.id, a.name]));
    for (const trade of trades) {
      expect(idToName.get(trade.agentId)).toBe(trade.agentName);
    }
  });
});

describe('getMockRoiHistory', () => {
  it('应返回 24 个数据点', () => {
    const points = getMockRoiHistory('momentum-bot');
    expect(points).toHaveLength(24);
  });

  it('每个数据点应包含 timestamp 和 value', () => {
    const points = getMockRoiHistory('mean-revert-bot');
    for (const point of points) {
      expect(typeof point.timestamp).toBe('number');
      expect(typeof point.value).toBe('number');
    }
  });

  it('时间戳应按升序排列', () => {
    const points = getMockRoiHistory('aggro-bot');
    for (let i = 0; i < points.length - 1; i++) {
      expect(points[i].timestamp).toBeLessThan(points[i + 1].timestamp);
    }
  });

  it('不同 Agent 应返回不同的数据', () => {
    const momentum = getMockRoiHistory('momentum-bot');
    const conservative = getMockRoiHistory('conservative-bot');
    const momentumValues = momentum.map((p) => p.value);
    const conservativeValues = conservative.map((p) => p.value);
    expect(momentumValues).not.toEqual(conservativeValues);
  });

  it('未知 agentId 应返回默认数据点', () => {
    const points = getMockRoiHistory('unknown-agent');
    expect(points).toHaveLength(24);
  });
});

describe('getMockRound', () => {
  const round = getMockRound();

  it('应返回 active 状态的 Round', () => {
    expect(round.status).toBe('active');
  });

  it('应包含所有必需字段', () => {
    expect(typeof round.id).toBe('number');
    expect(typeof round.startTime).toBe('number');
    expect(typeof round.endTime).toBe('number');
    expect(typeof round.remainingSeconds).toBe('number');
    expect(typeof round.totalTrades).toBe('number');
  });

  it('endTime 应大于 startTime', () => {
    expect(round.endTime).toBeGreaterThan(round.startTime);
  });

  it('remainingSeconds 应为正数', () => {
    expect(round.remainingSeconds).toBeGreaterThan(0);
  });
});

describe('getMockLeaguePulse', () => {
  const pulse = getMockLeaguePulse();

  it('应包含所有统计字段', () => {
    expect(pulse.tvl).toBeTruthy();
    expect(typeof pulse.activeBots).toBe('number');
    expect(typeof pulse.totalBots).toBe('number');
    expect(typeof pulse.topRoi).toBe('number');
    expect(typeof pulse.roundTrades).toBe('number');
  });

  it('activeBots 应为 5', () => {
    expect(pulse.activeBots).toBe(5);
  });

  it('topRoi 应等于所有 Agent 中最高的 ROI', () => {
    const agents = getMockAgents();
    const maxRoi = Math.max(...agents.map((a) => a.roi));
    expect(pulse.topRoi).toBe(maxRoi);
  });
});
