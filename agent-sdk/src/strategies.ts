import { ChainTask, TaskType } from "./index";

/** 策略执行参数 */
export interface StrategyDecision {
  shouldExecute: boolean;
  direction?: bigint;
  proposedRatio?: bigint;
}

/** 策略接口 */
export interface Strategy {
  name: string;
  decide(task: ChainTask): StrategyDecision;
}

/** MomentumBot — 追涨杀跌，高波动 */
export const momentumStrategy: Strategy = {
  name: "MomentumBot",
  decide(task: ChainTask): StrategyDecision {
    // 总是执行，跟随 targetPrice 方向
    if (task.taskType === TaskType.Arbitrage) {
      return { shouldExecute: true, direction: task.targetPrice };
    }
    if (task.taskType === TaskType.Rebalance) {
      // 激进偏移
      return { shouldExecute: true, proposedRatio: task.threshold + 5n };
    }
    return { shouldExecute: true };
  },
};

/** MeanRevertBot — 均值回归 */
export const meanRevertStrategy: Strategy = {
  name: "MeanRevertBot",
  decide(task: ChainTask): StrategyDecision {
    if (task.taskType === TaskType.Arbitrage) {
      // 反向操作
      return { shouldExecute: true, direction: -task.targetPrice };
    }
    if (task.taskType === TaskType.Rebalance) {
      // 精确匹配 threshold
      return { shouldExecute: true, proposedRatio: task.threshold };
    }
    return { shouldExecute: true };
  },
};

/** RandomBot — 随机交易（Meme Agent） */
export const randomStrategy: Strategy = {
  name: "RandomBot",
  decide(task: ChainTask): StrategyDecision {
    const random = Math.random();
    if (random < 0.3) return { shouldExecute: false };
    if (task.taskType === TaskType.Arbitrage) {
      const dir = Math.random() > 0.5 ? task.targetPrice : -task.targetPrice;
      return { shouldExecute: true, direction: dir };
    }
    if (task.taskType === TaskType.Rebalance) {
      const offset = BigInt(Math.floor(Math.random() * 20));
      return { shouldExecute: true, proposedRatio: task.threshold + offset - 10n };
    }
    return { shouldExecute: true };
  },
};

/** ConservativeBot — 低频低风险 */
export const conservativeStrategy: Strategy = {
  name: "ConservativeBot",
  decide(task: ChainTask): StrategyDecision {
    // 只执行高奖励任务
    if (task.reward < 150n * BigInt(1e18)) {
      return { shouldExecute: false };
    }
    if (task.taskType === TaskType.Arbitrage) {
      return { shouldExecute: true, direction: task.targetPrice };
    }
    if (task.taskType === TaskType.Rebalance) {
      return { shouldExecute: true, proposedRatio: task.threshold };
    }
    return { shouldExecute: true };
  },
};

/** AggroBot — 高频高风险 */
export const aggressiveStrategy: Strategy = {
  name: "AggroBot",
  decide(task: ChainTask): StrategyDecision {
    // 总是执行，大幅偏移
    if (task.taskType === TaskType.Arbitrage) {
      return { shouldExecute: true, direction: task.targetPrice * 2n };
    }
    if (task.taskType === TaskType.Rebalance) {
      return { shouldExecute: true, proposedRatio: task.threshold + 15n };
    }
    return { shouldExecute: true };
  },
};

export const ALL_STRATEGIES: Strategy[] = [
  momentumStrategy,
  meanRevertStrategy,
  randomStrategy,
  conservativeStrategy,
  aggressiveStrategy,
];
