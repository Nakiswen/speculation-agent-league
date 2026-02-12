'use client';

import MetricPill from '@/components/ui/MetricPill';
import { getMockLeaguePulse } from '@/lib/mock-data';
import { getPnlColorClass } from '@/lib/color-mapping';

/**
 * LeaguePulse 统计卡片组
 * 展示 TVL、Active Bots、Top ROI、Round Trades 四项联赛指标
 */
export default function LeaguePulse() {
  const pulse = getMockLeaguePulse();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <MetricPill label="TVL" value={pulse.tvl} />
      <MetricPill
        label="Active Bots"
        value={`${pulse.activeBots}/${pulse.totalBots}`}
      />
      <MetricPill
        label="Top ROI"
        value={`${pulse.topRoi > 0 ? '+' : ''}${pulse.topRoi.toFixed(1)}%`}
        className={getPnlColorClass(pulse.topRoi)}
      />
      <MetricPill label="Round Trades" value={pulse.roundTrades} />
    </div>
  );
}
