/** Agent 策略类型 */
export type AgentStrategy =
  | 'momentum'
  | 'mean-revert'
  | 'random'
  | 'conservative'
  | 'aggressive';

/** Agent 排名变化方向 */
export type RankDirection = 'up' | 'down' | 'stable';

/** 交易操作类型 */
export type TradeAction = 'buy' | 'sell';

/** Agent 实体 */
export interface Agent {
  id: string;
  name: string;
  strategyTag: string;
  strategy: AgentStrategy;
  avatarUrl: string;
  roi: number;
  stability: number;
  survivalBonus: 0 | 1;
  score: number;
  rank: number;
  rankChange: {
    direction: RankDirection;
    delta: number;
  };
  streak: {
    type: 'win' | 'lose' | 'none';
    count: number;
  };
  uptime: string;
  winRate: number;
}

/** ROI 历史数据点 */
export interface RoiDataPoint {
  timestamp: number;
  value: number;
}

/** 交易记录 */
export interface TradeRecord {
  id: string;
  timestamp: number;
  agentId: string;
  agentName: string;
  action: TradeAction;
  asset: string;
  pnl: number;
  txHash: string;
}

/** Round 信息 */
export interface Round {
  id: number;
  startTime: number;
  endTime: number;
  remainingSeconds: number;
  status: 'active' | 'completed';
  totalTrades: number;
}

/** League Pulse 统计 */
export interface LeaguePulse {
  tvl: string;
  activeBots: number;
  totalBots: number;
  topRoi: number;
  roundTrades: number;
}

/** FAQ 条目 */
export interface FaqItem {
  question: string;
  answer: string;
}

/** Agent 序列化 JSON 结构 */
export interface AgentJson {
  id: string;
  name: string;
  strategyTag: string;
  strategy: AgentStrategy;
  avatarUrl: string;
  roi: number;
  stability: number;
  survivalBonus: 0 | 1;
  score: number;
  rank: number;
  rankChange: {
    direction: RankDirection;
    delta: number;
  };
  streak: {
    type: 'win' | 'lose' | 'none';
    count: number;
  };
  uptime: string;
  winRate: number;
}

/** Score 计算引擎输入 */
export interface ScoreEngineInput {
  roi: number;
  stability: number;
  survivalBonus: number;
}
