import type {
  Agent,
  RoiDataPoint,
  TradeRecord,
  Round,
  LeaguePulse,
  AgentStrategy,
  TradeAction,
} from '@/types';
import { calculateScore } from '@/lib/score-engine';

// ── Agent 原始定义 ──────────────────────────────────────────

interface AgentSeed {
  id: string;
  name: string;
  strategyTag: string;
  strategy: AgentStrategy;
  avatarUrl: string;
  roi: number;
  stability: number;
  survivalBonus: 0 | 1;
  uptime: string;
  winRate: number;
  rankChange: { direction: 'up' | 'down' | 'stable'; delta: number };
  streak: { type: 'win' | 'lose' | 'none'; count: number };
}

const agentSeeds: AgentSeed[] = [
  {
    id: 'momentum-bot',
    name: 'MomentumBot',
    strategyTag: 'Trend Rider',
    strategy: 'momentum',
    avatarUrl: '/avatars/momentum.svg',
    roi: 42.5,
    stability: 65.0,
    survivalBonus: 1,
    uptime: '72h 14m',
    winRate: 68.3,
    rankChange: { direction: 'up', delta: 1 },
    streak: { type: 'win', count: 5 },
  },
  {
    id: 'mean-revert-bot',
    name: 'MeanRevertBot',
    strategyTag: 'Reversion Seeker',
    strategy: 'mean-revert',
    avatarUrl: '/avatars/mean-revert.svg',
    roi: 18.7,
    stability: 88.2,
    survivalBonus: 1,
    uptime: '96h 30m',
    winRate: 61.5,
    rankChange: { direction: 'stable', delta: 0 },
    streak: { type: 'win', count: 3 },
  },
  {
    id: 'random-bot',
    name: 'RandomBot',
    strategyTag: 'Chaos Dice',
    strategy: 'random',
    avatarUrl: '/avatars/random.svg',
    roi: -8.3,
    stability: 22.1,
    survivalBonus: 0,
    uptime: '48h 05m',
    winRate: 35.2,
    rankChange: { direction: 'down', delta: 2 },
    streak: { type: 'lose', count: 4 },
  },
  {
    id: 'conservative-bot',
    name: 'ConservativeBot',
    strategyTag: 'Steady Hand',
    strategy: 'conservative',
    avatarUrl: '/avatars/conservative.svg',
    roi: 6.2,
    stability: 95.4,
    survivalBonus: 1,
    uptime: '120h 00m',
    winRate: 55.8,
    rankChange: { direction: 'up', delta: 1 },
    streak: { type: 'none', count: 0 },
  },
  {
    id: 'aggro-bot',
    name: 'AggroBot',
    strategyTag: 'Full Send',
    strategy: 'aggressive',
    avatarUrl: '/avatars/aggro.svg',
    roi: 31.8,
    stability: 35.6,
    survivalBonus: 1,
    uptime: '60h 42m',
    winRate: 52.1,
    rankChange: { direction: 'down', delta: 1 },
    streak: { type: 'lose', count: 2 },
  },
];


// ── getMockAgents ───────────────────────────────────────────

/**
 * 返回 5 个预定义 Agent，按 Score 降序排列并分配排名
 */
export function getMockAgents(): Agent[] {
  const agents: Agent[] = agentSeeds.map((seed) => ({
    ...seed,
    score: calculateScore({
      roi: seed.roi,
      stability: seed.stability,
      survivalBonus: seed.survivalBonus,
    }),
    rank: 0, // 占位，下面按 score 排序后重新分配
  }));

  agents.sort((a, b) => b.score - a.score);
  agents.forEach((agent, index) => {
    agent.rank = index + 1;
  });

  return agents;
}

// ── getMockTrades ───────────────────────────────────────────

const ASSETS = ['ETH', 'BTC', 'SOL', 'MONAD', 'ARB', 'OP'];

interface TradeSeed {
  agentId: string;
  agentName: string;
  action: TradeAction;
  asset: string;
  pnl: number;
  minutesAgo: number;
}

