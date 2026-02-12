'use client';

import { useRef, useEffect } from 'react';
import type { TradeRecord } from '@/types';
import { getPnlColorClass } from '@/lib/color-mapping';

interface AuditFeedProps {
  trades: TradeRecord[];
  highlightTimestamp: number | null;
}

/** 时间戳匹配容差（毫秒） */
const TIMESTAMP_TOLERANCE = 30_000;

/**
 * 格式化时间戳为 HH:MM:SS
 */
function formatTime(ts: number): string {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => n.toString().padStart(2, '0'))
    .join(':');
}

/**
 * 审计流水组件
 * 展示交易记录列表，支持时间戳高亮和自动滚动
 */
export default function AuditFeed({ trades, highlightTimestamp }: AuditFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  /** 判断某条交易是否应被高亮 */
  function isHighlighted(trade: TradeRecord): boolean {
    if (highlightTimestamp === null) return false;
    return Math.abs(trade.timestamp - highlightTimestamp) <= TIMESTAMP_TOLERANCE;
  }

  // 当 highlightTimestamp 变化时，滚动到最近匹配的行
  useEffect(() => {
    if (highlightTimestamp === null || trades.length === 0) return;

    // 找到最接近 highlightTimestamp 的交易
    let closestTrade: TradeRecord | null = null;
    let minDiff = Infinity;
    for (const trade of trades) {
      const diff = Math.abs(trade.timestamp - highlightTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closestTrade = trade;
      }
    }

    if (closestTrade) {
      const el = rowRefs.current.get(closestTrade.id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightTimestamp, trades]);

  if (trades.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        暂无交易记录
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-h-[60vh] space-y-1 overflow-y-auto pr-1">
      {trades.map((trade) => {
        const highlighted = isHighlighted(trade);
        return (
          <div
            key={trade.id}
            ref={(el) => {
              if (el) rowRefs.current.set(trade.id, el);
            }}
            className={`rounded-xl px-3 py-3 transition-colors duration-150 sm:px-4 ${
              highlighted
                ? 'bg-cyan-500/10 border border-cyan-500/20'
                : 'hover:bg-white/[0.04]'
            }`}
          >
            {/* 移动端：两行布局；平板+桌面端：单行布局 */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:flex-nowrap">
              {/* 时间戳 */}
              <span className="shrink-0 font-mono text-xs text-slate-500 sm:w-20">
                {formatTime(trade.timestamp)}
              </span>

              {/* Agent 名称 */}
              <span className="shrink-0 truncate text-sm text-white/80 sm:w-28">
                {trade.agentName}
              </span>

              {/* 操作类型徽章 */}
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-center text-[10px] font-semibold uppercase sm:w-14 ${
                  trade.action === 'buy'
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {trade.action}
              </span>

              {/* 资产名称 */}
              <span className="shrink-0 text-xs text-white/60 sm:w-20">
                {trade.asset}
              </span>

              {/* 盈亏金额 */}
              <span
                className={`shrink-0 font-mono text-xs font-medium sm:w-20 sm:text-right ${getPnlColorClass(trade.pnl)}`}
              >
                {trade.pnl > 0 ? '+' : ''}
                {trade.pnl.toFixed(2)}
              </span>

              {/* TX Hash 链接 */}
              <a
                href={`https://monad-testnet.socialscan.io/address/${trade.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto shrink-0 text-slate-500 transition-colors hover:text-cyan-400"
                title={trade.txHash}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm7.25-.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V6.31l-5.47 5.47a.75.75 0 1 1-1.06-1.06l5.47-5.47H12.25a.75.75 0 0 1-.75-.75Z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
