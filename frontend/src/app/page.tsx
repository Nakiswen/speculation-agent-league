'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import MarketPulse from '@/components/arena/MarketPulse';
import Leaderboard from '@/components/arena/Leaderboard';
import OperatorPanel from '@/components/arena/OperatorPanel';
import FormulaPill from '@/components/ui/FormulaPill';
import LastStandBanner from '@/components/arena/LastStandBanner';
import { refreshAgentsAtom } from '@/store/agents';
import { lastStandAtom } from '@/store/last-stand';
import { fetchLastStand } from '@/lib/api-client';
import type { LastStandState } from '@/store/last-stand';

const POLL_INTERVAL = 5000; // 5 秒轮询一次
const LAST_STAND_POLL = 3000; // Last Stand 3 秒轮询（更紧迫）

/**
 * League Dashboard 首页 — 像素级还原设计稿
 * 三栏布局：Left (Market Pulse 260px) / Center (Leaderboard 1fr) / Right (Operator 260px)
 */
export default function Home() {
  const refreshAgents = useSetAtom(refreshAgentsAtom);
  const setLastStand = useSetAtom(lastStandAtom);

  useEffect(() => {
    refreshAgents();
    const timer = setInterval(() => {
      refreshAgents();
    }, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [refreshAgents]);

  // Last Stand 轮询
  useEffect(() => {
    async function pollLastStand() {
      const data = await fetchLastStand();
      setLastStand(data as LastStandState);
    }
    pollLastStand();
    const timer = setInterval(pollLastStand, LAST_STAND_POLL);
    return () => clearInterval(timer);
  }, [setLastStand]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Last Stand Banner */}
      <LastStandBanner />

      {/* Main Content: 3-column grid */}
      <main className="flex-1 grid grid-cols-[260px_1fr_260px] gap-8 overflow-hidden">
        <MarketPulse />
        <Leaderboard />
        <OperatorPanel />
      </main>

      {/* Footer Formula Pill */}
      <FormulaPill />
    </div>
  );
}
