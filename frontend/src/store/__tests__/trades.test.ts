import { describe, it, expect } from 'vitest';
import { createStore } from 'jotai';
import { tradesAtom, tradesByAgentAtom } from '@/store/trades';

describe('tradesAtom', () => {
  it('应使用 mock 数据初始化', () => {
    const store = createStore();
    const trades = store.get(tradesAtom);
    expect(trades.length).toBeGreaterThan(0);
    expect(trades[0]).toHaveProperty('agentId');
    expect(trades[0]).toHaveProperty('txHash');
  });
});

describe('tradesByAgentAtom', () => {
  it('应按 agentId 过滤交易记录', () => {
    const store = createStore();
    const momentumTrades = store.get(tradesByAgentAtom('momentum-bot'));

    expect(momentumTrades.length).toBeGreaterThan(0);
    momentumTrades.forEach((t) => {
      expect(t.agentId).toBe('momentum-bot');
    });
  });

  it('不存在的 agentId 应返回空数组', () => {
    const store = createStore();
    const trades = store.get(tradesByAgentAtom('nonexistent-agent'));
    expect(trades).toEqual([]);
  });

  it('不同 Agent 的交易记录不应混淆', () => {
    const store = createStore();
    const momentumTrades = store.get(tradesByAgentAtom('momentum-bot'));
    const randomTrades = store.get(tradesByAgentAtom('random-bot'));

    const momentumIds = new Set(momentumTrades.map((t) => t.id));
    const randomIds = new Set(randomTrades.map((t) => t.id));

    // 两个 Agent 的交易记录不应有交集
    momentumIds.forEach((id) => {
      expect(randomIds.has(id)).toBe(false);
    });
  });
});
