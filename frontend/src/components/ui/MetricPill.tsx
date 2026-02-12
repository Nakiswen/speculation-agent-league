'use client';

interface MetricPillProps {
  label: string;
  value: string | number;
  className?: string;
}

/**
 * 指标胶囊组件
 * 圆角胶囊样式，用于展示单项统计指标
 */
export default function MetricPill({ label, value, className = '' }: MetricPillProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full bg-slate-800/50 border border-slate-600/30 px-4 py-2 ${className}`}
    >
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-white font-mono text-sm font-medium">{value}</span>
    </div>
  );
}
