import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getPnlColorClass } from '../color-mapping';

/**
 * Property 7: 数值正负颜色映射正确性
 * **Validates: Requirements 7.5, 7.6, 9.6, 9.7**
 *
 * Feature: speculation-agent-league, Property 7: Value color mapping
 *
 * For any 数值（ROI 或 PnL），当数值为正时应映射为绿色（emerald）样式类，
 * 当数值为负时应映射为红色样式类。该映射函数对于所有有效数值输入应保持一致。
 */
describe('Property 7: 数值正负颜色映射正确性', () => {
  /** 正值生成器：排除 0、NaN、Infinity */
  const positiveArb = fc.double({
    min: Number.MIN_VALUE,
    max: 1e12,
    noNaN: true,
    noDefaultInfinity: true,
  });

  /** 负值生成器：排除 0、NaN、Infinity */
  const negativeArb = fc.double({
    min: -1e12,
    max: -Number.MIN_VALUE,
    noNaN: true,
    noDefaultInfinity: true,
  });

  it('正值应始终映射为绿色（emerald）样式类', () => {
    fc.assert(
      fc.property(positiveArb, (value) => {
        const result = getPnlColorClass(value);
        expect(result).toBe('text-emerald-400');
      }),
      { numRuns: 100 },
    );
  });

  it('负值应始终映射为红色样式类', () => {
    fc.assert(
      fc.property(negativeArb, (value) => {
        const result = getPnlColorClass(value);
        expect(result).toBe('text-red-400');
      }),
      { numRuns: 100 },
    );
  });

  it('颜色映射应对相同输入保持一致（幂等性）', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e12, max: 1e12, noNaN: true, noDefaultInfinity: true }),
        (value) => {
          const first = getPnlColorClass(value);
          const second = getPnlColorClass(value);
          expect(first).toBe(second);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('返回值应始终为三种有效颜色类之一', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e12, max: 1e12, noNaN: true, noDefaultInfinity: true }),
        (value) => {
          const result = getPnlColorClass(value);
          const validClasses = ['text-emerald-400', 'text-red-400', 'text-slate-400'];
          expect(validClasses).toContain(result);
        },
      ),
      { numRuns: 100 },
    );
  });
});
