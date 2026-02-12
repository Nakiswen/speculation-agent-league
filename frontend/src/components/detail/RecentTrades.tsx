'use client';

import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { tradesByAgentAtom } from '@/store/trades';
import { getPnlColorClass } from '@/lib/color-mapping';

interface RecentTradesProps {
  agentId: string;
}

/**
 * 格式化时间戳为可读字符串
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * 近期交易日志组件
 * 消费 tradesByAgentAtom 获取指定 Agent 的交易记录
 */
export default function RecentTrades({ agentId }: RecentTradesProps) {
  const tradesAtom = useMemo(() => tradesByAgentAtom(agentId), [agentId]);
  const trades = useAtomValue(tradesAtom);

  if (trades.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        暂无交易记录
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
        Recent Trades
      </h3>
      <div className="space-y-1">
        {trades.map((trade) => (
          <div
            key={trade.id}
            className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors duration-150 hover:bg-white/[0.04]"
          >
            {/* 时间 */}
            <span className="w-14 shrink-0 font-mono text-xs text-slate-500">
              {formatTime(trade.timestamp)}
            </span>

            {/* 操作类型徽章 */}
            <span
              className={`w-12 shrink-0 rounded-full px-2 py-0.5 text-center text-[10px] font-semibold uppercase ${
                trade.action === 'buy'
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              {trade.action}
            </span>

            {/* 资产 */}
            <span className="flex-1 px-3 text-xs text-white/80">
              {trade.asset}
            </span>

            {/* 盈亏 */}
            <span className={`shrink-0 font-mono text-xs font-medium ${getPnlColorClass(trade.pnl)}`}>
              {trade.pnl > 0 ? '+' : ''}
              {trade.pnl.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
