'use client';

import { useAtomValue } from 'jotai';
import { useRouter } from 'next/navigation';
import { sortedAgentsAtom } from '@/store/agents';
import { formatScore } from '@/lib/score-engine';
import type { Agent } from '@/types';

const AGENT_EMOJIS: Record<string, string> = {
  'momentum-bot': '🤖',
  'mean-revert-bot': '🐆',
  'random-bot': '🌪',
  'conservative-bot': '🛡',
  'aggro-bot': '🔥',
};

const SCORE_COLORS: Record<number, string> = {
  1: 'text-white',
  2: 'text-slate-300',
  3: 'text-slate-400',
};

function AvatarCell({ agentId, rank }: { agentId: string; rank: number }) {
  const emoji = AGENT_EMOJIS[agentId] ?? '🤖';
  const border = rank === 1
    ? 'bg-linear-to-tr from-cyan-400 to-indigo-600'
    : 'bg-white/5';
  return (
    <div className="flex justify-center">
      <div className={`w-10 h-10 rounded-xl ${border} p-px`}>
        <div className="w-full h-full rounded-[9px] bg-[#010203] flex items-center justify-center text-base">
          {emoji}
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ agent, idx }: { agent: Agent; idx: number }) {
  const router = useRouter();
  const rc = agent.rank <= 3 ? `rank-${agent.rank}` : '';
  const roi = `${agent.roi > 0 ? '+' : ''}${agent.roi.toFixed(1)}%`;
  const sc = SCORE_COLORS[agent.rank] ?? 'text-slate-500';
  const go = () => router.push(`/agents/${agent.id}`);
  return (
    <div
      className={`row-item ${rc} cursor-pointer`}
      style={{ animationDelay: `${idx * 40}ms` }}
      onClick={go}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') go(); }}
    >
      <div className="grid-layout">
        <div className="rank-num">{String(agent.rank).padStart(2, '0')}</div>
        <AvatarCell agentId={agent.id} rank={agent.rank} />
        <div className="min-w-0">
          <h4 className="font-black text-sm tracking-tight text-white truncate">{agent.name}</h4>
          <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">{agent.strategyTag}</p>
        </div>
        <div className="text-right font-bold text-sm text-emerald-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{roi}</div>
        <div className="text-right font-bold text-xs text-slate-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{agent.stability.toFixed(2)}</div>
        <div className={`text-right font-black text-xl ${sc}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{formatScore(agent.score)}</div>
      </div>
    </div>
  );
}

/**
 * Leaderboard 排行榜 — 匹配设计稿中央面板
 * 使用 CSS Grid 布局，卡片行样式，emoji 头像，排名特殊颜色
 */
export default function Leaderboard() {
  const agents = useAtomValue(sortedAgentsAtom);

  return (
    <section className="leaderboard-view relative flex-1">
      {/* Title Bar */}
      <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/1 shrink-0">
        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-white">Leaderboard</h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Live Sync</span>
        </div>
      </div>

      {/* Scroll Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll">
        <div className="w-full flex flex-col">
          {/* Header Row */}
          <div className="table-header">
            <div className="grid-layout text-[10px] font-black uppercase tracking-widest text-slate-500 py-4">
              <div>#</div>
              <div className="text-center">ID</div>
              <div>Agent</div>
              <div className="text-right">ROI</div>
              <div className="text-right">Stab</div>
              <div className="text-right">Score</div>
            </div>
          </div>

          {/* Data Rows */}
          <div className="py-4">
            {agents.map((agent, i) => (
              <LeaderboardRow key={agent.id} agent={agent} idx={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
