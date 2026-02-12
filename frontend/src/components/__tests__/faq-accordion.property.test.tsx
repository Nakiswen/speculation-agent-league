import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { render, fireEvent } from '@testing-library/react';
import FaqAccordion from '../rules/FaqAccordion';
import type { FaqItem } from '@/types';

/**
 * Property 9: FAQ 折叠切换幂等性
 * **Validates: Requirements 10.5**
 *
 * For any FAQ 条目，执行两次点击切换操作后，该条目的展开/折叠状态应回到初始状态。
 *
 * Feature: speculation-agent-league, Property 9: FAQ toggle idempotence
 */

/** 智能 FaqItem 生成器：生成合理的问答内容 */
const faqItemArbitrary: fc.Arbitrary<FaqItem> = fc.record({
  question: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,49}$/).filter((s) => s.length >= 2),
  answer: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 .,]{0,99}$/).filter((s) => s.length >= 2),
});

/** 生成 1~6 条 FAQ 条目的列表 */
const faqListArbitrary = fc.array(faqItemArbitrary, {
  minLength: 1,
  maxLength: 6,
});

/** 生成有效的条目索引（基于列表长度） */
const faqWithIndexArbitrary = faqListArbitrary.chain((items) =>
  fc.record({
    items: fc.constant(items),
    targetIndex: fc.integer({ min: 0, max: items.length - 1 }),
  }),
);

/**
 * 判断某个 FAQ 条目是否处于展开状态。
 * 组件使用 grid-rows-[1fr] 表示展开，grid-rows-[0fr] 表示折叠。
 */
function isItemExpanded(container: HTMLElement, index: number): boolean {
  const buttons = container.querySelectorAll('button[type="button"]');
  const button = buttons[index];
  // 按钮的父级 div 包含答案区域的 grid 容器
  const itemDiv = button.closest('div.border');
  if (!itemDiv) return false;

  // 查找 grid 过渡容器（答案区域的直接包裹 div）
  const gridDiv = itemDiv.querySelector('.grid');
  if (!gridDiv) return false;

  return gridDiv.classList.contains('grid-rows-[1fr]');
}

describe('Property 9: FAQ 折叠切换幂等性', () => {
  it('对任意 FAQ 条目执行两次点击后，展开/折叠状态应回到初始状态', () => {
    fc.assert(
      fc.property(faqWithIndexArbitrary, ({ items, targetIndex }) => {
        const { unmount, container } = render(<FaqAccordion items={items} />);

        const buttons = container.querySelectorAll('button[type="button"]');
        const targetButton = buttons[targetIndex];

        // 记录初始状态（组件默认全部展开）
        const initialState = isItemExpanded(container, targetIndex);

        // 第一次点击：切换状态
        fireEvent.click(targetButton);
        const afterFirstClick = isItemExpanded(container, targetIndex);
        expect(afterFirstClick).toBe(!initialState);

        // 第二次点击：状态应回到初始
        fireEvent.click(targetButton);
        const afterSecondClick = isItemExpanded(container, targetIndex);
        expect(afterSecondClick).toBe(initialState);

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
