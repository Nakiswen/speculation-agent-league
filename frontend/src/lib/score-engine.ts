import type { ScoreEngineInput } from '@/types';

/**
 * 计算 Agent 综合评分
 * 公式: Score = ROI × 0.6 + Stability × 0.3 + SurvivalBonus × 0.1
 */
export function calculateScore(input: ScoreEngineInput): number {
  return input.roi * 0.6 + input.stability * 0.3 + input.survivalBonus * 0.1;
}

/**
 * 格式化 Score 为展示字符串（保留一位小数）
 */
export function formatScore(score: number): string {
  return score.toFixed(1);
}
