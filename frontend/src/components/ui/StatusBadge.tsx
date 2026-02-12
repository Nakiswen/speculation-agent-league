'use client';

type BadgeStatus = 'active' | 'eliminated' | 'warning';

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
}

const statusConfig: Record<BadgeStatus, { dotClass: string; textClass: string; defaultLabel: string }> = {
  active: {
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-400',
    defaultLabel: 'Active',
  },
  eliminated: {
    dotClass: 'bg-red-400',
    textClass: 'text-red-400',
    defaultLabel: 'Eliminated',
  },
  warning: {
    dotClass: 'bg-yellow-400',
    textClass: 'text-yellow-400',
    defaultLabel: 'Warning',
  },
};

/**
 * 状态徽章组件
 * 显示圆点指示器 + 状态文本
 */
export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label ?? config.defaultLabel;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${config.dotClass}`} />
      <span className={`text-sm font-medium ${config.textClass}`}>{displayLabel}</span>
    </span>
  );
}
