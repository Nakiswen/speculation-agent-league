/**
 * 内存数据库层 — 存储链上索引数据（无需 native 依赖）
 */

export interface DbEpoch {
  id: number;
  start_time: number;
  end_time: number;
  closed: number;
}

export interface DbExecution {
  id: number;
  task_id: number;
  agent: string;
  success: number;
  profit: string;
  block_number: number;
  tx_hash: string;
  timestamp: number;
}

export interface DbAgent {
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

export interface MemoryDb {
  epochs: Map<number, DbEpoch>;
  executions: DbExecution[];
  agents: Map<string, DbAgent>;
  executionCounter: number;
}

export function createDb(): MemoryDb {
  return {
    epochs: new Map(),
    executions: [],
    agents: new Map(),
    executionCounter: 0,
  };
}

export function upsertAgent(db: MemoryDb, address: string): DbAgent {
  let agent = db.agents.get(address);
  if (!agent) {
    agent = {
      address, total_profit: '0', success_count: 0, fail_count: 0,
      avg_response_time: 0, roi: 0, stability: 1, survival_bonus: 1,
      score: '0', peak_profit: 0, worst_drawdown: 0, consecutive_losses: 0,
    };
    db.agents.set(address, agent);
  }
  return agent;
}

export function addExecution(db: MemoryDb, exec: Omit<DbExecution, 'id'>): void {
  db.executionCounter++;
  db.executions.push({ ...exec, id: db.executionCounter });
}

export function getAgentExecutions(db: MemoryDb, agent: string): DbExecution[] {
  return db.executions.filter((e) => e.agent === agent);
}

export function getEpochExecutions(db: MemoryDb, epochId: number): DbExecution[] {
  // 简化：通过 task_id 范围过滤（每个 epoch 3 个 task）
  return db.executions.filter((e) => {
    const epoch = Math.ceil(e.task_id / 3);
    return epoch === epochId;
  });
}

export function updateAgentStats(db: MemoryDb, agentAddr: string): void {
  const execs = getAgentExecutions(db, agentAddr);
  if (execs.length === 0) return;

  let totalProfit = 0;
  let successCount = 0;
  let failCount = 0;
  let peakProfit = 0;
  let worstDrawdown = 0;
  let consecutiveLosses = 0;
  let currentConsecLosses = 0;
  let runningProfit = 0;
  let runningPeak = 0;

  for (const e of execs) {
    const p = parseFloat(e.profit);
    totalProfit += p;
    runningProfit += p;

    if (e.success) {
      successCount++;
      currentConsecLosses = 0;
    } else {
      failCount++;
      currentConsecLosses++;
      if (currentConsecLosses > consecutiveLosses) {
        consecutiveLosses = currentConsecLosses;
      }
    }

    // 跟踪峰值和回撤
    if (runningProfit > runningPeak) {
      runningPeak = runningProfit;
    }
    const drawdown = runningPeak - runningProfit;
    if (drawdown > worstDrawdown) {
      worstDrawdown = drawdown;
    }
  }
  peakProfit = runningPeak;

  // 从 penalty 反推 stake 金额作为有效资本
  // penalty = stake * 0.5%，所以 stake = penalty / 0.005
  let estimatedStake = 0;
  for (const e of execs) {
    if (!e.success) {
      const penalty = Math.abs(parseFloat(e.profit));
      if (penalty > 0) {
        estimatedStake = penalty / 0.005;
        break;
      }
    }
  }
  // 如果没有失败记录，用默认值
  const capital = estimatedStake > 0 ? estimatedStake : 100_000 * 1e18;

  // ROI = totalProfit / capital（0~1 范围，可为负）
  const roi = capital > 0 ? totalProfit / capital : 0;

  // Stability = 1 - worstDrawdown / capital（0~1 范围）
  const drawdownRatio = capital > 0 ? worstDrawdown / capital : 0;
  const stability = drawdownRatio < 1 ? 1 - drawdownRatio : 0;

  // SurvivalBonus: 当前连续亏损 < 3 则为 1，否则为 0
  const survivalBonus = currentConsecLosses < 3 ? 1 : 0;

  // Score = ROI × 0.6 + Stability × 0.3 + SurvivalBonus × 0.1
  const score = roi * 0.6 + stability * 0.3 + survivalBonus * 0.1;

  const agent = upsertAgent(db, agentAddr);
  agent.total_profit = totalProfit.toString();
  agent.success_count = successCount;
  agent.fail_count = failCount;
  agent.roi = roi;
  agent.stability = stability;
  agent.survival_bonus = survivalBonus;
  agent.score = score.toString();
  agent.peak_profit = peakProfit;
  agent.worst_drawdown = worstDrawdown;
  agent.consecutive_losses = consecutiveLosses;
}

export function getLeaderboard(db: MemoryDb): DbAgent[] {
  return [...db.agents.values()].sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
}
