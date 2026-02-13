/**
 * 链上数据查询模块 — Serverless 环境下直接从 RPC 读取
 */
import { ethers } from "ethers";

// 合约地址（通过环境变量或硬编码 testnet 地址）
const RPC_URL = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
const LEAGUE_ADDRESS = process.env.LEAGUE_ADDRESS || "0xFe5e046C426270F6cc0344e93bCa4250F1667cCE";
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || "0x5ea950839E683BD2536218Df56FF6944ca453A6B";

const LEAGUE_ABI = [
  "function currentEpochId() view returns (uint256)",
  "function epochs(uint256) view returns (uint256 id, uint256 startTime, uint256 endTime, bool closed)",
  "function epochDuration() view returns (uint256)",
  "function agentStats(address) view returns (bool registered, int256 totalProfit, uint256 successCount, uint256 failCount, uint256 totalResponseTime, uint256 activeStake, uint256 lastExecutionEpoch, int256 initialCapital, int256 peakProfit, int256 worstDrawdown, uint256 consecutiveLosses)",
  "function getAgentScore(address) view returns (uint256)",
  "function getLeaderboard(uint256) view returns (address[], uint256[])",
  "function getEpochTasks(uint256) view returns (uint256[])",
  "function registeredAgents(uint256) view returns (address)",
  "function getRegisteredAgentCount() view returns (uint256)",
  "event TaskExecuted(uint256 indexed taskId, address indexed agent, bool success, int256 profit)",
] as const;

const AGENT_TOKEN_ABI = [
  "function currentPrice() view returns (uint256)",
  "function basePrice() view returns (uint256)",
  "function isBelowDeathLine() view returns (bool)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
] as const;

const AGENT_FACTORY_ABI = [
  "function agentInfo(address) view returns (address agent, address token, string name, string symbol, uint256 createdAt, bool alive)",
  "function getAgentToken(address) view returns (address)",
  "function isAgentAlive(address) view returns (bool)",
] as const;


function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

function getLeague(provider: ethers.JsonRpcProvider) {
  return new ethers.Contract(LEAGUE_ADDRESS, LEAGUE_ABI, provider);
}

function getFactory(provider: ethers.JsonRpcProvider) {
  return new ethers.Contract(FACTORY_ADDRESS, AGENT_FACTORY_ABI, provider);
}

/** Agent 链上统计数据 */
export interface ChainAgentStats {
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

/** 从链上获取排行榜 — 使用 getLeaderboard(N) 一次性获取地址和分数 */
export async function getLeaderboardFromChain(): Promise<ChainAgentStats[]> {
  const provider = getProvider();
  const league = getLeague(provider);

  // 直接用合约的 getLeaderboard 获取排序后的地址和分数
  // 先尝试获取较多的，如果失败则逐步减少
  let addresses: string[] = [];
  let scores: bigint[] = [];
  for (const n of [50, 20, 10, 5]) {
    try {
      const result = await league.getLeaderboard(n) as [string[], bigint[]];
      addresses = result[0];
      scores = result[1];
      break;
    } catch {
      continue;
    }
  }
  const agents: ChainAgentStats[] = [];

  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i];
    const score = scores[i];

    try {
      const stats = await league.agentStats(addr);
      const totalProfit = stats[1] as bigint;
      const successCount = Number(stats[2]);
      const failCount = Number(stats[3]);
      const totalResponseTime = Number(stats[4]);
      const activeStake = stats[5] as bigint;
      const initialCapital = stats[7] as bigint;
      const peakProfit = stats[8] as bigint;
      const worstDrawdown = stats[9] as bigint;
      const consecutiveLosses = Number(stats[10]);

      const total = successCount + failCount;
      const capital = initialCapital > 0n ? initialCapital : activeStake > 0n ? activeStake : 1n;
      const roi = Number(totalProfit) / Number(capital);
      const drawdownRatio = Number(worstDrawdown < 0n ? -worstDrawdown : worstDrawdown) / Number(capital);
      const stability = drawdownRatio < 1 ? 1 - drawdownRatio : 0;
      const survivalBonus = consecutiveLosses < 3 ? 1 : 0;

      agents.push({
        address: addr,
        total_profit: totalProfit.toString(),
        success_count: successCount,
        fail_count: failCount,
        avg_response_time: total > 0 ? totalResponseTime / total : 0,
        roi,
        stability,
        survival_bonus: survivalBonus,
        score: score.toString(),
        peak_profit: Number(peakProfit),
        worst_drawdown: Number(worstDrawdown),
        consecutive_losses: consecutiveLosses,
      });
    } catch {
      // skip agents that fail to query
    }
  }

  return agents;
}

