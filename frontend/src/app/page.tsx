'use client';

import MarketPulse from '@/components/arena/MarketPulse';
import Leaderboard from '@/components/arena/Leaderboard';
import OperatorPanel from '@/components/arena/OperatorPanel';
import FormulaPill from '@/components/ui/FormulaPill';

/**
 * League Dashboard 首页 — 像素级还原设计稿
 * 三栏布局：Left (Market Pulse 260px) / Center (Leaderboard 1fr) / Right (Operator 260px)
 */
export default function Home() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
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
