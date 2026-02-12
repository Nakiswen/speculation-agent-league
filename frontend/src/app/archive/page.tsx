'use client';

import { useState, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { tradesAtom } from '@/store/trades';
import { roundAtom } from '@/store/round';
import GlassCard from '@/components/ui/GlassCard';
import AuditFeed from '@/components/archive/AuditFeed';
import TimelineScrubber from '@/components/archive/TimelineScrubber';
import CsvExport from '@/components/archive/CsvExport';

/**
 * Round Replay 页面 (ARCHIVE)
 * 顶部：标题 + CSV 导出按钮
 * 中部：AuditFeed 审计流水
 * 底部：TimelineScrubber 时间轴滑块
 */
export default function ArchivePage() {
  const trades = useAtomValue(tradesAtom);
  const round = useAtomValue(roundAtom);

  // 计算时间范围
  const { startTime, endTime } = useMemo(() => {
    if (round) {
      return { startTime: round.startTime, endTime: round.endTime };
    }
    if (trades.length > 0) {
      const timestamps = trades.map((t) => t.timestamp);
      return {
        startTime: Math.min(...timestamps),
        endTime: Math.max(...timestamps),
      };
    }
    const now = Date.now();
    return { startTime: now - 3600_000, endTime: now };
  }, [round, trades]);

  // 当前高亮时间戳
  const [currentTime, setCurrentTime] = useState(startTime);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 flex flex-col h-full">
      {/* 顶部：标题 + CSV 导出 */}
      <div className="mb-6 flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-semibold text-white">Round Replay</h1>
        <CsvExport trades={trades} />
      </div>

      {/* 中部：审计流水（可滚动） */}
      <GlassCard className="mb-6 flex-1 overflow-y-auto min-h-0">
        <AuditFeed trades={trades} highlightTimestamp={currentTime} />
      </GlassCard>

      {/* 底部：时间轴滑块（始终可见） */}
      <div className="shrink-0">
        <TimelineScrubber
          startTime={startTime}
          endTime={endTime}
          currentTime={currentTime}
          onTimeChange={setCurrentTime}
        />
      </div>
    </div>
  );
}
