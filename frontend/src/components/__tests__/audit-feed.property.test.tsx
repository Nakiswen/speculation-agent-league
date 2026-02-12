import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { render } from '@testing-library/react';
import AuditFeed from '../archive/AuditFeed';
import type { TradeRecord, TradeAction } from '@/types';

/**
 * Property 8: Audit Feed 字段与链接完整性
 * **Validates: Requirements 9.1, 9.2**
 *
 * For any 交易记录列表，Audit Feed 渲染后的每一行应包含时间戳、Agent 名称、操作类型、
 * 资产名称、盈亏金额，且 TX Hash 应渲染为包含正确 Monad Explorer URL 的可点击链接。
 *
 * Feature: speculation-agent-league, Property 8: Audit feed completeness
 */

/** 格式化时间戳为 HH:MM:SS（与组件内部逻辑一致） */
function formatTime(ts: number): string {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => n.toString().padStart(2, '0'))
    .join(':');
}

/** 智能 TradeRecord 生成器：确保每条记录的 id 唯一 */
const tradeRecordArbitrary: fc.Arbitrary<TradeRecord> = fc.record({
  id: fc.uuid(),
  timestamp: fc.integer({ min: 1_700_000_000_000, max: 1_800_000_000_000 }),
  agentId: fc.uuid(),
  agentName: fc.stringMatching(/^[A-Za-z][A-Za-z0-9]{0,19}$/),
  action: fc.constantFrom<TradeAction>('buy', 'sell'),
  asset: fc.stringMatching(/^[A-Z]{2,6}$/),
  pnl: fc.oneof(
    fc.double({ min: -9999, max: -0.01, noNaN: true, noDefaultInfinity: true }),
    fc.double({ min: 0.01, max: 9999, noNaN: true, noDefaultInfinity: true }),
  ),
  txHash: fc
    .array(fc.constantFrom(...'0123456789abcdef'.split('')), {
      minLength: 40,
      maxLength: 40,
    })
    .map((chars) => `0x${chars.join('')}`),
});

/** 生成 1~5 条交易记录的列表（id 唯一由 uuid 保证） */
const tradeListArbitrary = fc.array(tradeRecordArbitrary, {
  minLength: 1,
  maxLength: 5,
});

describe('Property 8: Audit Feed 字段与链接完整性', () => {
  it('每一行应包含时间戳、Agent 名称、操作类型、资产名称、盈亏金额，且 TX Hash 为可点击链接', () => {
    fc.assert(
      fc.property(tradeListArbitrary, (trades) => {
        const { unmount, container } = render(
          <AuditFeed trades={trades} highlightTimestamp={null} />,
        );

        // 获取所有行容器（每条交易对应一个顶层 div 子元素）
        const listContainer = container.firstElementChild;
        expect(listContainer).not.toBeNull();

        const rows = listContainer!.children;
        expect(rows.length).toBe(trades.length);

        for (let i = 0; i < trades.length; i++) {
          const trade = trades[i];
          const row = rows[i];
          const textContent = row.textContent ?? '';

          // 1. 时间戳
          const expectedTime = formatTime(trade.timestamp);
          expect(textContent).toContain(expectedTime);

          // 2. Agent 名称
          expect(textContent).toContain(trade.agentName);

          // 3. 操作类型（buy/sell）
          expect(textContent).toContain(trade.action);

          // 4. 资产名称
          expect(textContent).toContain(trade.asset);

          // 5. 盈亏金额
          const expectedPnl = trade.pnl.toFixed(2);
          expect(textContent).toContain(expectedPnl);

          // 6. TX Hash 链接：应为 <a> 标签，href 包含 txHash 和 monad explorer
          const link = row.querySelector('a');
          expect(link).not.toBeNull();
          expect(link!.getAttribute('href')).toContain(trade.txHash);
          expect(link!.getAttribute('href')).toContain('monad');
          expect(link!.getAttribute('target')).toBe('_blank');
          expect(link!.getAttribute('rel')).toContain('noopener');
          expect(link!.getAttribute('title')).toBe(trade.txHash);
        }

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
