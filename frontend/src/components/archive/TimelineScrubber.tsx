'use client';

import { useCallback } from 'react';

interface TimelineScrubberProps {
  startTime: number;
  endTime: number;
  currentTime: number;
  onTimeChange: (timestamp: number) => void;
}

/**
 * 格式化时间戳为 HH:MM:SS
 */
function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => n.toString().padStart(2, '0'))
    .join(':');
}

/**
 * 时间轴滑块组件
 * 玻璃态胶囊样式，拖动时通过 onTimeChange 回调通知父组件
 */
export default function TimelineScrubber({
  startTime,
  endTime,
  currentTime,
  onTimeChange,
}: TimelineScrubberProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onTimeChange(Number(e.target.value));
    },
    [onTimeChange],
  );

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-6 py-4 backdrop-blur-[40px]">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span className="font-mono">{formatTimestamp(startTime)}</span>
        <span className="font-mono text-sm text-cyan-400">
          {formatTimestamp(currentTime)}
        </span>
        <span className="font-mono">{formatTimestamp(endTime)}</span>
      </div>
      <input
        type="range"
        min={startTime}
        max={endTime}
        value={currentTime}
        onChange={handleChange}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700/60 accent-cyan-400 outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,240,255,0.5)]"
        aria-label="时间轴滑块"
      />
    </div>
  );
}
