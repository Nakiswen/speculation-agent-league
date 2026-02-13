'use client';

import { useAtomValue } from 'jotai';
import { useRouter } from 'next/navigation';
import { sortedAgentsAtom } from '@/store/agents';
import { endangeredAddressesAtom, isLastStandActiveAtom } from '@/store/last-stand';
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

function LeaderboardRow({ agent, idx, isEndangered }: { agent: Agent; idx: number; isEndangered: boolean }) {
  const router = useRouter();
  const rc = agent.rank <= 3 ? `rank-${agent.rank}` : '';
  const roi = `${agent.roi > 0 ? '+' : ''}${agent.roi.toFixed(1)}%`;
  const sc = SCORE_COLORS[agent.rank] ?? 'text-slate-500';
  const go = () => router.push(`/agents/${agent.id}`);
  const endangeredClass = isEndangered ? 'endangered' : '';
  return (
    <div
      className={`row-item ${rc} ${endangeredClass} cursor-pointer`}
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
          <div className="flex items-center gap-1.5">
            <h4 className="font-black text-sm tracking-tight text-white truncate">{agent.name}</h4>
            {isEndangered && <span className="text-xs last-stand-heartbeat">💀</span>}
          </div>
          <p className={`text-[8px] uppercase tracking-widest font-bold ${isEndangered ? 'text-red-500' : 'text-slate-500'}`}>
            {isEndangered ? '⚠ ENDANGERED' : agent.strategyTag}
          </p>
        </div>
        <div className={`text-right font-bold text-sm ${isEndangered ? 'text-red-400' : 'text-emerald-400'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{roi}</div>
        <div className="text-right font-bold text-xs text-slate-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{agent.stability.toFixed(2)}</div>
        <div className={`text-right font-black text-xl ${sc}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{formatScore(agent.score)}</div>
      </div>
    </div>
  );
}

/** Agent ID → 链上地址反向映射 */
const AGENT_ID_TO_ADDRESS: Record<string, string> = {
  'momentum-bot': '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  'mean-revert-bot': '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
  'random-bot': '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
  'conservative-bot': '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
  'aggro-bot': '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc',
};

/**
 * Leaderboard 排行榜 — 匹配设计稿中央面板
 * 使用 CSS Grid 布局，卡片行样式，emoji 头像，排名特殊颜色
 */
export default function Leaderboard() {
  const agents = useAtomValue(sortedAgentsAtom);
  const endangeredAddresses = useAtomValue(endangeredAddressesAtom);
  const isLastStand = useAtomValue(isLastStandActiveAtom);

  return (
    <section className="leaderboard-view relative flex-1">
      {/* Title Bar */}
      <div className={`px-8 py-6 border-b flex justify-between items-center shrink-0 ${
        isLastStand ? 'border-red-500/20 bg-red-950/10' : 'border-white/5 bg-white/1'
      }`}>
        <h2 className={`text-[11px] font-black uppercase tracking-[0.4em] ${
          isLastStand ? 'text-red-400 last-stand-glow' : 'text-white'
        }`}>Leaderboard</h2>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full animate-pulse-dot ${
            isLastStand ? 'bg-red-500' : 'bg-emerald-400'
          }`} />
          <span className={`text-[9px] uppercase font-bold tracking-widest ${
            isLastStand ? 'text-red-500 last-stand-flash' : 'text-slate-500'
          }`}>{isLastStand ? '⚡ Last Stand' : 'Live Sync'}</span>
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
            {agents.map((agent, i) => {
              const addr = AGENT_ID_TO_ADDRESS[agent.id] ?? '';
              const isEndangered = endangeredAddresses.has(addr);
              return (
                <LeaderboardRow key={agent.id} agent={agent} idx={i} isEndangered={isEndangered} />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
