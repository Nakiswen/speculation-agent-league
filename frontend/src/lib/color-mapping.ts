/**
 * 数值颜色映射工具函数
 * 根据数值的正负返回对应的 Tailwind CSS 颜色类名
 * 用于 ROI 和 PnL 等盈亏数值的颜色展示
 */

/**
 * 根据盈亏数值返回对应的 Tailwind CSS 颜色类名
 * - 正值 → 绿色（emerald）
 * - 负值 → 红色
 * - 零值 → 中性色
 *
 * @param value - 盈亏数值（ROI 或 PnL）
 * @returns Tailwind CSS 颜色类名
 */
export function getPnlColorClass(value: number): string {
  if (value > 0) {
    return 'text-emerald-400';
  }
  if (value < 0) {
    return 'text-red-400';
  }
  return 'text-slate-400';
}
