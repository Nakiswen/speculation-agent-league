'use client';

import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { lastStandAtom } from '@/store/last-stand';
import type { EndangeredAgent } from '@/store/last-stand';

function formatPrice(weiStr: string): string {
  const val = Number(weiStr) / 1e18;
  if (val < 0.0001) return val.toExponential(2);
  return val.toFixed(4);
}

function AgentCard({ agent }: { agent: EndangeredAgent }) {
  const pricePct = Math.round(agent.priceRatio * 100);
  const barWidth = Math.max(5, Math.min(100, pricePct));
  const deathPct = 40; // 死亡线 40%

  return (
    <div className="flex items-center gap-4 bg-red-950/30 border border-red-500/30 rounded-xl px-4 py-3 min-w-[260px]">
      <div className="last-stand-heartbeat text-2xl">💀</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-black text-red-300 truncate">{agent.name}</span>
          <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
            ${agent.symbol}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-red-400">{formatPrice(agent.currentPrice)} ETH</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-500">{formatPrice(agent.basePrice)} ETH</span>
        </div>
        {/* 价格条 */}
        <div className="relative w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
          {/* 死亡线标记 */}
          <div
            className="absolute top-0 h-full w-px bg-red-500/80 z-10"
            style={{ left: `${deathPct}%` }}
          />
          {/* 当前价格 */}
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              agent.belowDeathLine ? 'bg-red-600' : 'bg-orange-500'
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[8px] text-slate-600">
          <span>0%</span>
          <span className="text-red-500">死亡线 40%</span>
          <span>100%</span>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-xl font-black font-mono ${agent.belowDeathLine ? 'text-red-500' : 'text-orange-400'}`}>
          {pricePct}%
        </div>
      </div>
    </div>
  );
}

export default function LastStandBanner() {
  const state = useAtomValue(lastStandAtom);
  const countdownRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!state.active || state.epochRemainingSeconds <= 0) return;
    const endTime = Date.now() + state.epochRemainingSeconds * 1000;

    function tick() {
      const diff = Math.max(0, endTime - Date.now());
      const sec = Math.floor(diff / 1000);
      const m = String(Math.floor(sec / 60)).padStart(2, '0');
      const s = String(sec % 60).padStart(2, '0');
      if (countdownRef.current) {
        countdownRef.current.textContent = `${m}:${s}`;
      }
      if (diff > 0) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state.active, state.epochRemainingSeconds]);

  // 即使不在 active 状态，如果有濒危 Agent 也显示警告（但不闪烁）
  if (state.endangeredAgents.length === 0) return null;

  return (
    <div
      className={`relative border rounded-2xl px-6 py-4 mb-4 ${
        state.active
          ? 'last-stand-banner bg-red-950/40 border-red-500/50'
          : 'bg-orange-950/20 border-orange-500/20'
      }`}
    >
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`text-2xl ${state.active ? 'last-stand-heartbeat' : ''}`}>
            {state.active ? '🚨' : '⚠️'}
          </span>
          <div>
            <h3 className={`text-sm font-black uppercase tracking-widest ${
              state.active ? 'text-red-400 last-stand-glow' : 'text-orange-400'
            }`}>
              {state.active ? '⚡ THE LAST STAND ⚡' : 'AGENTS AT RISK'}
            </h3>
            <p className={`text-[10px] mt-0.5 ${state.active ? 'text-red-300/80' : 'text-orange-300/60'}`}>
              {state.active
                ? 'Agent 即将断电，是否进行最后的救赎（买入）？'
                : `${state.endangeredAgents.length} 个 Agent 接近死亡清算线`}
            </p>
          </div>
        </div>

        {/* 倒计时 */}
        {state.active && (
          <div className="text-right">
            <p className="text-[8px] text-red-500 font-bold uppercase tracking-widest mb-1">
              Epoch 剩余
            </p>
            <span
              ref={countdownRef}
              className="text-3xl font-black font-mono text-red-400 last-stand-glow"
              suppressHydrationWarning
            >
              00:00
            </span>
          </div>
        )}
      </div>

      {/* 濒危 Agent 列表 */}
      <div className="flex gap-3 overflow-x-auto pb-1 custom-scroll">
        {state.endangeredAgents.map((agent) => (
          <AgentCard key={agent.address} agent={agent} />
        ))}
      </div>
    </div>
  );
}