/** Epoch 执行记录 */
export interface ChainExecution {
  id: number;
  task_id: number;
  agent: string;
  success: number;
  profit: string;
  block_number: number;
  tx_hash: string;
  timestamp: number;
}

/** 从链上获取 Epoch 数据 */
export async function getEpochFromChain(epochId: number) {
  const provider = getProvider();
  const league = getLeague(provider);

  const epoch = await league.epochs(epochId);
  const id = Number(epoch[0]);
  if (id === 0) return null;

  const startTime = Number(epoch[1]);
  const endTime = Number(epoch[2]);
  const closed = epoch[3] as boolean;

  // 查询该 epoch 的 TaskExecuted 事件
  const filter = league.filters.TaskExecuted();
  const events = await league.queryFilter(filter, 0, "latest");

  const taskIds = await league.getEpochTasks(epochId).catch(() => [] as bigint[]);
  const taskIdSet = new Set(taskIds.map((t: bigint) => Number(t)));

  const executions: ChainExecution[] = [];
  let counter = 0;
  for (const event of events) {
    if (!("args" in event)) continue;
    const e = event as ethers.EventLog;
    const taskId = Number(e.args[0]);
    if (taskIdSet.size > 0 && !taskIdSet.has(taskId)) continue;

    counter++;
    executions.push({
      id: counter,
      task_id: taskId,
      agent: e.args[1] as string,
      success: (e.args[2] as boolean) ? 1 : 0,
      profit: (e.args[3] as bigint).toString(),
      block_number: e.blockNumber,
      tx_hash: e.transactionHash,
      timestamp: startTime,
    });
  }

  return {
    id: epochId,
    start_time: startTime,
    end_time: endTime,
    closed: closed ? 1 : 0,
    executions,
  };
}


/** 获取单个 Agent 详情 + 最近交易 */
export async function getAgentDetailFromChain(address: string) {
  const provider = getProvider();
  const league = getLeague(provider);

  const stats = await league.agentStats(address);
  const registered = stats[0] as boolean;
  if (!registered) return null;

  const score = await league.getAgentScore(address);
  const totalProfit = stats[1] as bigint;
  const successCount = Number(stats[2]);
  const failCount = Number(stats[3]);
  const totalResponseTime = Number(stats[4]);
  const activeStake = stats[5] as bigint;
  const initialCapital = stats[7] as bigint;
  const peakProfit = stats[8] as bigint;
  const worstDrawdown = stats[9] as bigint;
  const consecutiveLosses = Number(stats[10]);

  const total = successCount + failCount;
  const capital = initialCapital > 0n ? initialCapital : activeStake > 0n ? activeStake : 1n;
  const roi = Number(totalProfit) / Number(capital);
  const drawdownRatio = Number(worstDrawdown < 0n ? -worstDrawdown : worstDrawdown) / Number(capital);
  const stability = drawdownRatio < 1 ? 1 - drawdownRatio : 0;
  const survivalBonus = consecutiveLosses < 3 ? 1 : 0;

  // 查询该 agent 的 TaskExecuted 事件
  const filter = league.filters.TaskExecuted(null, address);
  const events = await league.queryFilter(filter, 0, "latest");
  const recentTrades: ChainExecution[] = events.slice(-50).reverse().map((event, i) => {
    const e = event as ethers.EventLog;
    return {
      id: i + 1,
      task_id: Number(e.args[0]),
      agent: e.args[1] as string,
      success: (e.args[2] as boolean) ? 1 : 0,
      profit: (e.args[3] as bigint).toString(),
      block_number: e.blockNumber,
      tx_hash: e.transactionHash,
      timestamp: Math.floor(Date.now() / 1000),
    };
  });

  return {
    address,
    total_profit: totalProfit.toString(),
    success_count: successCount,
    fail_count: failCount,
    avg_response_time: total > 0 ? totalResponseTime / total : 0,
    roi,
    stability,
    survival_bonus: survivalBonus,
    score: score.toString(),
    peak_profit: Number(peakProfit),
    worst_drawdown: Number(worstDrawdown),
    consecutive_losses: consecutiveLosses,
    recentTrades,
  };
}

