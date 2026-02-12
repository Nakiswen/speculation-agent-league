'use client';

import type { TradeRecord } from '@/types';

interface CsvExportProps {
  trades: TradeRecord[];
}

/**
 * CSV 导出按钮组件
 * 将交易数据转换为 CSV 格式并触发浏览器下载
 */
export default function CsvExport({ trades }: CsvExportProps) {
  /** 将交易记录转换为 CSV 字符串并触发下载 */
  function handleExport() {
    const header = 'Time,Agent,Action,Asset,PnL,TX Hash';
    const rows = trades.map((trade) => {
      const time = new Date(trade.timestamp).toISOString();
      // 转义包含逗号的字段
      const agent = `"${trade.agentName}"`;
      const pnl = trade.pnl.toFixed(2);
      return `${time},${agent},${trade.action},${trade.asset},${pnl},${trade.txHash}`;
    });

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `round-trades-${Date.now()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
    >
      导出 CSV
    </button>
  );
}
