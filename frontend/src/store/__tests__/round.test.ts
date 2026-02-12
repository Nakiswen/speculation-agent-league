import { describe, it, expect } from 'vitest';
import { createStore } from 'jotai';
import { roundAtom } from '@/store/round';

describe('roundAtom', () => {
  it('应使用 mock 数据初始化', () => {
    const store = createStore();
    const round = store.get(roundAtom);
    expect(round).not.toBeNull();
    expect(round?.id).toBe(42);
    expect(round?.status).toBe('active');
  });

  it('应包含完整的 Round 字段', () => {
    const store = createStore();
    const round = store.get(roundAtom);
    expect(round).toHaveProperty('startTime');
    expect(round).toHaveProperty('endTime');
    expect(round).toHaveProperty('remainingSeconds');
    expect(round).toHaveProperty('totalTrades');
  });
});