/** Last Stand 状态 */
export interface LastStandInfo {
  active: boolean;
  epochRemainingPct: number;
  epochRemainingSeconds: number;
  endangeredAgents: EndangeredAgent[];
}

interface EndangeredAgent {
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
}

export async function getLastStandFromChain(): Promise<LastStandInfo> {
  const provider = getProvider();
  const league = getLeague(provider);
  const factory = getFactory(provider);

  const currentEpochId = Number(await league.currentEpochId());
  if (currentEpochId === 0) {
    return { active: false, epochRemainingPct: 100, epochRemainingSeconds: 0, endangeredAgents: [] };
  }

  const epoch = await league.epochs(currentEpochId);
  const startTime = Number(epoch[1]);
  const closed = epoch[3] as boolean;
  const duration = Number(await league.epochDuration());
  const now = Math.floor(Date.now() / 1000);
  const endTime = startTime + duration;
  const remaining = Math.max(0, endTime - now);
  const remainingPct = duration > 0 ? (remaining / duration) * 100 : 100;

  // 通过 getLeaderboard 获取所有 agent 地址
  let agentAddresses: string[] = [];
  for (const n of [50, 20, 10, 5]) {
    try {
      const result = await league.getLeaderboard(n) as [string[], bigint[]];
      agentAddresses = result[0];
      break;
    } catch {
      continue;
    }
  }
  const endangered: EndangeredAgent[] = [];

  for (const agentAddr of agentAddresses) {
    try {
      const tokenAddr = (await factory.getAgentToken(agentAddr)) as string;
      if (tokenAddr === ethers.ZeroAddress) continue;

      const token = new ethers.Contract(tokenAddr, AGENT_TOKEN_ABI, provider);
      const [curPrice, basePrc, belowDeath, alive] = await Promise.all([
        token.currentPrice() as Promise<bigint>,
        token.basePrice() as Promise<bigint>,
        token.isBelowDeathLine() as Promise<boolean>,
        factory.isAgentAlive(agentAddr) as Promise<boolean>,
      ]);

      const deathLine = (basePrc * 4000n) / 10000n;
      const ratio = basePrc > 0n ? Number(curPrice * 10000n / basePrc) / 10000 : 1;

      if (ratio < 0.6 || belowDeath) {
        const info = await factory.agentInfo(agentAddr);
        endangered.push({
          address: agentAddr,
          tokenAddress: tokenAddr,
          name: info[2] as string,
          symbol: info[3] as string,
          currentPrice: curPrice.toString(),
          basePrice: basePrc.toString(),
          deathLinePrice: deathLine.toString(),
          priceRatio: ratio,
          belowDeathLine: belowDeath,
          alive,
        });
      }
    } catch {
      // skip failed agent queries
    }
  }

  const isActive = !closed && remainingPct < 10 && endangered.length > 0;

  return {
    active: isActive,
    epochRemainingPct: Math.round(remainingPct * 100) / 100,
    epochRemainingSeconds: remaining,
    endangeredAgents: endangered,
  };
}
