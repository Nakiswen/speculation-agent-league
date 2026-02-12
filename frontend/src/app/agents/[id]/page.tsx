'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { useAtomValue } from 'jotai';
import { agentByIdAtom } from '@/store/agents';
import { getMockRoiHistory } from '@/lib/mock-data';
import GlassCard from '@/components/ui/GlassCard';
import AgentIdentityCard from '@/components/detail/AgentIdentityCard';
import PerformanceChart from '@/components/detail/PerformanceChart';
import MetricsGrid from '@/components/detail/MetricsGrid';
import RecentTrades from '@/components/detail/RecentTrades';
import ActionPanel from '@/components/detail/ActionPanel';

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Agent Detail 页面
 * 三栏布局：左栏（AgentIdentityCard）/ 中栏（PerformanceChart + MetricsGrid + RecentTrades）/ 右栏（ActionPanel）
 * 移动端单栏垂直堆叠
 * Agent 不存在时显示 404 提示
 */
export default function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = use(params);
  const agentAtom = useMemo(() => agentByIdAtom(id), [id]);
  const agent = useAtomValue(agentAtom);

  // Agent 不存在时显示 404 提示
  if (!agent) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="mb-4 text-4xl font-bold text-white">404</h1>
        <p className="mb-6 text-slate-400">Agent not found</p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-cyan-500/10 px-6 py-3 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20"
        >
          ← Back to ARENA
        </Link>
      </div>
    );
  }

  const roiHistory = getMockRoiHistory(agent.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* 三栏网格布局 */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[260px_1fr_260px]">
        {/* 左栏：Agent Identity */}
        <aside className="order-2 xl:order-1">
          <AgentIdentityCard agent={agent} />
        </aside>

        {/* 中栏：Performance */}
        <div className="order-1 space-y-6 xl:order-2">
          {/* ROI 曲线图 */}
          <GlassCard>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-400">
              Performance
            </h3>
            <PerformanceChart dataPoints={roiHistory} />
          </GlassCard>

          {/* 指标网格 */}
          <MetricsGrid agent={agent} />

          {/* 近期交易 */}
          <GlassCard>
            <RecentTrades agentId={agent.id} />
          </GlassCard>
        </div>

        {/* 右栏：Action Panel */}
        <aside className="order-3">
          <ActionPanel agent={agent} />
        </aside>
      </div>
    </div>
  );
}
