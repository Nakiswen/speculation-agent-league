import { describe, it, expect } from 'vitest';
import { createStore } from 'jotai';
import { agentsAtom, sortedAgentsAtom, agentByIdAtom } from '@/store/agents';
import type { Agent } from '@/types';

/** 创建测试用 Agent 数据 */
function makeAgent(overrides: Partial<Agent> & { id: string; score: number }): Agent {
  return {
    name: overrides.id,
    strategyTag: 'Test',
    strategy: 'momentum',
    avatarUrl: '/test.svg',
    roi: 10,
    stability: 50,
    survivalBonus: 1,
    rank: 1,
    rankChange: { direction: 'stable', delta: 0 },
    streak: { type: 'none', count: 0 },
    uptime: '1h',
    winRate: 50,
    ...overrides,
  };
}

describe('agentsAtom', () => {
  it('应使用 mock 数据初始化', () => {
    const store = createStore();
    const agents = store.get(agentsAtom);
    expect(agents.length).toBe(5);
    expect(agents.map((a) => a.id)).toContain('momentum-bot');
  });
});

describe('sortedAgentsAtom', () => {
  it('应按 Score 降序排列', () => {
    const store = createStore();
    const sorted = store.get(sortedAgentsAtom);

    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].score).toBeGreaterThanOrEqual(sorted[i + 1].score);
    }
  });

  it('自定义数据也应按 Score 降序排列', () => {
    const store = createStore();
    const agents = [
      makeAgent({ id: 'low', score: 10 }),
      makeAgent({ id: 'high', score: 90 }),
      makeAgent({ id: 'mid', score: 50 }),
    ];
    store.set(agentsAtom, agents);

    const sorted = store.get(sortedAgentsAtom);
    expect(sorted.map((a) => a.id)).toEqual(['high', 'mid', 'low']);
  });

  it('空列表应返回空数组', () => {
    const store = createStore();
    store.set(agentsAtom, []);
    expect(store.get(sortedAgentsAtom)).toEqual([]);
  });

  it('不应修改原始 agentsAtom 的顺序', () => {
    const store = createStore();
    const agents = [
      makeAgent({ id: 'c', score: 10 }),
      makeAgent({ id: 'a', score: 90 }),
      makeAgent({ id: 'b', score: 50 }),
    ];
    store.set(agentsAtom, agents);

    store.get(sortedAgentsAtom);
    const original = store.get(agentsAtom);
    expect(original.map((a) => a.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('agentByIdAtom', () => {
  it('应根据 ID 返回对应 Agent', () => {
    const store = createStore();
    const agent = store.get(agentByIdAtom('momentum-bot'));
    expect(agent).toBeDefined();
    expect(agent?.name).toBe('MomentumBot');
  });

  it('ID 不存在时应返回 undefined', () => {
    const store = createStore();
    const agent = store.get(agentByIdAtom('nonexistent'));
    expect(agent).toBeUndefined();
  });
});
