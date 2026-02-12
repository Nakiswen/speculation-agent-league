import { describe, it, expect } from 'vitest';
import { calculateScore, formatScore } from '../score-engine';

describe('calculateScore', () => {
  it('应按公式 ROI×0.6 + Stability×0.3 + SurvivalBonus×0.1 计算评分', () => {
    const result = calculateScore({ roi: 100, stability: 80, survivalBonus: 1 });
    // 100*0.6 + 80*0.3 + 1*0.1 = 60 + 24 + 0.1 = 84.1
    expect(result).toBeCloseTo(84.1);
  });

  it('所有输入为 0 时返回 0', () => {
    expect(calculateScore({ roi: 0, stability: 0, survivalBonus: 0 })).toBe(0);
  });

  it('SurvivalBonus 为 1 时贡献 0.1', () => {
    expect(calculateScore({ roi: 0, stability: 0, survivalBonus: 1 })).toBeCloseTo(0.1);
  });

  it('处理负 ROI', () => {
    const result = calculateScore({ roi: -50, stability: 60, survivalBonus: 1 });
    // -50*0.6 + 60*0.3 + 1*0.1 = -30 + 18 + 0.1 = -11.9
    expect(result).toBeCloseTo(-11.9);
  });

  it('处理大数值', () => {
    const result = calculateScore({ roi: 1000, stability: 500, survivalBonus: 1 });
    // 1000*0.6 + 500*0.3 + 1*0.1 = 600 + 150 + 0.1 = 750.1
    expect(result).toBeCloseTo(750.1);
  });
});

describe('formatScore', () => {
  it('格式化为一位小数', () => {
    expect(formatScore(84.1)).toBe('84.1');
  });

  it('整数补零', () => {
    expect(formatScore(100)).toBe('100.0');
  });

  it('多位小数四舍五入', () => {
    expect(formatScore(3.456)).toBe('3.5');
  });

  it('格式化 0', () => {
    expect(formatScore(0)).toBe('0.0');
  });

  it('格式化负数', () => {
    expect(formatScore(-11.9)).toBe('-11.9');
  });

  it('格式化非常小的数', () => {
    expect(formatScore(0.04)).toBe('0.0');
  });

  it('格式化非常小的负数', () => {
    expect(formatScore(-0.05)).toBe('-0.1');
  });
});
