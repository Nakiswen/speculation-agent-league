import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateScore, formatScore } from '../score-engine';

/**
 * Property 1: Score 计算正确性
 * Validates: Requirements 5.1, 5.2
 *
 * For any 有效的 ROI（任意浮点数）、Stability（任意非负浮点数）和 SurvivalBonus（0 或 1），
 * calculateScore 的返回值应精确等于 ROI × 0.6 + Stability × 0.3 + SurvivalBonus × 0.1
 */
describe('Property 1: Score 计算正确性', () => {
  it('calculateScore 应精确等于 ROI × 0.6 + Stability × 0.3 + SurvivalBonus × 0.1', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        fc.constantFrom(0, 1),
        (roi, stability, survivalBonus) => {
          const result = calculateScore({ roi, stability, survivalBonus });
          const expected = roi * 0.6 + stability * 0.3 + survivalBonus * 0.1;
          expect(result).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 2: Score 格式化正确性
 * Validates: Requirements 5.3, 5.4
 *
 * For any Score 数值（任意浮点数），formatScore 的返回值应为一个字符串，
 * 该字符串恰好包含一个小数点且小数点后恰好有一位数字。
 */
describe('Property 2: Score 格式化正确性', () => {
  it('formatScore 应返回恰好包含一个小数点且小数点后恰好一位数字的字符串', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        (score) => {
          const result = formatScore(score);
          const parts = result.split('.');
          // 恰好一个小数点 → split 后恰好两部分
          expect(parts).toHaveLength(2);
          // 小数点后恰好一位数字
          expect(parts[1]).toHaveLength(1);
          // 结果应可解析回数值
          expect(Number.isNaN(Number(result))).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
