'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';
import { dataSourceAtom, refreshAgentsAtom } from '@/store/agents';

/**
 * 右侧 Operator 面板 — 匹配设计稿右栏
 * 大头像 + 用户名 + 等级徽章 + Deploy Agent 按钮 + 数据源切换
 */
export default function OperatorPanel() {
  const dataSource = useAtomValue(dataSourceAtom);
  const refreshAgents = useSetAtom(refreshAgentsAtom);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAgents();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <aside className="flex flex-col gap-6 h-full">
      <div className="glass-box p-6">
        <h3 className="text-[9px] text-slate-500 font-black uppercase mb-8 tracking-[0.2em]">
          Operator
        </h3>
        <div className="flex flex-col items-center gap-6 mb-8">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 p-px relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-tr from-cyan-400/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-full h-full rounded-[32px] bg-[#010203] flex items-center justify-center relative">
              <span className="text-4xl">👤</span>
            </div>
          </div>
          {/* Info */}
          <div className="text-center">
            <p className="font-black text-lg tracking-tight text-white">ALVIN_DEV</p>
            <span className="mt-2 px-3 py-1 bg-cyan-400/10 text-cyan-400 text-[9px] font-black rounded-full inline-block">
              LEVEL 42
            </span>
          </div>
        </div>
        <button className="btn-glass w-full text-[10px] py-3">Deploy Agent</button>
      </div>

      {/* Data Source Panel */}
      <div className="glass-box p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Data Source</span>
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
            dataSource === 'live'
              ? 'bg-emerald-400/10 text-emerald-400'
              : 'bg-amber-400/10 text-amber-400'
          }`}>
            {dataSource === 'live' ? '🟢 LIVE' : '🟡 MOCK'}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-glass w-full text-[10px] py-2 disabled:opacity-50"
        >
          {refreshing ? 'Syncing...' : 'Sync from Chain'}
        </button>
      </div>
    </aside>
  );
}
