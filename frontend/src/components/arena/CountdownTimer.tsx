'use client';

import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { roundAtom } from '@/store/round';

/**
 * 倒计时组件 — 匹配设计稿 header 右侧
 * 用 DOM ref 直接更新文本，避免 React 渲染循环
 */
export default function CountdownTimer() {
  const round = useAtomValue(roundAtom);
  const timeRef = useRef<HTMLSpanElement>(null);
  const csRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!round) return;
    const endTime = Date.now() + round.remainingSeconds * 1000;

    function tick() {
      const diff = Math.max(0, endTime - Date.now());
      const totalSec = Math.floor(diff / 1000);
      const cs = Math.floor((diff % 1000) / 10);
      const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
      const s = String(totalSec % 60).padStart(2, '0');

      if (timeRef.current) timeRef.current.textContent = `${h}:${m}:${s}:`;
      if (csRef.current) csRef.current.textContent = String(cs).padStart(2, '0');

      if (diff > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [round]);

  return (
    <div className="text-right">
      <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.3em] mb-1">
        Live Feed
      </p>
      <p
        className="text-3xl font-black tracking-tighter text-white"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
        suppressHydrationWarning
      >
        <span ref={timeRef}>00:37:00:</span>
        <span ref={csRef} className="text-cyan-400">00</span>
      </p>
    </div>
  );
}
