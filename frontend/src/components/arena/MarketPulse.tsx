'use client';

/** 市场数据条目 */
interface MarketItem {
  pair: string;
  change: string;
  percent: number;
  positive: boolean;
}

const MARKET_DATA: MarketItem[] = [
  { pair: 'BTC / USD', change: '+$842', percent: 72, positive: true },
  { pair: 'ETH / USD', change: '+$38', percent: 58, positive: true },
  { pair: 'SOL / USD', change: '-$1.2', percent: 35, positive: false },
  { pair: 'MONAD / USD', change: '+$0.8', percent: 64, positive: true },
];

/**
 * 左侧 Market Pulse 面板 — 匹配设计稿左栏
 * 进度条样式的市场数据 + 底部 Protocol Vol 卡片
 */
export default function MarketPulse() {
  return (
    <aside className="flex flex-col gap-6 h-full">
      {/* Market Pulse */}
      <div className="glass-box p-6">
        <h3 className="text-[9px] text-slate-500 font-black uppercase mb-6 tracking-[0.2em]">
          Market Pulse
        </h3>
        <div className="space-y-8">
          {MARKET_DATA.map((item) => (
            <div key={item.pair} className="group cursor-pointer">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold group-hover:text-cyan-400 transition-colors">
                  {item.pair}
                </p>
                <p
                  className={`text-[10px] font-bold ${
                    item.positive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {item.change}
                </p>
              </div>
              <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{
                    width: `${item.percent}%`,
                    boxShadow: '0 0 8px rgba(0, 240, 255, 0.6)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Protocol Vol */}
      <div className="glass-box p-6 mt-auto text-center">
        <p className="text-[9px] text-slate-500 font-black mb-1 uppercase tracking-widest">
          Protocol Vol
        </p>
        <p
          className="text-3xl font-black text-cyan-400 tracking-tighter"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          $4.23B
        </p>
      </div>
    </aside>
  );
}
