/**
 * 后端 Indexer API 客户端
 * 从链上索引服务获取实时数据
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiAgentStats {
  address: string;
  total_profit: string;
  success_count: number;
  fail_count: number;
  avg_response_time: number;
  roi: number;
  stability: number;
  survival_bonus: number;
  score: string;
  peak_profit: number;
  worst_drawdown: number;
  consecutive_losses: number;
}

interface ApiAgentDetail extends ApiAgentStats {
  recentTrades: ApiExecution[];
}

interface ApiExecution {
  id: number;
  task_id: number;
  agent: string;
  success: number;
  profit: string;
  block_number: number;
  tx_hash: string;
  timestamp: number;
}

interface ApiEpoch {
  id: number;
  start_time: number;
  end_time: number;
  closed: number;
  executions: ApiExecution[];
}

import type { Agent, TradeRecord, Round, LeaguePulse } from '@/types';
import { calculateScore } from '@/lib/score-engine';

/** Agent 地址到前端 ID 的映射（Monad Testnet） */
const AGENT_ADDRESS_MAP: Record<string, { id: string; name: string; strategyTag: string; strategy: Agent['strategy']; avatarUrl: string }> = {
  '0x3317486504d4713c5c09a9fa6d0b1173b8364fed': { id: 'momentum-bot', name: 'MomentumBot', strategyTag: 'Trend Rider', strategy: 'momentum', avatarUrl: '/avatars/momentum.svg' },
  '0xd9bd4099432c74ef715f9bb711455ffc6af9c2c1': { id: 'mean-revert-bot', name: 'MeanRevertBot', strategyTag: 'Reversion Seeker', strategy: 'mean-revert', avatarUrl: '/avatars/mean-revert.svg' },
  '0xa2176a2df0bfcfcf94c0c38b6e1d728db0e1d693': { id: 'random-bot', name: 'RandomBot', strategyTag: 'Chaos Dice', strategy: 'random', avatarUrl: '/avatars/random.svg' },
  '0x16c8d7e85c42242b0582de308af08119cc64250a': { id: 'conservative-bot', name: 'ConservBot', strategyTag: 'Steady Hand', strategy: 'conservative', avatarUrl: '/avatars/conservative.svg' },
  '0x90a3a22b18109b6e250d5e5b9622266143139616': { id: 'aggro-bot', name: 'AggroBot', strategyTag: 'Full Send', strategy: 'aggressive', avatarUrl: '/avatars/aggro.svg' },
};

const TASK_TYPE_ASSETS = ['ETH', 'BTC', 'SOL'];

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

/** 从后端获取排行榜并转换为前端 Agent 类型 */
export async function fetchLeaderboard(): Promise<Agent[]> {
  const data = await fetchJson<ApiAgentStats[]>('/leaderboard');

  const agents: Agent[] = data.map((item, index) => {
    const addr = item.address.toLowerCase();
    const meta = AGENT_ADDRESS_MAP[addr];
    const total = item.success_count + item.fail_count;
    const winRate = total > 0 ? (item.success_count / total) * 100 : 0;

    // 直接使用后端计算的 ROI / Stability / SurvivalBonus
    // ROI: 后端返回的是 totalProfit/initialCapital 的比值，× 100 转为百分比
    const roiPct = Math.round(item.roi * 100 * 10) / 10; // 0.006147 → 0.6
    // Stability: 后端返回 0~1，× 100 转为 0~100 分
    const stabilityPct = Math.round(item.stability * 100 * 10) / 10; // 0.9995 → 99.9
    const survivalBonus: 0 | 1 = item.survival_bonus >= 1 ? 1 : 0;

    return {
      id: meta?.id ?? addr.slice(0, 10),
      name: meta?.name ?? `Agent ${addr.slice(0, 8)}`,
      strategyTag: meta?.strategyTag ?? 'Unknown',
      strategy: meta?.strategy ?? 'random',
      avatarUrl: meta?.avatarUrl ?? '/avatars/default.svg',
      roi: roiPct,
      stability: stabilityPct,
      survivalBonus,
      score: calculateScore({ roi: roiPct, stability: stabilityPct, survivalBonus }),
      rank: index + 1,
      rankChange: { direction: 'stable' as const, delta: 0 },
      streak: { type: item.consecutive_losses >= 3 ? 'lose' as const : item.success_count > item.fail_count ? 'win' as const : 'none' as const, count: item.consecutive_losses || 0 },
      uptime: `${total}t`,
      winRate: Math.round(winRate * 10) / 10,
    };
  });

  return agents;
}

/** 从后端获取 Agent 详情 */
export async function fetchAgentDetail(address: string): Promise<ApiAgentDetail | null> {
  try {
    return await fetchJson<ApiAgentDetail>(`/agent/${address}`);
  } catch {
    return null;
  }
}

/** 从后端获取 Epoch 详情并转换为交易记录 */
export async function fetchEpochTrades(epochId: number): Promise<TradeRecord[]> {
  try {
    const data = await fetchJson<ApiEpoch>(`/epoch/${epochId}`);
    return data.executions.map((exec, i) => {
      const addr = exec.agent.toLowerCase();
      const meta = AGENT_ADDRESS_MAP[addr];
      return {
        id: `exec-${exec.id}`,
        timestamp: exec.timestamp * 1000,
        agentId: meta?.id ?? addr.slice(0, 10),
        agentName: meta?.name ?? `Agent ${addr.slice(0, 8)}`,
        action: exec.success ? 'buy' as const : 'sell' as const,
        asset: TASK_TYPE_ASSETS[exec.task_id % 3] ?? 'ETH',
        pnl: parseFloat(exec.profit) / 1e18,
        txHash: exec.tx_hash,
      };
    });
  } catch {
    return [];
  }
}

/** 检查后端 API 是否可用 */
export async function isApiAvailable(): Promise<boolean> {
  try {
    await fetch(`${API_BASE}/leaderboard`, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

/** Last Stand API 响应类型 */
interface ApiLastStandResponse {
  active: boolean;
  epochRemainingPct: number;
  epochRemainingSeconds: number;
  endangeredAgents: Array<{
    address: string;
    tokenAddress: string;
    name: string;
    symbol: string;
    currentPrice: string;
    basePrice: string;
    deathLinePrice: string;
    priceRatio: number;
    belowDeathLine: boolean;
    alive: boolean;
  }>;
}

/** 从后端获取 Last Stand 状态 */
export async function fetchLastStand(): Promise<ApiLastStandResponse> {
  try {
    return await fetchJson<ApiLastStandResponse>('/last-stand');
  } catch {
    return { active: false, epochRemainingPct: 100, epochRemainingSeconds: 0, endangeredAgents: [] };
  }
}
