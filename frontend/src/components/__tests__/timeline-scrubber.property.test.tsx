import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { render, fireEvent } from '@testing-library/react';
import TimelineScrubber from '../archive/TimelineScrubber';

/**
 * Property 11: Timeline Scrubber 时间同步
 * **Validates: Requirements 9.4**
 *
 * For any 有效的时间戳（在 Round 的 startTime 和 endTime 之间），
 * 当 Timeline_Scrubber 的值设置为该时间戳时，`onTimeChange` 回调应被调用并传入该时间戳值。
 *
 * Feature: speculation-agent-league, Property 11: Timeline time sync
 */

/**
 * 智能时间范围生成器：
 * 1. 生成合理的 startTime（毫秒级时间戳）
 * 2. endTime 始终大于 startTime（至少间隔 1000ms）
 * 3. targetTime 在 [startTime, endTime] 范围内
 */
const timelineArbitrary = fc
  .record({
    startTime: fc.integer({ min: 1_700_000_000_000, max: 1_800_000_000_000 }),
    duration: fc.integer({ min: 1000, max: 3_600_000 }),
  })
  .chain(({ startTime, duration }) => {
    const endTime = startTime + duration;
    return fc.record({
      startTime: fc.constant(startTime),
      endTime: fc.constant(endTime),
      targetTime: fc.integer({ min: startTime, max: endTime }),
    });
  });

describe('Property 11: Timeline Scrubber 时间同步', () => {
  it('当滑块值设置为有效时间戳时，onTimeChange 回调应被调用并传入该时间戳值', () => {
    fc.assert(
      fc.property(timelineArbitrary, ({ startTime, endTime, targetTime }) => {
        const onTimeChange = vi.fn();

        const { unmount } = render(
          <TimelineScrubber
            startTime={startTime}
            endTime={endTime}
            currentTime={startTime}
            onTimeChange={onTimeChange}
          />,
        );

        // 获取 range input 元素
        const slider = document.querySelector('input[type="range"]');
        expect(slider).not.toBeNull();

        // 模拟用户拖动滑块到 targetTime
        fireEvent.change(slider!, { target: { value: String(targetTime) } });

        // 验证 onTimeChange 被调用且传入正确的时间戳
        expect(onTimeChange).toHaveBeenCalledTimes(1);
        expect(onTimeChange).toHaveBeenCalledWith(targetTime);

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