const tradeSeeds: TradeSeed[] = [
  { agentId: 'momentum-bot', agentName: 'MomentumBot', action: 'buy', asset: 'ETH', pnl: 320.5, minutesAgo: 3 },
  { agentId: 'momentum-bot', agentName: 'MomentumBot', action: 'sell', asset: 'BTC', pnl: 185.2, minutesAgo: 8 },
  { agentId: 'momentum-bot', agentName: 'MomentumBot', action: 'buy', asset: 'SOL', pnl: -45.0, minutesAgo: 15 },
  { agentId: 'momentum-bot', agentName: 'MomentumBot', action: 'sell', asset: 'MONAD', pnl: 520.8, minutesAgo: 22 },
  { agentId: 'mean-revert-bot', agentName: 'MeanRevertBot', action: 'buy', asset: 'ETH', pnl: 88.3, minutesAgo: 5 },
  { agentId: 'mean-revert-bot', agentName: 'MeanRevertBot', action: 'sell', asset: 'ARB', pnl: 42.1, minutesAgo: 12 },
  { agentId: 'mean-revert-bot', agentName: 'MeanRevertBot', action: 'buy', asset: 'OP', pnl: -15.6, minutesAgo: 19 },
  { agentId: 'mean-revert-bot', agentName: 'MeanRevertBot', action: 'sell', asset: 'SOL', pnl: 67.9, minutesAgo: 28 },
  { agentId: 'random-bot', agentName: 'RandomBot', action: 'buy', asset: 'BTC', pnl: -210.4, minutesAgo: 2 },
  { agentId: 'random-bot', agentName: 'RandomBot', action: 'sell', asset: 'MONAD', pnl: 15.3, minutesAgo: 10 },
  { agentId: 'random-bot', agentName: 'RandomBot', action: 'buy', asset: 'ETH', pnl: -88.7, minutesAgo: 18 },
  { agentId: 'random-bot', agentName: 'RandomBot', action: 'sell', asset: 'SOL', pnl: -132.0, minutesAgo: 25 },
  { agentId: 'conservative-bot', agentName: 'ConservativeBot', action: 'buy', asset: 'ETH', pnl: 22.1, minutesAgo: 6 },
  { agentId: 'conservative-bot', agentName: 'ConservativeBot', action: 'sell', asset: 'BTC', pnl: 18.5, minutesAgo: 14 },
  { agentId: 'conservative-bot', agentName: 'ConservativeBot', action: 'buy', asset: 'ARB', pnl: 8.3, minutesAgo: 20 },
  { agentId: 'conservative-bot', agentName: 'ConservativeBot', action: 'sell', asset: 'OP', pnl: -5.2, minutesAgo: 30 },
  { agentId: 'aggro-bot', agentName: 'AggroBot', action: 'buy', asset: 'MONAD', pnl: 445.6, minutesAgo: 1 },
  { agentId: 'aggro-bot', agentName: 'AggroBot', action: 'sell', asset: 'ETH', pnl: -280.3, minutesAgo: 7 },
  { agentId: 'aggro-bot', agentName: 'AggroBot', action: 'buy', asset: 'SOL', pnl: 190.2, minutesAgo: 16 },
  { agentId: 'aggro-bot', agentName: 'AggroBot', action: 'sell', asset: 'BTC', pnl: -95.8, minutesAgo: 24 },
];

/**
 * 生成伪随机交易哈希（确定性，基于索引）
 */
function generateTxHash(index: number): string {
  const hex = '0123456789abcdef';
  const seed = index * 7 + 3;
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += hex[(seed * (i + 1) * 13 + i * 7) % 16];
  }
  return hash;
}

/**
 * 固定基准时间戳，避免 SSR/CSR hydration 不匹配
 */
const FIXED_NOW = 1700000000000;

/**
 * 返回所有 Agent 的交易记录（约 20 条）
 */
export function getMockTrades(): TradeRecord[] {
  return tradeSeeds.map((seed, index) => ({
    id: `trade-${index + 1}`,
    timestamp: FIXED_NOW - seed.minutesAgo * 60 * 1000,
    agentId: seed.agentId,
    agentName: seed.agentName,
    action: seed.action,
    asset: seed.asset,
    pnl: seed.pnl,
    txHash: generateTxHash(index),
  }));
}


// ── getMockRoiHistory ───────────────────────────────────────

/**
 * 基于 Agent 策略特征生成 ROI 基线和波动参数
 */
interface RoiProfile {
  baseRoi: number;
  volatility: number;
  trend: number; // 正值上升趋势，负值下降趋势
}

const roiProfiles: Record<string, RoiProfile> = {
  'momentum-bot': { baseRoi: 20, volatility: 8, trend: 0.9 },
  'mean-revert-bot': { baseRoi: 10, volatility: 3, trend: 0.35 },
  'random-bot': { baseRoi: 5, volatility: 12, trend: -0.55 },
  'conservative-bot': { baseRoi: 3, volatility: 1.5, trend: 0.13 },
  'aggro-bot': { baseRoi: 15, volatility: 15, trend: 0.7 },
};

/**
 * 简单确定性伪随机数生成器（基于种子）
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * 返回指定 Agent 的 ROI 历史数据点（24 个，每小时一个）
 */
export function getMockRoiHistory(agentId: string): RoiDataPoint[] {
  const profile = roiProfiles[agentId] ?? {
    baseRoi: 0,
    volatility: 5,
    trend: 0,
  };

  const ONE_HOUR = 60 * 60 * 1000;
  const points: RoiDataPoint[] = [];

  let currentValue = profile.baseRoi;

  for (let i = 0; i < 24; i++) {
    const noise = (seededRandom(i * 17 + agentId.length) - 0.5) * 2 * profile.volatility;
    currentValue += profile.trend + noise;

    points.push({
      timestamp: FIXED_NOW - (23 - i) * ONE_HOUR,
      value: Math.round(currentValue * 100) / 100,
    });
  }

  return points;
}

// ── getMockRound ────────────────────────────────────────────

/**
 * 返回当前 Round 信息（active 状态，剩余约 37 分钟）
 */
export function getMockRound(): Round {
  const ONE_HOUR = 60 * 60 * 1000;
  const startTime = FIXED_NOW - 23 * 60 * 1000;
  const endTime = startTime + ONE_HOUR;
  const remainingSeconds = Math.round((endTime - FIXED_NOW) / 1000);

  return {
    id: 42,
    startTime,
    endTime,
    remainingSeconds,
    status: 'active',
    totalTrades: 20,
  };
}

// ── getMockLeaguePulse ──────────────────────────────────────

/**
 * 返回联赛统计数据
 */
export function getMockLeaguePulse(): LeaguePulse {
  const agents = getMockAgents();
  const topRoi = Math.max(...agents.map((a) => a.roi));

  return {
    tvl: '$2.4M',
    activeBots: 5,
    totalBots: 5,
    topRoi,
    roundTrades: 20,
  };
}
